/**
 * Rebuilds better-sqlite3 with the same Node that run-next.cjs uses (see resolve-project-node.cjs).
 * On Windows, never falls back to Cursor's bundled Node — that causes ABI 127 vs 115 mismatches.
 *
 * Uses `prebuild-install --force` when available so a stale npm prebuild cache (e.g. node-v127)
 * cannot satisfy `npm rebuild` while the project runs on Node 20 (node-v115).
 *
 * Override: FEDYA_NODE_EXE = full path to node.exe
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { projectNodeCandidates, resolveProjectNodeExe } = require("./resolve-project-node.cjs");

const projectRoot = path.join(__dirname, "..");

function printWindowsHelpAndExit() {
  console.error("[fedya] Could not find a project Node.js for rebuilding better-sqlite3.");
  console.error(`[fedya] Tried: ${projectNodeCandidates().join(", ") || "(no candidates)"}`);
  console.error(
    "[fedya] Install Node.js (e.g. to Program Files\\nodejs) or set environment variable FEDYA_NODE_EXE to node.exe.",
  );
  process.exit(1);
}

function nodeForRebuild() {
  if (process.platform === "win32") {
    const resolved = resolveProjectNodeExe();
    if (!resolved) printWindowsHelpAndExit();
    return resolved;
  }
  return resolveProjectNodeExe() || process.execPath;
}

function withPathPrependedToNode(nodeDir) {
  const old = process.env.PATH || process.env.Path || "";
  const merged = `${nodeDir}${path.delimiter}${old}`;
  return { ...process.env, PATH: merged, Path: merged };
}

function runRebuild() {
  const nodeExe = nodeForRebuild();
  const nodeDir = path.dirname(nodeExe);
  const env = withPathPrependedToNode(nodeDir);

  const betterSqliteDir = path.join(projectRoot, "node_modules", "better-sqlite3");
  const prebuildBin =
    [path.join(projectRoot, "node_modules", "prebuild-install", "bin.js"), path.join(betterSqliteDir, "node_modules", "prebuild-install", "bin.js")].find(
      (p) => fs.existsSync(p),
    ) ?? null;

  if (prebuildBin && fs.existsSync(betterSqliteDir)) {
    const r = spawnSync(nodeExe, [prebuildBin, "--force"], {
      cwd: betterSqliteDir,
      stdio: "inherit",
      env,
      windowsHide: false,
    });
    process.exit(r.status === null ? 1 : r.status);
  }

  const npmCli = path.join(nodeDir, "node_modules", "npm", "bin", "npm-cli.js");
  if (fs.existsSync(npmCli)) {
    const r = spawnSync(nodeExe, [npmCli, "rebuild", "better-sqlite3"], {
      cwd: projectRoot,
      stdio: "inherit",
      env,
      windowsHide: false,
    });
    process.exit(r.status === null ? 1 : r.status);
  }

  const npmCmd =
    process.platform === "win32" ? path.join(nodeDir, "npm.cmd") : path.join(nodeDir, "npm");
  if (fs.existsSync(npmCmd)) {
    const r = spawnSync(npmCmd, ["rebuild", "better-sqlite3"], {
      cwd: projectRoot,
      stdio: "inherit",
      env,
      windowsHide: false,
    });
    process.exit(r.status === null ? 1 : r.status);
  }

  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["rebuild", "better-sqlite3"], {
    cwd: projectRoot,
    stdio: "inherit",
    shell: true,
    env,
  });
  process.exit(r.status === null ? 1 : r.status);
}

runRebuild();
