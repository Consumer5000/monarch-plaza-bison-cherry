/**
 * Local-only folder API. Active when the desktop starter sets DRIFT_LOCAL=1.
 * The hosted preview never loads this plugin, so it cannot read the disk.
 */
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir, readFile, readdir, realpath, rename, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import exifr from "exifr";

const IMAGE = /\.(jpe?g|png|webp|gif|avif)$/i;
const HEIC = /\.(heic|heif)$/i;
const MAX_PHOTOS = 2000;
const MAX_MARKS_BYTES = 2_000_000;

let currentFolder = null;
let sharpMod;

export function resolveInside(root, rel) {
  if (typeof rel !== "string" || !rel || rel.includes("\0")) return null;
  if (path.isAbsolute(rel)) return null;
  const rootAbs = path.resolve(root);
  const abs = path.resolve(rootAbs, rel);
  const diff = path.relative(rootAbs, abs);
  if (!diff || diff.startsWith("..") || path.isAbsolute(diff)) return null;
  return abs;
}

function configFile() {
  return path.join(homedir(), ".drift-hall", "config.json");
}

function thumbDir() {
  return path.join(homedir(), ".drift-hall", "thumbs");
}

async function readConfig() {
  try {
    const parsed = JSON.parse(await readFile(configFile(), "utf8"));
    return typeof parsed.folder === "string" ? parsed.folder : null;
  } catch {
    return null;
  }
}

async function saveConfig(folder) {
  const file = configFile();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify({ folder }, null, 2));
}

function insideRoot(rootReal, fileReal) {
  const diff = path.relative(rootReal, fileReal);
  return diff === "" || (!diff.startsWith("..") && !path.isAbsolute(diff));
}

async function directoryOrNull(input) {
  try {
    const abs = path.resolve(input);
    const info = await stat(abs);
    if (!info.isDirectory()) return null;
    return await realpath(abs);
  } catch {
    return null;
  }
}

async function rememberInitialFolder() {
  const fromEnv = process.env.DRIFT_FOLDER;
  if (fromEnv) {
    const dir = await directoryOrNull(fromEnv);
    if (dir) {
      await saveConfig(dir);
      return dir;
    }
  }
  const saved = await readConfig();
  if (!saved) return null;
  return directoryOrNull(saved);
}

function statusBody() {
  return {
    local: true,
    folder: currentFolder,
    name: currentFolder ? path.basename(currentFolder) : "",
  };
}

function sendJson(res, code, body) {
  const payload = JSON.stringify(body);
  res.statusCode = code;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("content-length", Buffer.byteLength(payload));
  res.end(payload);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function runCommand(command, args) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, { windowsHide: true });
    } catch {
      resolve({ code: 1, out: "" });
      return;
    }
    const chunks = [];
    child.stdout?.on("data", (chunk) => chunks.push(chunk));
    child.on("error", () => resolve({ code: 1, out: "" }));
    child.on("close", (code) => {
      resolve({ code: code ?? 1, out: Buffer.concat(chunks).toString("utf8").trim() });
    });
  });
}

async function pickFolder() {
  if (process.platform === "darwin") {
    const result = await runCommand("osascript", [
      "-e",
      'POSIX path of (choose folder with prompt "Choose the folder of photos for Drift Hall")',
    ]);
    return result.code === 0 ? result.out.replace(/\/$/, "") : null;
  }
  if (process.platform === "win32") {
    const result = await runCommand("powershell.exe", [
      "-NoProfile",
      "-STA",
      "-Command",
      "Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description = 'Choose the folder of photos for Drift Hall'; if ($d.ShowDialog() -eq 'OK') { $d.SelectedPath }",
    ]);
    return result.code === 0 && result.out ? result.out.split(/\r?\n/).pop()?.trim() || null : null;
  }
  for (const [command, args] of [
    ["zenity", ["--file-selection", "--directory", "--title=Choose a folder of photos"]],
    ["kdialog", ["--getexistingdirectory", homedir(), "Choose a folder of photos"]],
  ]) {
    const result = await runCommand(command, args);
    if (result.code === 0 && result.out) return result.out.replace(/\/$/, "");
  }
  return null;
}

async function canWrite(dir) {
  try {
    await access(dir, 2);
    return true;
  } catch {
    return false;
  }
}

