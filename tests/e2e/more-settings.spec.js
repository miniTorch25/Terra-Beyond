import { test, expect } from "@playwright/test";

test("More settings persist and control mining feedback, drops, and damage overlay", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.3; });
  await page.goto("/");
  await page.locator("#more-open").click();

  await page.locator("#setting-mining-feedback").uncheck();
  await page.locator("#setting-drop-notifications").uncheck();
  await page.locator("#setting-damage-overlay").uncheck();
  await page.locator("#more-open").click();
  await page.locator("#mine-button").click();

  await expect(page.locator("#hp-current")).toHaveText("4");
  await expect(page.locator("#helper-text")).toHaveText("Each click deals 1 damage.");
  await expect(page.locator("#damage-image")).toBeHidden();

  for (let hit = 0; hit < 4; hit += 1) await page.locator("#mine-button").click();
  await expect(page.locator("#toast-drop-log .toast-drop-entry")).toHaveCount(0);

  await page.reload();
  await page.locator("#more-open").click();
  await expect(page.locator("#setting-mining-feedback")).not.toBeChecked();
  await expect(page.locator("#setting-drop-notifications")).not.toBeChecked();
  await expect(page.locator("#setting-damage-overlay")).not.toBeChecked();
});

test("reset progress requires confirmation and starts a fresh run without changing preferences", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.3; });
  await page.goto("/");
  await page.locator("#mine-button").click();
  await expect(page.locator("#hp-current")).toHaveText("4");

  await page.locator("#more-open").click();
  await page.locator("#delete-game-data").click();
  await expect(page.locator("#reset-data-overlay")).toBeVisible();
  await page.locator("#reset-data-cancel").click();
  await expect(page.locator("#hp-current")).toHaveText("4");

  await page.locator("#delete-game-data").click();
  await page.locator("#reset-data-confirm").click();
  await expect(page.locator("#reset-data-overlay")).toBeHidden();
  await expect(page.locator("#hp-current")).toHaveText("5");
  await expect(page.locator("#block-name")).toHaveText("Grass");
  await expect(page.locator("#current-biome-label")).toHaveText("PLAINS BIOME");
  await expect(page.locator("#more-panel")).toBeHidden();
});

test("More can restore the default panel layout", async ({ page }) => {
  await page.goto("/");
  await page.locator("#more-open").click();
  await page.locator('[data-ui-position="more"]').click();
  await expect(page.locator("#more-panel")).toHaveClass(/is-top/);
  await page.locator("#reset-panel-layouts").click();
  await expect(page.locator("#more-panel")).toHaveClass(/is-bottom/);
});

test("liquid source protection can be disabled to mine a source block", async ({ page }) => {
  await page.addInitScript(() => {
    const rolls = [0, 0, 0.5];
    Math.random = () => rolls.length ? rolls.shift() : 0.5;
  });
  await page.goto("/");
  const mineButton = page.locator("#mine-button");
  await expect(mineButton).toBeDisabled();
  await expect(page.locator("#setting-liquid-protection")).toBeChecked();

  await page.locator("#more-open").click();
  await page.locator("#setting-liquid-protection").uncheck();
  await page.locator("#more-open").click();
  await expect(mineButton).toBeEnabled();
  for (let hit = 0; hit < 5; hit += 1) await mineButton.click();
  await expect(page.locator(".water-puddle")).toBeHidden();
});
