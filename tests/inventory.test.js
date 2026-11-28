import test from "node:test";
import assert from "node:assert/strict";
import {
  INVENTORY_CATEGORIES,
  PLAINS_INVENTORY,
  TUNDRA_INVENTORY,
  LIQUID_INVENTORY,
  chunkItems, formatItemCount, getItemDetails, INVENTORY_ITEMS,
} from "../src/inventory.js";

test("inventory has the four requested categories", () => {
  assert.deepEqual(INVENTORY_CATEGORIES.map(({ id }) => id), ["item", "tool", "sword", "artifact"]);
});

test("Plains contains only its four original items", () => {
  const items = PLAINS_INVENTORY.item.Natural;
  assert.deepEqual(items.map(({ id }) => id), ["item_grass", "wood_scrap", "cobble_rock", "emerald"]);
  assert.ok(items.every((entry) => entry.count === 0 && entry.image.startsWith("./sprites/item/plains/")));
});

test("Tundra contains Sapphire with its other biome items and tools", () => {
  assert.deepEqual(TUNDRA_INVENTORY.item.Natural.map(({ id }) => id), ["sweet_berry", "snowball", "spruce_wood", "ice_shard", "sapphire"]);
  assert.deepEqual(TUNDRA_INVENTORY.tool.Crafted.map(({ id }) => id), ["ice_pick", "sapphire_pick"]);
  assert.deepEqual(TUNDRA_INVENTORY.sword.Crafted.map(({ id }) => id), ["sapphire_dagger"]);
  assert.ok([...TUNDRA_INVENTORY.item.Natural, ...TUNDRA_INVENTORY.tool.Crafted, ...TUNDRA_INVENTORY.sword.Crafted]
    .every((entry) => entry.count === 0 && entry.image.includes("/tundra/")));
  assert.equal(TUNDRA_INVENTORY.item.Natural.at(-1).image, "./sprites/item/tundra/sapphire.png");
});

test("liquids are shared globally instead of being biome-specific", () => {
  assert.deepEqual(LIQUID_INVENTORY.map(({ id }) => id), ["water", "cold_water"]);
  assert.ok(LIQUID_INVENTORY.every((entry) => entry.image.startsWith("./sprites/liquid/")));
});

test("inventory item rows contain at most six items", () => {
  const items = Array.from({ length: 13 }, (_, index) => index);
  const rows = chunkItems(items);
  assert.deepEqual(rows.map((row) => row.length), [6, 6, 1]);
  assert.deepEqual(rows.flat(), items);
});

test("tools, swords and artifacts use Crafted only, with daggers under Sword", () => {
  for (const biome of [PLAINS_INVENTORY, TUNDRA_INVENTORY]) for (const category of ["tool", "sword", "artifact"]) assert.deepEqual(Object.keys(biome[category]), ["Crafted"]);
  assert.deepEqual(PLAINS_INVENTORY.sword.Crafted.map(({ id }) => id), ["stone_dagger"]);
  assert.deepEqual(TUNDRA_INVENTORY.sword.Crafted.map(({ id }) => id), ["sapphire_dagger"]);
  assert.ok(INVENTORY_ITEMS.filter(({ unique }) => unique).every(({ count }) => count === 0));
});

test("invalid row sizes are rejected", () => {
  assert.throws(() => chunkItems([1, 2], 0), RangeError);
});

test("inventory count formatter uses integer compact suffixes", () => {
  assert.deepEqual([999, 1000, 1999, 12000, 999999, 1e6, 1e9, 1e12, 1e15].map(formatItemCount),
    ["999", "1k", "1k", "12k", "999k", "1M", "1B", "1T", "1Qa"]);
  assert.equal(formatItemCount(1e36), "1e36");
  assert.throws(() => formatItemCount(-1), RangeError);
});
test("item details omit Origin and identify crafted weapons", () => {
  assert.equal(getItemDetails("item_grass").tag, "Natural");
  assert.equal(Object.hasOwn(getItemDetails("item_grass"), "origin"), false);
  assert.equal(getItemDetails("stone_dagger", "Crafted").tag, "Crafted");
});
test("liquid detail metadata uses Liquid tag and omits block origin", () => {
  const water = getItemDetails("water");
  assert.equal(water.tag, "Liquid");
  assert.equal(water.biome, "Plains");
  assert.equal(water.origin, null);
});
