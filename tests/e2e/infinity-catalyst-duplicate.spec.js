import { test, expect } from "@playwright/test";

async function openGrassDetails(page, withPrototype = true) {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto("/");
  if (withPrototype) for (let hit = 0; hit < 5; hit += 1) await page.locator("#mine-button").click();
  await page.locator("#inventory-open").click();
  await page.locator('[data-item-info="item_grass"]').click();
}

test("IC balance appears in the upper-right corner with 100 million", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#ic-balance")).toHaveText("100M");
  await expect(page.locator(".ic-balance")).toHaveCSS("position", "fixed");
});

test("duplicate confirmation charges 1 IC and grants 500 copies", async ({ page }) => {
  await openGrassDetails(page);
  await page.locator("#detail-duplicate-button").click();
  await expect(page.locator("#duplicate-confirm-overlay")).toBeVisible();
  await expect(page.locator("#duplicate-message")).toContainText("Spend 1 IC");
  await page.locator("#duplicate-confirm-button").click();
  await expect(page.locator("#ic-balance")).toHaveText("99.9M");
  await expect(page.locator("#detail-item-count")).toHaveText("501");
  await expect(page.locator("#duplicate-confirm-overlay")).toBeHidden();
});

test("duplicate cannot be confirmed without an item prototype", async ({ page }) => {
  await openGrassDetails(page, false);
  await page.locator("#detail-duplicate-button").click();
  await expect(page.locator("#duplicate-message")).toContainText("must own at least 1");
  await expect(page.locator("#duplicate-confirm-button")).toBeDisabled();
  await expect(page.locator("#ic-balance")).toHaveText("100M");
});
