export const INVENTORY_CATEGORIES = Object.freeze([
  Object.freeze({ id: "item", label: "Item" }),
  Object.freeze({ id: "tool", label: "Tool" }),
  Object.freeze({ id: "sword", label: "Sword" }),
  Object.freeze({ id: "artifact", label: "Artifact" }),
]);

const emptySections = () => ({
  Natural: [],
  Crafted: [],
});

const item = (id, name, biome, count = 0) => Object.freeze({
  id,
  name,
  image: `./sprites/item/${biome}/${id}.png`,
  count,
});

const tool = (id, name, biome, count = 0) => Object.freeze({
  id,
  name,
  image: `./sprites/tool/${biome}/${id}.png`,
  count,
});

export const PLAINS_INVENTORY = Object.freeze({
  item: Object.freeze({
    Natural: Object.freeze([
      item("item_grass", "Grass", "plains"),
      item("wood_scrap", "Wood Scrap", "plains"),
      item("cobble_rock", "Cobble Rock", "plains"),
      item("emerald", "Emerald", "plains"),
    ]),
    Crafted: Object.freeze([]),
  }),
  tool: Object.freeze({
    Natural: Object.freeze([
      tool("oak_pick", "Oak Pick", "plains"),
      tool("rock_pick", "Rock Pick", "plains"),
      tool("emerald_pick", "Emerald Pick", "plains"),
      tool("stone_dagger", "Stone Dagger", "plains"),
    ]),
    Crafted: Object.freeze([]),
  }),
  sword: Object.freeze(emptySections()),
  artifact: Object.freeze(emptySections()),
});

export const TUNDRA_INVENTORY = Object.freeze({
  item: Object.freeze({
    Natural: Object.freeze([
      item("sweet_berry", "Sweet Berry", "tundra"),
      item("snowball", "Snowball", "tundra"),
      item("spruce_wood", "Spruce Wood", "tundra"),
      item("ice_shard", "Ice Shard", "tundra"),
      item("sapphire", "Sapphire", "tundra"),
    ]),
    Crafted: Object.freeze([]),
  }),
  tool: Object.freeze({
    Natural: Object.freeze([
      tool("ice_pick", "Ice Pick", "tundra"),
      tool("sapphire_dagger", "Sapphire Dagger", "tundra"),
      tool("sapphire_pick", "Sapphire Pick", "tundra"),
    ]),
    Crafted: Object.freeze([]),
  }),
  sword: Object.freeze(emptySections()),
  artifact: Object.freeze(emptySections()),
});

export const LIQUID_INVENTORY = Object.freeze([
  Object.freeze({ id: "cold_water", name: "Cold Water", image: "./sprites/liquid/cold_water.png", count: 0 }),
  Object.freeze({ id: "water", name: "Water", image: "./sprites/liquid/water.png", count: 0 }),
]);

export function chunkItems(items, perRow = 6) {
  if (!Array.isArray(items)) throw new TypeError("Items must be an array.");
  if (!Number.isInteger(perRow) || perRow < 1) {
    throw new RangeError("Items per row must be a positive integer.");
  }

  const rows = [];
  for (let index = 0; index < items.length; index += perRow) {
    rows.push(items.slice(index, index + perRow));
  }
  return rows;
}
