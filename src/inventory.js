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
  Object.freeze({ id: "cold_water", name: "Cold Water", image: "./sprites/liquid/cold_water.png", count: 0, biome: "Tundra", tag: "Liquid" }),
  Object.freeze({ id: "water", name: "Water", image: "./sprites/liquid/water.png", count: 0, biome: "Plains", tag: "Liquid" }),
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

const ITEM_DESCRIPTIONS = Object.freeze({
  item_grass: "A little piece of the world. It looks ordinary, but every journey starts somewhere.",
  wood_scrap: "A rough piece of timber left behind after gathering wood.",
  cobble_rock: "A sturdy stone fragment. Useful, dependable, and not very comfortable to carry.",
  emerald: "A bright green gem that seems far too valuable to leave lying around.",
  sweet_berry: "A bright berry that brings a little colour to the frozen landscape.",
  snowball: "A tightly packed ball of snow. Cold, round, and ready to be thrown.",
  spruce_wood: "A piece of hardy wood gathered from the northern forest.",
  ice_shard: "A sharp fragment of clear ice that catches the light.",
  sapphire: "A precious blue gemstone hidden beneath the frozen ground.",
  oak_pick: "A simple wooden pick made for getting started.",
  rock_pick: "A rough but reliable pick for harder materials.",
  emerald_pick: "A brilliant pick with an unmistakable green shine.",
  stone_dagger: "A small stone blade. Better than facing the wilderness empty-handed.",
  ice_pick: "A cold-forged pick suited to the frozen frontier.",
  sapphire_dagger: "A blue gemstone blade with a crisp edge.",
  sapphire_pick: "A powerful pick fitted with a sapphire head.",
  cold_water: "Water chilled by the frozen air of the Tundra.",
  water: "A clear and familiar liquid found in the Plains.",
});
const ORIGIN_BLOCKS = Object.freeze({
  item_grass: ["plains", "grass"], wood_scrap: ["plains", "oak_log"],
  cobble_rock: ["plains", "cobblestone"], emerald: ["plains", "emerald_block"],
  oak_pick: ["plains", "oak_log"], rock_pick: ["plains", "cobblestone"],
  emerald_pick: ["plains", "emerald_block"], stone_dagger: ["plains", "cobblestone"],
  sweet_berry: ["tundra", "berry_bush"], snowball: ["tundra", "snow"],
  spruce_wood: ["tundra", "spruce_log"], ice_shard: ["tundra", "ice_block"],
  sapphire: ["tundra", "sapphire_ore"], ice_pick: ["tundra", "ice_block"],
  sapphire_dagger: ["tundra", "sapphire_ore"], sapphire_pick: ["tundra", "sapphire_ore"],
});
export function getItemDetails(id, fallbackTag = "Natural") {
  const all = [...PLAINS_INVENTORY.item.Natural, ...PLAINS_INVENTORY.tool.Natural,
    ...TUNDRA_INVENTORY.item.Natural, ...TUNDRA_INVENTORY.tool.Natural, ...LIQUID_INVENTORY];
  const item = all.find((entry) => entry.id === id);
  if (!item) return null;
  const originData = ORIGIN_BLOCKS[id];
  const origin = originData ? {
    name: originData[1].replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    image: `./sprites/block/${originData[0]}/${originData[1]}.png`,
  } : null;
  return {
    ...item,
    description: ITEM_DESCRIPTIONS[id] || "A curious item waiting to be discovered.",
    tag: item.tag || (id === "water" || id === "cold_water" ? "Liquid" : fallbackTag),
    origin: item.origin || origin,
  };
}
const COUNT_SUFFIXES = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
export function formatItemCount(value) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError("Item count must be a non-negative finite number.");
  const count = Math.floor(value);
  if (count < 1000) return String(count);
  const tier = Math.floor(Math.log10(count) / 3);
  if (tier >= COUNT_SUFFIXES.length) return `1e${tier * 3}`;
  return `${Math.floor(count / (1000 ** tier))}${COUNT_SUFFIXES[tier]}`;
}
