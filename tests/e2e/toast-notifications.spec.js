import { test, expect } from "@playwright/test";

test("mining drops show a compact icon log and expire after five seconds", async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto("/");
  for (let i = 0; i < 5; i += 1) await page.locator("#mine-button").click();

  const log = page.locator("#toast-drop-log .toast-drop-entry");
  await expect(log).toHaveCount(1);
  await expect(log.locator(".toast-drop-amount")).toHaveText("+1");
  await expect(log.locator("img")).toHaveAttribute("src", /item_grass\.png$/);
  await expect(log).toBeVisible();

  await page.clock.fastForward(5000);
  await expect(log).toHaveCount(0);
});

test("warning notifications are capped at three and expire after five seconds", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await page.locator("#craft-open").click();
  const station = page.locator('[data-station="crafting_table"]');
  for (let i = 0; i < 4; i += 1) await station.click();
  const notices = page.locator("#toast-notifications .toast-notice");
  await expect(notices).toHaveCount(3);
  await expect(notices.last()).toContainText("Not enough materials");
  await expect(notices.last()).toHaveClass(/toast-notice--warning/);

  await page.clock.fastForward(5000);
  await expect(notices).toHaveCount(0);
});


test("locked biome attempts show a red insufficient-cost notification", async ({ page }) => {
  await page.goto("/");
  await page.locator("#map-open").click();
  const unlock = page.locator('[data-biome-visit="tundra"]');
  await expect(unlock).toBeEnabled();
  await unlock.click();
  const notice = page.locator("#toast-notifications .toast-notice").last();
  await expect(notice).toContainText("Not enough Emerald");
  await expect(notice).toContainText("75");
  await expect(notice).toHaveClass(/toast-notice--danger/);
});


test("attempting an unavailable craft shows yellow resource advice", async ({ page }) => {
  await page.goto("/");
  await page.locator("#craft-open").click();
  await page.locator("#workbench-crafting").evaluate((panel) => { panel.hidden = false; });
  await page.locator("#workbench-recipes").evaluate((container) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "recipe-card";
    button.dataset.recipe = "sharp_stone";
    button.textContent = "Sharp Stone";
    container.append(button);
  });
  await page.locator('[data-recipe="sharp_stone"]').click();
  const notice = page.locator("#toast-notifications .toast-notice").last();
  await expect(notice).toHaveText("Gather the required resources before crafting this item.");
  await expect(notice).toHaveClass(/toast-notice--warning/);
});
test("attempting to drop more than 32 world items shows a yellow capacity warning", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto("/");
  const mine = page.locator("#mine-button");
  for (let i = 0; i < 165; i += 1) await mine.click();
  await page.locator("#inventory-open").click();
  const grass = page.locator('.inventory-slot[data-item-id="item_grass"] .inventory-item-button');
  for (let i = 0; i < 33; i += 1) await grass.click();
  await expect(page.locator(".world-item")).toHaveCount(32);
  const notice = page.locator("#toast-notifications .toast-notice").last();
  await expect(notice).toHaveText("The ground is full. Pick up dropped items before dropping more.");
  await expect(notice).toHaveClass(/toast-notice--warning/);
});
