/**
 * Runs Next with a single Node version end-to-end.
 *
 * 1) On Windows, if started with Cursor's bundled Node, re-exec using the
 *    project Node from resolve-project-node.cjs (same as better-sqlite3 rebuild).
 * 2) Prepends that node's directory to PATH so workers do not pick another node.exe.
 * 3) Verifies better-sqlite3 loads for this Node before starting Next (clear ABI errors).
 */
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const {
  looksLikeCursorBundledNode,
  resolveProjectNodeExe,
} = require("./resolve-project-node.cjs");

const projectRoot = path.join(__dirname, "..");

if (process.platform === "win32" && looksLikeCursorBundledNode(process.execPath)) {
  const preferred = resolveProjectNodeExe();
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
}

const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const nodeDir = path.dirname(process.execPath);

function stripCursorBundledNodeDirs(pathString) {
  return (pathString || "")
    .split(path.delimiter)
    .filter(
      (seg) =>
        seg &&
        !/[\\/]cursor[\\/]/i.test(seg) &&
        !/resources[\\/]helpers/i.test(seg),
    )
    .join(path.delimiter);
}

const system32 = process.env.SystemRoot
  ? path.join(process.env.SystemRoot, "System32")
  : "";
const winRoot = process.env.SystemRoot || "";
const tailPath = stripCursorBundledNodeDirs(process.env.PATH || process.env.Path || "");
const mergedPath = [nodeDir, system32, winRoot, tailPath].filter(Boolean).join(path.delimiter);

const env = {
  ...process.env,
  PATH: mergedPath,
  Path: mergedPath,
  NODE: process.execPath,
};

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: node scripts/run-next.cjs <dev|build|start> [args...]");
  process.exit(1);
}

function verifyBetterSqliteOrExit() {
  const marker = path.join(projectRoot, "node_modules", "better-sqlite3", "package.json");
  if (!fs.existsSync(marker)) return;
  try {
    // `require('better-sqlite3')` only loads JS; the .node addon loads inside `new Database()`.
    const Database = require(path.join(projectRoot, "node_modules", "better-sqlite3"));
    const probe = new Database(":memory:");
    probe.close();
  } catch (e) {
    if (e && e.code === "ERR_DLOPEN_FAILED") {
      const npmCmd = path.join(nodeDir, "npm.cmd");
      console.error("[fedya] better-sqlite3 was built for a different Node.js ABI than this process.");
      console.error(`[fedya] This Node: ${process.execPath} (NODE_MODULE_VERSION ${process.versions.modules})`);
      console.error(`[fedya] Fix (Windows): "${npmCmd}" rebuild better-sqlite3`);
      console.error(
        "[fedya] Or set FEDYA_NODE_EXE to your dev node.exe, reinstall, and keep using npm run dev.",
      );
      process.exit(1);
    }
    throw e;
  }
}

verifyBetterSqliteOrExit();

const child = spawn(process.execPath, [nextBin, ...args], {
  stdio: "inherit",
  env,
  windowsHide: false,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code === null ? 1 : code);
});
