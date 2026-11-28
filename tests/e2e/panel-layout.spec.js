import { test, expect } from "@playwright/test";

test("Inventory and Gear can remain open together in split view", async ({ page }) => {
  await page.goto("/");
  await page.locator("#inventory-open").click();
  await page.locator("#gear-open").click();
  await expect(page.locator("#inventory-panel")).toBeVisible();
  await expect(page.locator("#gear-panel")).toBeVisible();
  await expect(page.locator("#inventory-panel")).toHaveClass(/is-half/);
  await expect(page.locator("#inventory-panel")).toHaveClass(/is-bottom/);
  await expect(page.locator("#gear-panel")).toHaveClass(/is-half/);
  await expect(page.locator("#gear-panel")).toHaveClass(/is-top/);
});

test("Inventory half-screen panel can move between top and bottom", async ({ page }) => {
  await page.goto("/");
  await page.locator("#inventory-open").click();
  await expect(page.locator("#inventory-panel")).toHaveClass(/is-half/);
  await expect(page.locator("#inventory-panel")).toHaveClass(/is-bottom/);
  await page.locator('[data-ui-half="inventory"]').click();
  await expect(page.locator("#inventory-panel")).not.toHaveClass(/is-half/);
  await page.locator('[data-ui-half="inventory"]').click();
  await expect(page.locator("#inventory-panel")).toHaveClass(/is-half/);
  await page.locator('[data-ui-position="inventory"]').click();
  await expect(page.locator("#inventory-panel")).toHaveClass(/is-top/);
});

test("Workbench and More support split and position controls; Map remains unchanged", async ({ page }) => {
  await page.goto("/");
  await page.locator("#craft-open").click();
  await expect(page.locator('[data-ui-half="craft"]')).toBeVisible();
  await expect(page.locator("#craft-panel")).toHaveClass(/is-half/);
  await expect(page.locator("#craft-panel")).toHaveClass(/is-top/);
  await page.locator('[data-ui-half="craft"]').click();
  await expect(page.locator("#craft-panel")).not.toHaveClass(/is-half/);
  await page.locator("#more-open").click();
  await expect(page.locator("#more-panel")).toHaveClass(/is-half/);
  await expect(page.locator("#more-panel")).toHaveClass(/is-bottom/);
  await page.locator('[data-ui-position="more"]').click();
  await expect(page.locator("#more-panel")).toHaveClass(/is-top/);
  await page.locator("#map-open").click();
  await expect(page.locator("#map-panel")).toBeVisible();
  await expect(page.locator("#map-panel")).not.toHaveClass(/is-half/);
  await expect(page.locator("#map-panel [data-ui-half]")).toHaveCount(0);
});
