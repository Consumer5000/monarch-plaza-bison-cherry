import type { Photo } from "./types";
import { isSaved, kvGet, kvSet, type Saved } from "./persist";

const IMAGE = /\.(jpe?g|png|webp|gif|avif)$/i;
const HEIC = /\.(heic|heif)$/i;

let currentDir: FileSystemDirectoryHandle | null = null;

export function directoryHandle() {
  return currentDir;
}

export function rememberDirectory(dir: FileSystemDirectoryHandle | null) {
  currentDir = dir;
}

const folders = new WeakMap<File, string>();

function folderOf(file: File) {
  const known = folders.get(file);
  if (known) return known;
  const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  if (rel && rel.includes("/")) {
    const parts = rel.split("/").filter(Boolean);
    return parts.length > 1 ? parts[parts.length - 2]! : "Library";
  }
  return "Library";
}

async function readTaken(file: File): Promise<number | null> {
  try {
    const exifr = await import("exifr");
    const tags = (await exifr.parse(file, {
      pick: ["DateTimeOriginal", "CreateDate", "ModifyDate"],
      reviveValues: true,
    })) as { DateTimeOriginal?: unknown; CreateDate?: unknown; ModifyDate?: unknown } | undefined;
    const raw = tags?.DateTimeOriginal ?? tags?.CreateDate ?? tags?.ModifyDate;
    if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw.getTime();
    if (typeof raw === "string") {
      const t = Date.parse(raw);
      if (!Number.isNaN(t)) return t;
    }
  } catch {
    /* fall back to the file date */
  }
  return null;
}

export async function photosFromFiles(
  files: File[],
  onProgress: (message: string) => void,
): Promise<{ photos: Photo[]; skippedHeic: number; capped: boolean }> {
  const skippedHeic = files.filter((file) => HEIC.test(file.name)).length;
  const images = files.filter((file) => IMAGE.test(file.name) && !file.name.startsWith("."));
  const capped = images.length > 2000;
  const queue = images.slice(0, 2000);
  const photos: Photo[] = new Array(queue.length);
  let cursor = 0;
  let done = 0;

  async function worker() {
    while (cursor < queue.length) {
      const index = cursor;
      cursor += 1;
      const file = queue[index]!;
      const taken = (await readTaken(file)) ?? file.lastModified;
      photos[index] = {
        id: `${file.name}|${file.size}|${file.lastModified}`,
        name: file.name,
        folder: folderOf(file),
        url: URL.createObjectURL(file),
        bytes: file.size,
        mtime: file.lastModified,
        taken,
        caption: "",
        blobUrl: true,
      };
      done += 1;
      if (done % 12 === 0 || done === queue.length) {
        onProgress(`Reading dates ${done} of ${queue.length}`);
      }
    }
  }

  onProgress(queue.length ? `Reading dates 0 of ${queue.length}` : "No images in that folder");
  await Promise.all(Array.from({ length: Math.min(6, Math.max(queue.length, 1)) }, () => worker()));
  return { photos: photos.filter(Boolean), skippedHeic, capped };
}

export async function loadDemo(): Promise<Photo[]> {
  const response = await fetch("/demo/manifest.json");
  if (!response.ok) throw new Error("Demo library is missing");
  const items = (await response.json()) as { file: string; taken: string; place: string; bytes: number }[];
  return items.map((item) => ({
    id: `demo|${item.file}`,
    name: item.file,
    folder: "Demo library",
    url: `/demo/${item.file}`,
    bytes: item.bytes,
    mtime: Date.parse(`${item.taken}T12:00:00`),
    taken: Date.parse(`${item.taken}T12:00:00`),
    caption: item.place,
    blobUrl: false,
  }));
}

async function walkEntry(entry: FileSystemEntry, folder: string, out: File[]) {
  if (entry.name.startsWith(".") || entry.name === "DriftHall") return;
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      (entry as FileSystemFileEntry).file(resolve, reject);
    });
    folders.set(file, folder || "Library");
    out.push(file);
    return;
  }
  if (!entry.isDirectory) return;
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const next = folder ? `${folder}` : entry.name;
  const children: FileSystemEntry[] = [];
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
    if (!batch.length) break;
    children.push(...batch);
  }
  for (const child of children) {
    const childFolder = child.isFile ? next : next;
    await walkEntry(child, child.isDirectory ? child.name : childFolder, out);
  }
}

export async function filesFromDataTransfer(transfer: DataTransfer): Promise<File[]> {
  const entries: FileSystemEntry[] = [];
  for (const item of transfer.items) {
    const entry = item.webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }
  if (!entries.length) return [...transfer.files];
  const out: File[] = [];
  for (const entry of entries) {
    await walkEntry(entry, entry.isDirectory ? entry.name : "Library", out);
  }
  return out;
}

export async function filesFromDirectory(dir: FileSystemDirectoryHandle): Promise<File[]> {
  const out: File[] = [];
  async function walk(handle: FileSystemDirectoryHandle, folder: string) {
    for await (const [name, child] of handle.entries()) {
      if (name.startsWith(".") || name === "DriftHall") continue;
      if (child.kind === "file") {
        if (!IMAGE.test(name) && !HEIC.test(name)) continue;
        const file = await child.getFile();
        folders.set(file, folder || "Library");
        out.push(file);
      } else {
        await walk(child, name);
      }
    }
  }
  await walk(dir, dir.name);
  return out;
}

export async function readFolderMarks(dir: FileSystemDirectoryHandle): Promise<Saved | null> {
  try {
    const sub = await dir.getDirectoryHandle("DriftHall");
    const handle = await sub.getFileHandle("marks.json");
    const file = await handle.getFile();
    const parsed: unknown = JSON.parse(await file.text());
    return isSaved(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeFolderMarks(payload: Saved): Promise<void> {
  if (!currentDir) throw new Error("Open a folder with the directory picker to write marks back.");
  const sub = await currentDir.getDirectoryHandle("DriftHall", { create: true });
  const handle = await sub.getFileHandle("marks.json", { create: true });
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(payload, null, 2));
  await writable.close();
}

export function supportsDirectoryPicker() {
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

export async function pickDirectory() {
  if (!supportsDirectoryPicker() || !window.showDirectoryPicker) return null;
  return window.showDirectoryPicker({ mode: "readwrite", id: "drift-hall" });
}

export async function rememberDirectoryPersistent(dir: FileSystemDirectoryHandle) {
  rememberDirectory(dir);
  try {
    await kvSet("directory", dir);
  } catch {
    /* the folder still works for this session */
  }
}

export async function storedDirectory(): Promise<FileSystemDirectoryHandle | null> {
  const value = await kvGet("directory");
  if (!value || typeof value !== "object") return null;
  const dir = value as FileSystemDirectoryHandle;
  if (dir.kind !== "directory") return null;
  return dir;
}

export function libraryNameFromFiles(files: File[]) {
  for (const file of files) {
    const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
    if (rel?.includes("/")) return rel.split("/").filter(Boolean)[0] || "Folder";
  }
  return "Folder";
}

export async function directoryPermission(
  dir: FileSystemDirectoryHandle,
  mode: "read" | "readwrite",
  request: boolean,
) {
  try {
    const ask = request ? dir.requestPermission : dir.queryPermission;
    if (!ask) return false;
    return (await ask.call(dir, { mode })) === "granted";
  } catch {
    return false;
  }
}
