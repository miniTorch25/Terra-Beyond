import { test, expect } from "@playwright/test";

test("dropped items show a 90-second countdown and matching drops stack", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto("/");
  const mine = page.locator("#mine-button");
  for (let i = 0; i < 10; i += 1) await mine.click();
  await page.locator("#inventory-open").click();
  const grassSlot = page.locator('.inventory-slot[data-item-id="item_grass"]');
  await expect(grassSlot.locator(".item-count")).toHaveText("2");

  await grassSlot.locator(".inventory-item-button").click();
  const first = page.locator(".world-item").first();
  await expect(first.locator(".world-item-timer")).toHaveText("90s");
  await first.evaluate(node => { node.style.left = "110px"; node.style.top = "130px"; });

  await grassSlot.locator(".inventory-item-button").click();
  const second = page.locator(".world-item").last();
  await expect(second).toBeVisible();
  const from = await second.boundingBox();
  const to = await first.boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 5 });
  await page.mouse.up();

  await expect(page.locator(".world-item")).toHaveCount(1);
  await expect(first.locator(".world-item-stack")).toHaveText("x2");
  await expect(first.locator(".world-item-timer")).toHaveText("90s");
});
