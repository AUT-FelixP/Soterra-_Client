import { expect, test } from "playwright/test";

test.setTimeout(90_000);

test("reports upload file chooser opens", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("soterra_auth", "true");
  });
  await page.context().addCookies([{ name: "soterra_auth", value: "true", url: "http://127.0.0.1:3000" }]);

  await page.goto("/app/reports", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Upload Report" }).click();
  await expect(page.getByRole("heading", { name: "Upload report" })).toBeVisible();

  const input = page.locator('input[type="file"][name="file"]');
  await expect(input).toBeEnabled();

  const fileChooserPromise = page.waitForEvent("filechooser", { timeout: 10_000 });
  await page.getByRole("button", { name: "Choose file" }).click();
  const chooser = await fileChooserPromise;
  expect(chooser.isMultiple()).toBeFalsy();
});