async function listPhotos(root) {
  const rootReal = await realpath(root);
  const photos = [];
  let skippedHeic = 0;
  let capped = false;

  async function consider(abs) {
    if (HEIC.test(abs)) {
      skippedHeic += 1;
      return;
    }
    if (!IMAGE.test(abs)) return;
    let info;
    let fileReal;
    try {
      info = await stat(abs);
      fileReal = await realpath(abs);
    } catch {
      return;
    }
    if (!info.isFile() || !insideRoot(rootReal, fileReal)) return;
    if (photos.length >= MAX_PHOTOS) {
      capped = true;
      return;
    }
    const relative = path.relative(root, abs).split(path.sep).join("/");
    const parts = relative.split("/");
    photos.push({
      id: `local|${relative}`,
      name: parts[parts.length - 1] || relative,
      folder: parts.length > 1 ? parts[parts.length - 2] : path.basename(root),
      relative,
      bytes: info.size,
      mtime: info.mtimeMs,
      taken: info.mtimeMs,
    });
  }

  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    const files = [];
    const dirs = [];
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "DriftHall") continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) dirs.push(abs);
      else if (entry.isFile()) files.push(abs);
    }
    const queue = files.slice();
    async function worker() {
      while (queue.length) {
        const abs = queue.pop();
        if (abs) await consider(abs);
      }
    }
    await Promise.all(Array.from({ length: Math.min(16, Math.max(files.length, 1)) }, () => worker()));
    for (const child of dirs) {
      if (capped && photos.length >= MAX_PHOTOS) break;
      await walk(child);
    }
  }

  await walk(root);
  if (photos.length > MAX_PHOTOS) {
    capped = true;
    photos.length = MAX_PHOTOS;
  }
  photos.sort((a, b) => a.relative.localeCompare(b.relative));
  return { photos, skippedHeic, capped, writable: await canWrite(root) };
}

async function enrichDates(root, photos) {
  const updates = [];
  let cursor = 0;
  async function worker() {
    while (cursor < photos.length) {
      const index = cursor;
      cursor += 1;
      const photo = photos[index];
      const abs = resolveInside(root, photo.relative);
      if (!abs) continue;
      try {
        const tags = await exifr.parse(abs, {
          pick: ["DateTimeOriginal", "CreateDate", "ModifyDate"],
          reviveValues: true,
        });
        const raw = tags?.DateTimeOriginal ?? tags?.CreateDate ?? tags?.ModifyDate;
        const taken = raw instanceof Date ? raw.getTime() : typeof raw === "string" ? Date.parse(raw) : NaN;
        if (!Number.isNaN(taken)) updates.push({ id: photo.id, taken });
      } catch {
        /* keep the file date */
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(8, Math.max(photos.length, 1)) }, () => worker()));
  return updates;
}

function thumbWidth(raw) {
  const n = Number(raw);
  if (n >= 1100) return 1280;
  if (n >= 800) return 960;
  if (n >= 480) return 640;
  return 320;
}

async function loadSharp() {
  if (sharpMod !== undefined) return sharpMod;
  try {
    const mod = await import("sharp");
    sharpMod = mod.default;
  } catch {
    sharpMod = null;
  }
  return sharpMod;
}

let sharpActive = 0;
const sharpWaiters = [];

function takeSharpSlot() {
  if (sharpActive < 2) {
    sharpActive += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => sharpWaiters.push(resolve));
}

function releaseSharpSlot() {
  sharpActive -= 1;
  const next = sharpWaiters.shift();
  if (next) {
    sharpActive += 1;
    next();
  }
}

function mimeOf(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".avif") return "image/avif";
  return "image/jpeg";
}

async function resolvedFile(rel) {
  if (!currentFolder) return null;
  const abs = resolveInside(currentFolder, rel);
  if (!abs) return null;
  try {
    const fileReal = await realpath(abs);
    const rootReal = await realpath(currentFolder);
    if (!insideRoot(rootReal, fileReal)) return null;
    const info = await stat(fileReal);
    if (!info.isFile()) return null;
    return { abs: fileReal, info };
  } catch {
    return null;
  }
}

async function sendThumb(res, rel, width) {
  const file = await resolvedFile(rel);
  if (!file) {
    sendJson(res, 404, { error: "That picture is not in the open folder." });
    return;
  }
  const sharp = await loadSharp();
  if (!sharp) {
    res.statusCode = 200;
    res.setHeader("content-type", mimeOf(file.abs));
    res.setHeader("cache-control", "private, max-age=3600");
    createReadStream(file.abs).pipe(res);
    return;
  }
  const key = createHash("sha1")
    .update(`${file.abs}|${file.info.mtimeMs}|${file.info.size}|${width}`)
    .digest("hex");
  const dest = path.join(thumbDir(), `${key}.jpg`);
  try {
    await stat(dest);
  } catch {
    await takeSharpSlot();
    try {
      await mkdir(thumbDir(), { recursive: true });
      const tmp = `${dest}.${process.pid}.${Date.now()}.part`;
      await sharp(file.abs)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .jpeg({ quality: 74 })
        .toFile(tmp);
      await rename(tmp, dest);
    } finally {
      releaseSharpSlot();
    }
  }
  const buf = await readFile(dest);
  res.statusCode = 200;
  res.setHeader("content-type", "image/jpeg");
  res.setHeader("content-length", buf.length);
  res.setHeader("cache-control", "public, max-age=31536000, immutable");
  res.end(buf);
}

