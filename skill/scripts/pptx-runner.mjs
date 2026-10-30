// pptx-runner.mjs — invokes the python-pptx builder inside tooling-py/.venv.
// If the venv is missing, it is created on the fly (documented in tooling-py/README.md).
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".."); // repo root
const PY_DIR = join(ROOT, "tooling-py");
const VENV = join(PY_DIR, ".venv");

export function runPython(args) {
  let python;
  if (process.platform === "win32") {
    python = join(VENV, "Scripts", "python.exe");
  } else {
    python = join(VENV, "bin", "python");
  }
  if (!existsSync(python)) {
    mkdirSync(PY_DIR, { recursive: true });
    console.error("slidewalk: python venv not found — creating tooling-py/.venv (one-time setup)...");
    const r = spawnSync("python3", ["-m", "venv", VENV], { stdio: "inherit" });
    if (r.status !== 0) process.exit(r.status ?? 1);
    const pip = spawnSync(python, ["-m", "pip", "install", "--quiet", "python-pptx==1.0.2"], { stdio: "inherit" });
    if (pip.status !== 0) process.exit(pip.status ?? 1);
  }
  const script = join(ROOT, "skill", "scripts", "build-pptx.py");
  const res = spawnSync(python, [script, ...args], { stdio: "inherit" });
  return res.status ?? 1;
}
