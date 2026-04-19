import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export default async function globalTeardown() {
  const repoRoot = process.cwd();
  const backendRoot = process.env.SOTERRA_BACKEND_ROOT ?? path.resolve(repoRoot, "..", "backend");
  const pidFile = path.join(backendRoot, "artifacts", "backend", "playwright-e2e.pids.json");
  if (!fs.existsSync(pidFile)) return;

  const payload = JSON.parse(fs.readFileSync(pidFile, "utf-8")) as {
    procs: Array<{ pid: number; name: string }>;
  };

  for (const proc of payload.procs ?? []) {
    try {
      execSync(`taskkill /PID ${proc.pid} /T /F`, { stdio: "ignore" });
    } catch {
      // ignore
    }
  }

  try {
    fs.rmSync(pidFile, { force: true });
  } catch {
    // ignore
  }
}
