/**
 * Runs Next with a single Node version end-to-end.
 *
 * 1) On Windows, if this script was started with Cursor's bundled Node, re-exec
 *    using %ProgramFiles%\nodejs\node.exe when present so native addons match
 *    the project's Node 20 install (better-sqlite3 prebuild is ABI-specific).
 * 2) Prepends that node's directory to PATH so next/cmd workers do not pick a
 *    different node.exe from PATH.
 */
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function preferredNodeOnWindows() {
  if (process.platform !== "win32") return null;
  const exe = process.execPath;
  const looksLikeCursor =
    /[\\/]cursor[\\/]/i.test(exe) || /resources[\\/]helpers[\\/]node/i.test(exe);
  if (!looksLikeCursor) return null;

  const candidates = [
    process.env.FEDYA_NODE_EXE,
    path.join(process.env.ProgramFiles ?? "C:\\Program Files", "nodejs", "node.exe"),
    path.join(process.env["ProgramFiles(x86)"] ?? "", "nodejs", "node.exe"),
  ].filter(Boolean);

  for (const c of candidates) {
    try {
      if (c && fs.existsSync(c)) return path.resolve(c);
    } catch {
      /* ignore */
    }
  }
  return null;
}

const preferred = preferredNodeOnWindows();
if (
  preferred &&
  path.resolve(preferred) !== path.resolve(process.execPath)
) {
  const result = spawnSync(preferred, [__filename, ...process.argv.slice(2)], {
    stdio: "inherit",
    env: process.env,
    windowsHide: false,
  });
  process.exit(result.status === null ? 1 : result.status);
}

const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
const nodeDir = path.dirname(process.execPath);
const oldPath = process.env.PATH || process.env.Path || "";
const mergedPath = `${nodeDir}${path.delimiter}${oldPath}`;

const env = {
  ...process.env,
  PATH: mergedPath,
  Path: mergedPath,
};

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: node scripts/run-next.cjs <dev|build|start> [args...]");
  process.exit(1);
}

const child = spawn(process.execPath, [nextBin, ...args], {
  stdio: "inherit",
  env,
  windowsHide: false,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code === null ? 1 : code);
});
