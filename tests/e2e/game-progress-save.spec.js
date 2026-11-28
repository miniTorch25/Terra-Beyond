import { test, expect } from "@playwright/test";

test("mining progress survives a page reload", async ({ page }) => {
  await page.goto("/");
  const initialBlock = await page.locator("#block-name").textContent();
  await page.locator("#mine-button").click();
  const savedHp = await page.locator("#hp-current").textContent();

  await page.reload();

  await expect(page.locator("#block-name")).toHaveText(initialBlock);
  await expect(page.locator("#hp-current")).toHaveText(savedHp);
});
