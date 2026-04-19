import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

type ProcInfo = { pid: number; name: string };

function backendRoot(frontendRoot: string) {
  return process.env.SOTERRA_BACKEND_ROOT ?? path.resolve(frontendRoot, "..", "backend");
}

async function waitForOk(url: string, timeoutMs: number) {
  const started = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const response = await fetch(url, { headers: { accept: "application/json" } });
      if (response.ok) return;
    } catch {
      // ignore
    }
    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timed out waiting for ${url}`);
    }
  await new Promise((r) => setTimeout(r, 500));
  }
}

async function isOk(url: string) {
  try {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    return response.ok;
  } catch {
    return false;
  }
}

export default async function globalSetup() {
  const repoRoot = process.cwd();
  const backendProjectRoot = backendRoot(repoRoot);
  const artifactsDir = path.join(backendProjectRoot, "artifacts", "backend");
  const dbPath = path.join(artifactsDir, "playwright-e2e.sqlite3");
  const storageDir = path.join(artifactsDir, "playwright-e2e-storage");
  const pidFile = path.join(artifactsDir, "playwright-e2e.pids.json");

  fs.mkdirSync(artifactsDir, { recursive: true });
  // If servers are already running locally, reuse them rather than spawning duplicates.
  const backendUp = await isOk("http://127.0.0.1:8001/health");
  const frontendUp = await isOk("http://127.0.0.1:3000");
  if (backendUp && frontendUp) {
    if (fs.existsSync(pidFile)) fs.rmSync(pidFile, { force: true });
    return;
  }

  fs.rmSync(dbPath, { force: true });
  fs.rmSync(storageDir, { recursive: true, force: true });

  const pythonExe = path.join(backendProjectRoot, ".venv", "Scripts", "python.exe");

  const commonBackendEnv = {
    ...process.env,
    SOTERRA_REPOSITORY_MODE: "sqlite",
    SOTERRA_STORAGE_MODE: "local",
    SOTERRA_LOCAL_DB_PATH: dbPath,
    SOTERRA_LOCAL_STORAGE_DIR: storageDir,
    SOTERRA_PROCESS_INLINE: "false",
    // Keep E2E fast and deterministic; model extraction remains disabled.
    SOTERRA_EXTRACTOR_MODE: "demo",
    SOTERRA_ALLOW_MODEL_EXTRACTION: "false",
  };

  const backend = spawn(
    pythonExe,
    ["-m", "uvicorn", "soterra_backend.api:app", "--host", "127.0.0.1", "--port", "8001"],
    { cwd: backendProjectRoot, env: commonBackendEnv, stdio: "inherit" }
  );

  const frontend = spawn("npm", ["run", "dev"], {
    cwd: repoRoot,
    env: { ...process.env, PORT: "3000" },
    stdio: "inherit",
    shell: true,
  });

  const procs: ProcInfo[] = [];
  if (backend.pid) procs.push({ pid: backend.pid, name: "backend" });
  if (frontend.pid) procs.push({ pid: frontend.pid, name: "frontend" });
  fs.writeFileSync(pidFile, JSON.stringify({ procs }, null, 2), "utf-8");

  await waitForOk("http://127.0.0.1:8001/health", 60_000);
  await waitForOk("http://127.0.0.1:3000", 90_000);
}
