import { test, expect } from "@playwright/test";

test("Map biome buttons retain their individual colors across biome themes", async ({ page }) => {
  await page.goto("/");
  await page.locator("#map-open").click();

  const snapshots = [];
  for (const theme of ["plains", "tundra", "cave"]) {
    await page.locator("body").evaluate((body, biome) => { body.dataset.biome = biome; }, theme);
    snapshots.push(await page.locator(".biome-visit-button").evaluateAll((buttons) =>
      buttons.map((button) => ({
        biome: button.dataset.biomeColor,
        background: getComputedStyle(button).backgroundColor,
        border: getComputedStyle(button).borderTopColor,
        color: getComputedStyle(button).color,
      }))
    ));
  }

  expect(snapshots[1]).toEqual(snapshots[0]);
  expect(snapshots[2]).toEqual(snapshots[0]);
  expect(new Set(snapshots[0].map((button) => button.background)).size).toBe(3);
});

test("All five bottom navigation tabs keep the same dark-gray palette in every biome", async ({ page }) => {
  await page.goto("/");
  await page.locator("#map-open").click();

  const snapshots = [];
  for (const theme of ["plains", "tundra", "cave"]) {
    await page.locator("body").evaluate((body, biome) => { body.dataset.biome = biome; }, theme);
    snapshots.push(await page.locator(".bottom-menu").evaluate((menu) => ({
      background: getComputedStyle(menu).backgroundColor,
      border: getComputedStyle(menu).borderTopColor,
      buttons: [...menu.querySelectorAll(".menu-button")].map((button) => ({
        background: getComputedStyle(button).backgroundColor,
        color: getComputedStyle(button).color,
      })),
    })));
  }

  expect(snapshots[1]).toEqual(snapshots[0]);
  expect(snapshots[2]).toEqual(snapshots[0]);
  expect(snapshots[0].buttons).toHaveLength(5);
  expect(snapshots[0].background).toBe("rgba(37, 37, 37, 0.95)");
  expect(snapshots[0].buttons[4].background).toBe("rgb(65, 65, 65)");
});
