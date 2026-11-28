import { test, expect } from "@playwright/test";

test("breaking a Grass block grants one Grass item in the Inventory UI", async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto("/");

  const blockImage = page.locator("#block-image");
  await expect(blockImage).toHaveAttribute("src", "./sprites/block/plains/grass.png");
  await expect(blockImage).toHaveJSProperty("complete", true);
  await expect.poll(() => blockImage.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);

  const mineButton = page.locator("#mine-button");
  await expect(page.locator("#block-name")).toHaveText("Grass");
  for (let hit = 0; hit < 4; hit += 1) {
    await mineButton.click();
  }
  await expect(page.locator("#hp-current")).toHaveText("1");
  await expect(page.locator("#helper-text")).toContainText("1 HP remaining");

  await mineButton.click();
  await expect(page.locator("#helper-text")).toContainText("Grass +1");
  await expect(page.locator("#block-name")).toHaveText("Grass");

  await page.locator("#inventory-open").click();
  const grassCount = page.locator('.inventory-slot[data-item-id="item_grass"] .item-count');
  await expect(grassCount).toHaveText("1");
});

test("Map displays the Tundra unlock price with an Emerald icon", async ({ page }) => {
  await page.goto("/");
  await page.locator("#map-open").click();
  const unlock = page.locator('[data-biome-visit="tundra"]');
  await expect(unlock).toContainText("75");
  await expect(unlock.locator("img")).toHaveAttribute("src", "./sprites/item/plains/emerald.png");
  await expect(unlock).toBeEnabled();
});
