import { test, expect } from "@playwright/test";

test("damage overlay stays hidden while a block has full HP", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.3; });
  await page.goto("/");

  const damage = page.locator("#damage-image");
  await expect(page.locator("#hp-current")).toHaveText("5");
  await expect(page.locator("#hp-max")).toHaveText("5");
  await expect(damage).toBeHidden();
});

test("damage overlay appears after the first hit and hides when a new block spawns", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.3; });
  await page.goto("/");

  const damage = page.locator("#damage-image");
  const mineButton = page.locator("#mine-button");

  await mineButton.click();
  await expect(page.locator("#hp-current")).toHaveText("4");
  await expect(damage).toBeVisible();
  await expect(damage).toHaveAttribute("src", "./sprites/environment/destroy_stage_2.png");

  for (let hit = 0; hit < 4; hit += 1) await mineButton.click();
  await expect(page.locator("#hp-current")).toHaveText("5");
  await expect(page.locator("#hp-max")).toHaveText("5");
  await expect(damage).toBeHidden();
});
