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

test("Bottom navigation keeps its dark surface while Map follows the active biome", async ({ page }) => {
  await page.goto("/");
  const mapButton = page.locator("#map-open");
  const expectedMapColors = {
    plains: "rgb(37, 61, 43)",
    tundra: "rgb(41, 73, 92)",
    cave: "rgb(68, 68, 68)",
  };
  const menuBackgrounds = [];
  for (const biome of ["plains", "tundra", "cave"]) {
    await page.locator("body").evaluate((body, id) => { body.dataset.biome = id; }, biome);
    await mapButton.click();
    const menu = await page.locator(".bottom-menu").evaluate((node) => ({
      background: getComputedStyle(node).backgroundColor,
      border: getComputedStyle(node).borderTopColor,
    }));
    menuBackgrounds.push(menu);
    expect(await mapButton.evaluate((node) => getComputedStyle(node).backgroundColor)).toBe(expectedMapColors[biome]);
    await mapButton.click();
  }
  expect(menuBackgrounds[1]).toEqual(menuBackgrounds[0]);
  expect(menuBackgrounds[2]).toEqual(menuBackgrounds[0]);
  expect(menuBackgrounds[0].background).toBe("rgba(37, 37, 37, 0.95)");
});

test("Inventory, Workbench, Gear and More keep their own palettes across biome themes", async ({ page }) => {
  await page.goto("/");
  const menus = [
    { id: "inventory", button: "#inventory-open", expected: "rgb(72, 72, 72)" },
    { id: "craft", button: "#craft-open", expected: "rgb(121, 82, 56)" },
    { id: "gear", button: "#gear-open", expected: "rgb(49, 91, 85)" },
    { id: "more", button: "#more-open", expected: "rgb(98, 71, 119)" },
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
      const infoToggle = row.locator(".biome-info-toggle");
      if (await infoToggle.getAttribute("aria-expanded") !== "true") await infoToggle.click();
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


test("Navigation panel surfaces and controls match their button palettes in every biome", async ({ page }) => {
  await page.goto("/");
  const cases = [
    {
      id: "inventory",
      button: "#inventory-open",
      inspect: (panel) => ({
        panel: getComputedStyle(panel).backgroundImage,
        border: getComputedStyle(panel).borderBottomColor,
        tab: getComputedStyle(panel.querySelector(".inventory-tab.is-active")).backgroundColor,
      }),
      expected: { panel: "rgb(72, 72, 72)", border: "rgb(98, 98, 98)", tab: "rgb(104, 104, 104)" },
    },
    {
      id: "craft",
      button: "#craft-open",
      inspect: (panel) => ({
        panel: getComputedStyle(panel).backgroundImage,
        station: getComputedStyle(panel.querySelector(".workbench-station")).backgroundImage,
        tab: getComputedStyle(panel.querySelector(".workbench-tab.is-active")).backgroundColor,
      }),
      expected: { panel: "rgb(121, 82, 56)", station: "rgb(99, 68, 47)", tab: "rgb(121, 82, 56)" },
    },
    {
      id: "gear",
      button: "#gear-open",
      inspect: (panel) => ({
        panel: getComputedStyle(panel).backgroundImage,
        playerInfo: getComputedStyle(panel.querySelector(".player-info-panel")).backgroundImage,
      }),
      expected: { panel: "rgb(49, 91, 85)", playerInfo: "rgb(49, 91, 85)" },
    },
    {
      id: "more",
      button: "#more-open",
      inspect: (panel) => ({
        panel: getComputedStyle(panel).backgroundImage,
        placeholder: getComputedStyle(panel.querySelector(".panel-placeholder")).backgroundColor,
      }),
      expected: { panel: "rgb(98, 71, 119)", placeholder: "rgb(53, 38, 64)" },
    },
  ];

  for (const menu of cases) {
    await page.locator(menu.button).click();
    const panel = page.locator('[data-nav-panel="' + menu.id + '"]');
    const snapshots = [];
    for (const theme of ["plains", "tundra", "cave"]) {
      await page.locator("body").evaluate((body, biome) => { body.dataset.biome = biome; }, theme);
      snapshots.push(await panel.evaluate(menu.inspect));
    }
    expect(snapshots[1]).toEqual(snapshots[0]);
    expect(snapshots[2]).toEqual(snapshots[0]);
    for (const [key, value] of Object.entries(menu.expected)) {
      expect(snapshots[0][key]).toContain(value);
    }
    await page.locator(menu.button).click();
  }
});


test("Gear navigation button matches the Tidewater Green UI palette in every biome", async ({ page }) => {
  await page.goto("/");
  const button = page.locator("#gear-open");
  const snapshots = [];
  for (const biome of ["plains", "tundra", "cave"]) {
    await page.locator("body").evaluate((body, id) => { body.dataset.biome = id; }, biome);
    await button.click();
    snapshots.push(await button.evaluate((node) => ({
      background: getComputedStyle(node).backgroundColor,
      border: getComputedStyle(node).borderTopColor,
      color: getComputedStyle(node).color,
    })));
    await button.click();
  }
  expect(snapshots).toEqual([
    { background: "rgb(63, 113, 105)", border: "rgb(169, 210, 198)", color: "rgb(255, 255, 255)" },
    { background: "rgb(63, 113, 105)", border: "rgb(169, 210, 198)", color: "rgb(255, 255, 255)" },
    { background: "rgb(63, 113, 105)", border: "rgb(169, 210, 198)", color: "rgb(255, 255, 255)" },
  ]);
  await page.locator("#gear-open").click();
  const panelBackground = await page.locator("#gear-panel").evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(panelBackground).toContain("rgb(49, 91, 85)");
});

test("Map navigation button follows the player's current biome palette", async ({ page }) => {
  await page.goto("/");
  const button = page.locator("#map-open");
  const expected = {
    plains: { background: "rgb(37, 61, 43)", border: "rgb(163, 196, 124)" },
    tundra: { background: "rgb(41, 73, 92)", border: "rgb(177, 210, 223)" },
    cave: { background: "rgb(68, 68, 68)", border: "rgb(208, 208, 208)" },
  };
  for (const biome of ["plains", "tundra", "cave"]) {
    await page.locator("body").evaluate((body, id) => { body.dataset.biome = id; }, biome);
    await button.click();
    const actual = await button.evaluate((node) => ({
      background: getComputedStyle(node).backgroundColor,
      border: getComputedStyle(node).borderTopColor,
    }));
    expect(actual).toEqual(expected[biome]);
    await button.click();
  }
});


test("Navigation panels stay above the bottom shortcut bar on mobile screens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/");

  const menus = [
    { button: "#inventory-open", panel: "#inventory-panel" },
    { button: "#craft-open", panel: "#craft-panel" },
    { button: "#gear-open", panel: "#gear-panel" },
    { button: "#more-open", panel: "#more-panel" },
    { button: "#map-open", panel: "#map-panel" },
  ];
  const navigation = page.locator(".bottom-menu");

  for (const menu of menus) {
    await page.locator(menu.button).click();
    const geometry = await page.locator(menu.panel).evaluate((panel) => ({
      top: panel.getBoundingClientRect().top,
      bottom: panel.getBoundingClientRect().bottom,
      menuTop: document.querySelector(".bottom-menu").getBoundingClientRect().top,
      viewportHeight: window.innerHeight,
    }));
    expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.menuTop + 1);
    expect(geometry.menuTop).toBeLessThan(geometry.viewportHeight);
    await page.locator(menu.button).click();
  }

  const menuGeometry = await navigation.evaluate((menu) => ({
    height: menu.getBoundingClientRect().height,
    buttons: [...menu.querySelectorAll(".menu-button")].map((button) => ({
      top: button.getBoundingClientRect().top,
      bottom: button.getBoundingClientRect().bottom,
      borderWidth: getComputedStyle(button).borderTopWidth,
      borderStyle: getComputedStyle(button).borderTopStyle,
      radius: getComputedStyle(button).borderTopLeftRadius,
    })),
  }));
  expect(menuGeometry.height).toBeGreaterThanOrEqual(88);
  expect(menuGeometry.buttons).toHaveLength(5);
  for (const button of menuGeometry.buttons) {
    expect(button.top).toBeGreaterThanOrEqual(0);
    expect(button.bottom).toBeLessThanOrEqual(844);
    expect(button.borderWidth).toBe("1px");
    expect(button.borderStyle).toBe("solid");
    expect(button.radius).toBe("10px");
  }
});