function marksPath() {
  return currentFolder ? path.join(currentFolder, "DriftHall", "marks.json") : null;
}

async function handle(req, res) {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (!url.pathname.startsWith("/api/local/")) return false;
  const method = (req.method ?? "GET").toUpperCase();

  if (url.pathname === "/api/local/status" && method === "GET") {
    sendJson(res, 200, statusBody());
    return true;
  }

  if (url.pathname === "/api/local/open" && method === "POST") {
    let body = {};
    try {
      body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
    } catch {
      sendJson(res, 400, { ...statusBody(), error: "That folder could not be opened." });
      return true;
    }
    let picked = typeof body.path === "string" ? body.path.trim() : "";
    if (!picked && body.pick) {
      picked = (await pickFolder()) ?? "";
      if (!picked) {
        sendJson(res, 200, {
          ...statusBody(),
          error: "No folder window opened. In Library, paste the folder path instead.",
        });
        return true;
      }
    }
    const dir = picked ? await directoryOrNull(picked) : null;
    if (!dir) {
      sendJson(res, 400, { ...statusBody(), error: "That folder could not be opened." });
      return true;
    }
    currentFolder = dir;
    await saveConfig(dir);
    sendJson(res, 200, statusBody());
    return true;
  }

  if (!currentFolder) {
    sendJson(res, 404, { error: "Choose a folder first." });
    return true;
  }

  if (url.pathname === "/api/local/manifest" && method === "GET") {
    const listed = await listPhotos(currentFolder);
    sendJson(res, 200, {
      name: path.basename(currentFolder),
      folder: currentFolder,
      ...listed,
    });
    return true;
  }

  if (url.pathname === "/api/local/dates" && method === "GET") {
    const listed = await listPhotos(currentFolder);
    const updates = await enrichDates(currentFolder, listed.photos);
    sendJson(res, 200, { updates });
    return true;
  }

  if (url.pathname === "/api/local/thumb" && method === "GET") {
    await sendThumb(res, url.searchParams.get("p") ?? "", thumbWidth(url.searchParams.get("w")));
    return true;
  }

  if (url.pathname === "/api/local/marks" && method === "GET") {
    try {
      const parsed = JSON.parse(await readFile(marksPath(), "utf8"));
      sendJson(res, 200, parsed);
    } catch {
      sendJson(res, 404, { error: "No marks file yet." });
    }
    return true;
  }

  if (url.pathname === "/api/local/marks" && method === "POST") {
    const buf = await readBody(req);
    if (buf.length > MAX_MARKS_BYTES) {
      sendJson(res, 413, { error: "Those marks are too large to save." });
      return true;
    }
    let parsed;
    try {
      parsed = JSON.parse(buf.toString("utf8"));
    } catch {
      sendJson(res, 400, { error: "Those marks could not be read." });
      return true;
    }
    if (!parsed || parsed.version !== 1 || !parsed.marks || !Array.isArray(parsed.albums)) {
      sendJson(res, 400, { error: "Those marks could not be read." });
      return true;
    }
    const file = marksPath();
    await mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.part`;
    await writeFile(tmp, JSON.stringify(parsed, null, 2));
    await rename(tmp, file);
    sendJson(res, 200, { ok: true });
    return true;
  }

  sendJson(res, 404, { error: "Unknown local request." });
  return true;
}

export function localFolderPlugin() {
  return {
    name: "drift-hall-local-folder",
    apply: "serve",
    enforce: "pre",
    async configureServer(server) {
      currentFolder = await rememberInitialFolder();
      server.middlewares.use((req, res, next) => {
        const pathOnly = (req.url ?? "").split("?", 1)[0] ?? "";
        if (!pathOnly.startsWith("/api/local/")) {
          next();
          return;
        }
        void handle(req, res).catch((error) => {
          console.error("[drift-hall] local folder request failed:", error);
          if (!res.headersSent) sendJson(res, 500, { error: "Could not read that folder." });
        });
      });
    },
  };
}
