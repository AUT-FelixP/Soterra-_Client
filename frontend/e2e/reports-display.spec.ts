import { expect, test } from "playwright/test";

test.setTimeout(3 * 60_000);

test("reports list + detail render backend extracted data", async ({ page, request }) => {
  const backendReports = await request.get("http://127.0.0.1:8001/reports");
  expect(backendReports.ok()).toBeTruthy();
  const reportsJson = await backendReports.json();
  const items = Array.isArray(reportsJson?.items) ? reportsJson.items : [];
  expect(items.length).toBeGreaterThan(0);

  const first = items[0] as { id: string; project: string; site: string };
  expect(typeof first.id).toBe("string");

  // Auth for /app/* is a cookie check in middleware + layout.
  await page.addInitScript(() => {
    localStorage.setItem("soterra_auth", "true");
  });
  await page.context().addCookies([{ name: "soterra_auth", value: "true", url: "http://127.0.0.1:3000" }]);

  await page.goto("/app/reports", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1", { hasText: "Reports" })).toBeVisible();
  await expect(page.getByRole("cell", { name: first.project }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: first.site }).first()).toBeVisible();

  const backendDetail = await request.get(`http://127.0.0.1:8001/reports/${first.id}`);
  expect(backendDetail.ok()).toBeTruthy();
  const detailJson = await backendDetail.json();
  const issues = detailJson?.item?.issues ?? [];

  await page.goto(`/app/reports/${first.id}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Issue register" })).toBeVisible();

  if (Array.isArray(issues) && issues.length > 0) {
    await expect(page.getByText(String(issues[0].title), { exact: false })).toBeVisible();
  }
});
