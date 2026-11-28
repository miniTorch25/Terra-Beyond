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