test("Half-screen navigation panels leave the bottom shortcut bar unobstructed", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("terra-beyond-inventory-half-screen", "false");
    localStorage.setItem("terra-beyond-panel-layouts", JSON.stringify({
      inventory: { half: false, position: "bottom" },
    }));
  });
  await page.goto("/");
  await page.locator("body").evaluate((body) => { body.dataset.biome = "plains"; });
  await page.locator("#inventory-open").click();
  await page.locator('[data-ui-half="inventory"]').click();
  await expect(page.locator("#inventory-panel")).toHaveClass(/is-half/);
  await expect(page.locator("#inventory-panel")).toHaveClass(/is-bottom/);

  const geometry = await page.locator("#inventory-panel").evaluate((panel) => ({
    top: panel.getBoundingClientRect().top,
    bottom: panel.getBoundingClientRect().bottom,
    menuTop: document.querySelector(".bottom-menu").getBoundingClientRect().top,
    className: panel.className,
    cssTop: getComputedStyle(panel).top,
    cssHeight: getComputedStyle(panel).height,
    inlineStyle: panel.getAttribute("style"),
    biome: document.body.dataset.biome,
  }));
  console.log("HALF_PANEL_DEBUG", JSON.stringify(geometry));
  expect(geometry.top).toBeGreaterThanOrEqual(422);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.menuTop + 1);
});
