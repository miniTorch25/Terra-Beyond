import test from "node:test";
import assert from "node:assert/strict";
import { INVENTORY_CATEGORIES, PLAINS_INVENTORY, chunkItems } from "../src/inventory.js";

test("inventory has the four requested categories", () => {
  assert.deepEqual(INVENTORY_CATEGORIES.map(({ id }) => id), ["item", "tool", "sword", "artifact"]);
});

test("the Plains item drawer uses the existing item sprites and starts with zero counts", () => {
  const items = PLAINS_INVENTORY.item.Natural;
  assert.deepEqual(items.map(({ id }) => id), ["item_grass", "wood_scrap", "cobble_rock", "emerald"]);
  assert.ok(items.every((item) => item.count === 0 && item.image.startsWith("./sprites/item/plains/")));
});

test("inventory item rows contain at most six items", () => {
  const items = Array.from({ length: 13 }, (_, index) => index);
  const rows = chunkItems(items);
  assert.deepEqual(rows.map((row) => row.length), [6, 6, 1]);
  assert.deepEqual(rows.flat(), items);
});

test("empty categories have all three drawer sections", () => {
  assert.deepEqual(Object.keys(PLAINS_INVENTORY.sword), ["Natural", "Crafted", "Liquid"]);
  assert.ok(Object.values(PLAINS_INVENTORY.sword).every((items) => items.length === 0));
});

test("invalid row sizes are rejected", () => {
  assert.throws(() => chunkItems([1, 2], 0), RangeError);
});
