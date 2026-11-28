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

test("Inventory, Workbench, Gear and More keep their own palettes across biome themes", async ({ page }) => {
  await page.goto("/");
  const menus = [
    { id: "inventory", button: "#inventory-open", expected: "rgb(80, 57, 39)" },
    { id: "craft", button: "#craft-open", expected: "rgb(87, 56, 93)" },
    { id: "gear", button: "#gear-open", expected: "rgb(49, 91, 85)" },
    { id: "more", button: "#more-open", expected: "rgb(59, 61, 66)" },
  ];
  for (const menu of menus) {
    await page.locator(menu.button).click();
    const panel = page.locator('[data-nav-panel="' + menu.id + '"]');
    const snapshots = [];
    for (const theme of ["plains", "tundra", "cave"]) {
      await page.locator("body").evaluate((body, biome) => { body.dataset.biome = biome; }, theme);
      snapshots.push(await panel.evaluate((node) => ({
        background: getComputedStyle(node).backgroundImage,
        border: getComputedStyle(node).borderBottomColor,
      })));
    }
    expect(snapshots[1]).toEqual(snapshots[0]);
    expect(snapshots[2]).toEqual(snapshots[0]);
    expect(await panel.evaluate((node) => getComputedStyle(node).backgroundImage)).toContain(menu.expected);
    await page.locator(menu.button).click();
  }
});

test("Map background still follows the active biome theme", async ({ page }) => {
  await page.goto("/");
  await page.locator("#map-open").click();
  const backgrounds = [];
  for (const theme of ["plains", "tundra", "cave"]) {
    await page.locator("body").evaluate((body, biome) => { body.dataset.biome = biome; }, theme);
    backgrounds.push(await page.locator("#map-panel").evaluate((node) => getComputedStyle(node).backgroundImage));
  }
  expect(new Set(backgrounds).size).toBe(3);
});


test("Map biome information frames and ! buttons use their biome colors across world themes", async ({ page }) => {
  await page.goto("/");
  await page.locator("#map-open").click();

  const snapshots = [];
  for (const theme of ["plains", "tundra", "cave"]) {
    await page.locator("body").evaluate((body, biome) => { body.dataset.biome = biome; }, theme);
    const biomeStates = [];
    for (const biome of ["plains", "tundra", "cave"]) {
      const row = page.locator('[data-biome-row="' + biome + '"]');
      await row.locator(".biome-info-toggle").click();
      biomeStates.push(await row.evaluate((node) => ({
        frameBorder: getComputedStyle(node).borderTopColor,
        infoBackground: getComputedStyle(node.querySelector(".map-biome-info")).backgroundColor,
        infoBorder: getComputedStyle(node.querySelector(".map-biome-info")).borderTopColor,
        infoButtonBackground: getComputedStyle(node.querySelector(".biome-info-toggle")).backgroundColor,
      })));
    }
    snapshots.push(biomeStates);
  }

  expect(snapshots[1]).toEqual(snapshots[0]);
  expect(snapshots[2]).toEqual(snapshots[0]);
  expect(new Set(snapshots[0].map((state) => state.frameBorder)).size).toBe(3);
  expect(new Set(snapshots[0].map((state) => state.infoButtonBackground)).size).toBe(3);
});

test("Inventory, Workbench and More navigation buttons use gray, brown and purple palettes", async ({ page }) => {
  await page.goto("/");
  const targets = [
    { id: "inventory", expected: "rgb(104, 104, 104)" },
    { id: "craft", expected: "rgb(121, 82, 56)" },
    { id: "more", expected: "rgb(98, 71, 119)" },
  ];
  const snapshots = [];
  for (const theme of ["plains", "tundra", "cave"]) {
    await page.locator("body").evaluate((body, biome) => { body.dataset.biome = biome; }, theme);
    const colors = [];
    for (const target of targets) {
      const button = page.locator('.menu-button[data-nav-target="' + target.id + '"]');
      await button.click();
      colors.push(await button.evaluate((node) => getComputedStyle(node).backgroundColor));
      await button.click();
    }
    snapshots.push(colors);
  }
  expect(snapshots[1]).toEqual(snapshots[0]);
  expect(snapshots[2]).toEqual(snapshots[0]);
  expect(snapshots[0]).toEqual(targets.map((target) => target.expected));
});
