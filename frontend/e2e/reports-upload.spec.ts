import { expect, test } from "playwright/test";
import fs from "node:fs";
import path from "node:path";

test.setTimeout(6 * 60_000);

function findFixturePdf(): string {
  const repoRoot = process.cwd();
  const backendRoot = process.env.SOTERRA_BACKEND_ROOT ?? path.resolve(repoRoot, "..", "backend");
  const storageRoot = path.join(backendRoot, "artifacts", "backend", "storage");
  if (!fs.existsSync(storageRoot)) {
    throw new Error("Missing artifacts/backend/storage fixture directory.");
  }

  const stack: string[] = [storageRoot];
  const pdfs: string[] = [];

  while (stack.length) {
    const dir = stack.pop()!;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) pdfs.push(fullPath);
    }
  }

  if (!pdfs.length) throw new Error("No PDF fixtures found under artifacts/backend/storage.");
  const preferred = pdfs.find((p) => p.includes("Fire Inspection - 07 Kauri Apartments"));
  return preferred ?? pdfs.sort()[0];
}

test("upload report, prevent duplicates, render extracted data", async ({ page, request }) => {
  const pdfPath = findFixturePdf();

  const before = await request.get("http://127.0.0.1:8001/reports");
  expect(before.ok()).toBeTruthy();
  const beforeJson = await before.json();
  const beforeCount = Array.isArray(beforeJson?.items) ? beforeJson.items.length : 0;

  // App routes under /app/* are protected by middleware via a simple cookie check.
  // Set both cookie + localStorage ahead of navigation to avoid relying on the sign-in UI in E2E.
  await page.addInitScript(() => {
    localStorage.setItem("soterra_auth", "true");
  });
  await page.context().addCookies([
    { name: "soterra_auth", value: "true", url: "http://127.0.0.1:3000" },
  ]);

  await page.goto("/app/reports", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Upload Report" }).click();

  await page.setInputFiles('input[name="file"]', pdfPath);
  await page.fill('input[name="project"]', "Kauri Apartments");
  await page.fill('input[name="site"]', "Kauri Apartments");
  await page.fill('input[name="trade"]', "General");
  await page.fill('input[name="inspector"]', "E2E Tester");

  await page.getByRole("button", { name: "Upload report" }).click();
  // Don't rely on a specific response event; instead, wait for backend to show a new report row.
  const uploadStarted = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const after = await request.get("http://127.0.0.1:8001/reports");
    if (after.ok()) {
      const json = await after.json();
      const count = Array.isArray(json?.items) ? json.items.length : 0;
      if (count >= beforeCount + 1) break;
    }
    if (Date.now() - uploadStarted > 2 * 60_000) {
      throw new Error("Timed out waiting for backend to register the uploaded report.");
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 120_000 });
  await expect(page.locator("h1", { hasText: "Reports" })).toBeVisible();

  const afterFirst = await request.get("http://127.0.0.1:8001/reports");
  const afterFirstJson = await afterFirst.json();
  const afterFirstCount = Array.isArray(afterFirstJson?.items) ? afterFirstJson.items.length : 0;
  expect(afterFirstCount).toBe(beforeCount + 1);

  // Upload the same PDF again; backend should mark it duplicate and keep counts stable.
  await page.getByRole("button", { name: "Upload Report" }).click();
  await page.setInputFiles('input[name="file"]', pdfPath);
  await page.fill('input[name="project"]', "Kauri Apartments");
  await page.fill('input[name="site"]', "Kauri Apartments");
  await page.getByRole("button", { name: "Upload report" }).click();

  const afterSecond = await request.get("http://127.0.0.1:8001/reports");
  const afterSecondJson = await afterSecond.json();
  const afterSecondCount = Array.isArray(afterSecondJson?.items) ? afterSecondJson.items.length : 0;
  expect(afterSecondCount).toBe(afterFirstCount);

  // Navigate into the latest report and ensure extracted issues render on the detail page.
  // In async mode, extraction may still be running; poll backend until findings appear.
  const newestId = afterFirstJson.items[0]?.id;
  expect(typeof newestId).toBe("string");

  const started = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const detail = await request.get(`http://127.0.0.1:8001/reports/${newestId}`);
    const payload = await detail.json();
    const issues = payload?.item?.issues ?? [];
    const status = payload?.item?.status ?? "";
    if (Array.isArray(issues) && issues.length > 0) break;
    if (Date.now() - started > 4 * 60_000) {
      throw new Error(`Timed out waiting for extraction. status=${status}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  await page.goto(`/app/reports/${newestId}`);
  await expect(page.getByRole("heading", { name: "Issue register" })).toBeVisible();
  await expect(page.getByText("items identified")).toBeVisible();
});
