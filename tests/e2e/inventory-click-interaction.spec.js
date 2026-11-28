import { test, expect } from "@playwright/test";

async function grantGrass(page) {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto("/");
  for (let hit = 0; hit < 5; hit += 1) await page.locator("#mine-button").click();
  await page.locator("#inventory-open").click();
  await expect(page.locator('.inventory-slot[data-item-id="item_grass"] .item-count')).toHaveText("1");
}

test("item information opens only from the question-mark button", async ({ page }) => {
  await grantGrass(page);
  await page.locator('[data-item-info="item_grass"]').click();
  await expect(page.locator("#item-detail-overlay")).toBeVisible();
  await expect(page.locator("#detail-item-name")).toHaveText("Grass");
  await expect(page.locator(".world-item")).toHaveCount(0);
});

test("one click ejects an item and the ejected item can be dragged back", async ({ page }) => {
  await grantGrass(page);
  const grassSlot = page.locator('.inventory-slot[data-item-id="item_grass"]');
  await grassSlot.locator(".inventory-item-button").click();

  await expect(grassSlot.locator(".item-count")).toHaveText("0");
  const worldItem = page.locator('.world-item[aria-label*="Grass"]');
  await expect(worldItem).toHaveCount(1);

  const target = await grassSlot.boundingBox();
  const source = await worldItem.boundingBox();
  if (!target || !source) throw new Error("Could not measure item positions");
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 5 });
  await page.mouse.up();

  await expect(grassSlot.locator(".item-count")).toHaveText("1");
  await expect(page.locator(".world-item")).toHaveCount(0);
});
