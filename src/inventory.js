export const INVENTORY_CATEGORIES = Object.freeze([
  Object.freeze({ id: "item", label: "Item" }),
  Object.freeze({ id: "tool", label: "Tool" }),
  Object.freeze({ id: "sword", label: "Sword" }),
  Object.freeze({ id: "artifact", label: "Artifact" }),
]);

const emptySections = () => ({
  Natural: [],
  Crafted: [],
  Liquid: [],
});

export const PLAINS_INVENTORY = Object.freeze({
  item: Object.freeze({
    Natural: Object.freeze([
      Object.freeze({ id: "item_grass", name: "Grass", image: "./sprites/item/plains/item_grass.png", count: 0 }),
      Object.freeze({ id: "wood_scrap", name: "Wood Scrap", image: "./sprites/item/plains/wood_scrap.png", count: 0 }),
      Object.freeze({ id: "cobble_rock", name: "Cobble Rock", image: "./sprites/item/plains/cobble_rock.png", count: 0 }),
      Object.freeze({ id: "emerald", name: "Emerald", image: "./sprites/item/plains/emerald.png", count: 0 }),
    ]),
    Crafted: Object.freeze([]),
    Liquid: Object.freeze([]),
  }),
  tool: Object.freeze({
    Natural: Object.freeze([
      Object.freeze({ id: "oak_pick", name: "Oak Pick", image: "./sprites/tool/plains/oak_pick.png", count: 0 }),
      Object.freeze({ id: "rock_pick", name: "Rock Pick", image: "./sprites/tool/plains/rock_pick.png", count: 0 }),
      Object.freeze({ id: "emerald_pick", name: "Emerald Pick", image: "./sprites/tool/plains/emerald_pick.png", count: 0 }),
      Object.freeze({ id: "stone_dagger", name: "Stone Dagger", image: "./sprites/tool/plains/stone_dagger.png", count: 0 }),
    ]),
    Crafted: Object.freeze([]),
    Liquid: Object.freeze([]),
  }),
  sword: Object.freeze(emptySections()),
  artifact: Object.freeze(emptySections()),
});

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
