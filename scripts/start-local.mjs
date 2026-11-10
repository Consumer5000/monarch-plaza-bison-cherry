/**
 * Starts Drift Hall on this computer and opens it in the browser.
 * Double-click the starter in the project folder. Leave the window open.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const viteJs = join(dirname(fileURLToPath(import.meta.url)), "..", "node_modules", "vite", "bin", "vite.js");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 8787;
const url = `http://127.0.0.1:${port}/`;

function openBrowser(target) {
  if (process.env.DRIFT_NO_OPEN === "1") return;
  const platform = process.platform;
  if (platform === "win32") {
    spawn("cmd", ["/c", "start", "", target], { detached: true, stdio: "ignore", windowsHide: true }).unref();
    return;
  }
  const command = platform === "darwin" ? "open" : "xdg-open";
  spawn(command, [target], { detached: true, stdio: "ignore" }).unref();
}

async function alreadyUp() {
  try {
    const response = await fetch(`${url}api/local/status`, { signal: AbortSignal.timeout(700) });
    if (!response.ok) return false;
    const body = await response.json();
    return body?.local === true;
  } catch {
    return false;
  }
}

function ensureDeps() {
  if (existsSync(join(root, "node_modules", "vite"))) return true;
  console.log("First-time setup. This can take a minute. Leave this window open.");
  const result = spawnSync("npm", ["install"], { cwd: root, stdio: "inherit", shell: true });
  return result.status === 0;
}

const dropped = process.argv[2];
if (await alreadyUp()) {
  if (dropped) {
    await fetch(`${url}api/local/open`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: dropped }),
    });
  }
  openBrowser(url);
  console.log("Drift Hall is already open in your browser.");
  process.exit(0);
}

if (!ensureDeps()) {
  console.log("Setup did not finish. Check the messages above, then double-click the starter again.");
  process.exit(1);
}

const env = { ...process.env, DRIFT_LOCAL: "1" };
if (dropped) env.DRIFT_FOLDER = dropped;

const child = spawn(
  process.execPath,
  [join(root, "scripts", "with-app-env.mjs"), process.execPath, viteJs, "dev"],
  {
    cwd: root,
    env,
    stdio: "inherit",
  },
);

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => child.kill(signal));
}

let opened = false;
const timer = setInterval(() => {
  if (opened) return;
  void alreadyUp().then((up) => {
    if (!up || opened) return;
    opened = true;
    clearInterval(timer);
    openBrowser(url);
    console.log("\nDrift Hall is open in your browser.");
    console.log("Leave this window open while you walk the hall. Close it when you are done.\n");
  });
}, 400);

child.on("exit", (code) => {
  clearInterval(timer);
  process.exit(code ?? 0);
});
