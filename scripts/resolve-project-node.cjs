/**
 * Single place to decide which node.exe should run Next and rebuild native deps
 * (better-sqlite3) so ABI stays consistent on Windows + Cursor.
 *
 * Order: FEDYA_NODE_EXE → %ProgramFiles%\nodejs\node.exe → %ProgramFiles(x86)%\nodejs\node.exe
 */
const fs = require("node:fs");
const path = require("node:path");

function looksLikeCursorBundledNode(execPath) {
  if (process.platform !== "win32") return false;
  const exe = execPath ?? "";
  return /[\\/]cursor[\\/]/i.test(exe) || /resources[\\/]helpers[\\/]node/i.test(exe);
}

function projectNodeCandidates() {
  const list = [];
  if (process.env.FEDYA_NODE_EXE) list.push(process.env.FEDYA_NODE_EXE);
  if (process.platform === "win32") {
    list.push(
      path.join(process.env.ProgramFiles ?? "C:\\Program Files", "nodejs", "node.exe"),
      path.join(process.env["ProgramFiles(x86)"] ?? "", "nodejs", "node.exe"),
    );
  }
  return list.filter(Boolean);
}

/** @returns {string | null} absolute path to node.exe if it exists */
function resolveProjectNodeExe() {
  for (const c of projectNodeCandidates()) {
    try {
      if (c && fs.existsSync(c)) return path.resolve(c);
    } catch {
      /* ignore */
    }
  }
  return null;
}

module.exports = {
  looksLikeCursorBundledNode,
  projectNodeCandidates,
  resolveProjectNodeExe,
};
