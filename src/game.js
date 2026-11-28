export const PLAYER_DAMAGE = 1;

export const BLOCK_DROPS = Object.freeze({
  grass: Object.freeze([{ itemId: "item_grass", amount: 1 }]),
  oak_log: Object.freeze([{ itemId: "wood_scrap", amount: 2 }]),
  cobblestone: Object.freeze([{ itemId: "cobble_rock", amount: 1 }]),
  emerald_ore: Object.freeze([{ itemId: "emerald", amount: 1 }]),
  berry_bush: Object.freeze([{ itemId: "sweet_berry", amount: 2 }]),
  snow: Object.freeze([{ itemId: "snowball", amount: 2 }]),
  ice_block: Object.freeze([{ itemId: "ice_shard", amount: 1 }]),
  spruce_log: Object.freeze([{ itemId: "spruce_wood", amount: 2 }]),
  sapphire_ore: Object.freeze([{ itemId: "sapphire", amount: 1 }]),
  stone_block: Object.freeze([{ itemId: "stone_item", amount: 1 }]),
  coal_ore: Object.freeze([{ itemId: "coal", amount: 1 }]),
  copper_ore: Object.freeze([{ itemId: "raw_copper", amount: 1 }]),
  iron_ore: Object.freeze([{ itemId: "raw_iron", amount: 1 }]),
  lead_ore: Object.freeze([{ itemId: "raw_lead", amount: 1 }]),
});

export function getBlockDrops(block) {
  return (BLOCK_DROPS[block?.id] || []).map((drop) => ({ ...drop }));
}

export const BLOCKS_BY_BIOME = Object.freeze({
  plains: Object.freeze([
    Object.freeze({ id: "grass", name: "Grass", maxHp: 5, spawnRate: 40, image: "./sprites/block/plains/grass.png" }),
    Object.freeze({ id: "oak_log", name: "Oak Log", maxHp: 7, spawnRate: 30, image: "./sprites/block/plains/oak_log.png" }),
    Object.freeze({ id: "cobblestone", name: "Cobblestone", maxHp: 10, spawnRate: 25, image: "./sprites/block/plains/cobblestone.png" }),
    Object.freeze({ id: "emerald_ore", name: "Emerald Ore", maxHp: 15, spawnRate: 5, image: "./sprites/block/plains/emerald_ore.png" }),
  ]),
  tundra: Object.freeze([
    Object.freeze({ id: "berry_bush", name: "Berry Bush", maxHp: 15, spawnRate: 40, image: "./sprites/block/tundra/berry_bush.png" }),
    Object.freeze({ id: "snow", name: "Snow", maxHp: 21, spawnRate: 25, image: "./sprites/block/tundra/snow.png" }),
    Object.freeze({ id: "ice_block", name: "Ice Block", maxHp: 30, spawnRate: 20, image: "./sprites/block/tundra/ice_block.png" }),
    Object.freeze({ id: "spruce_log", name: "Spruce Log", maxHp: 36, spawnRate: 10, image: "./sprites/block/tundra/spruce_log.png" }),
    Object.freeze({ id: "sapphire_ore", name: "Sapphire Ore", maxHp: 45, spawnRate: 5, image: "./sprites/block/tundra/sapphire_ore.png" }),
  ]),
  cave: Object.freeze([
    Object.freeze({ id: "stone_block", name: "Stone", maxHp: 45, spawnRate: 40, image: "./sprites/block/cave/stone_block.png" }),
    Object.freeze({ id: "coal_ore", name: "Coal Ore", maxHp: 63, spawnRate: 25, image: "./sprites/block/cave/coal_ore.png" }),
    Object.freeze({ id: "copper_ore", name: "Copper Ore", maxHp: 90, spawnRate: 18, image: "./sprites/block/cave/copper_ore.png" }),
    Object.freeze({ id: "iron_ore", name: "Iron Ore", maxHp: 108, spawnRate: 12, image: "./sprites/block/cave/iron_ore.png" }),
    Object.freeze({ id: "lead_ore", name: "Lead Ore", maxHp: 135, spawnRate: 5, image: "./sprites/block/cave/lead_ore.png" }),
  ]),
});

export const BLOCKS = BLOCKS_BY_BIOME.plains;

export function randomBlock(random = Math.random, biomeId = "plains") {
  if (typeof random !== "function") throw new TypeError("Random source must be a function.");
  const blocks = BLOCKS_BY_BIOME[biomeId];
  if (!blocks) throw new RangeError(`Unknown biome: ${biomeId}`);
  const roll = Math.min(99.999999999, Math.max(0, random() * 100));
  let cumulativeRate = 0;
  for (const block of blocks) {
    cumulativeRate += block.spawnRate;
    if (roll < cumulativeRate) return block;
  }
  return blocks[blocks.length - 1];
}

export function createInitialState(random = Math.random, biomeId = "plains") {
  const block = randomBlock(random, biomeId);
  return { block, hp: block.maxHp };
}

export function mineBlock(state, damage = PLAYER_DAMAGE, random = Math.random, biomeId = "plains", equippedToolId = null) {
  if (!state || !state.block || !Number.isFinite(state.hp)) {
    throw new TypeError("A valid mining state is required.");
  }
  if (!Number.isFinite(damage) || damage <= 0) {
    throw new RangeError("Damage must be a positive number.");
  }

  const remainingHp = Math.max(0, state.hp - damage);
  if (remainingHp > 0) {
    return { state: { block: state.block, hp: remainingHp }, broken: false, drops: [] };
  }

  const nextBlock = randomBlock(random, biomeId);
  const drops = getBlockDrops(state.block);
  if (equippedToolId === "emerald_pick" && state.block.id === "emerald_ore") { const emerald=drops.find(drop=>drop.itemId==="emerald"); if(emerald)emerald.amount+=1; else drops.push({itemId:"emerald",amount:1}); }
  return { state: { block: nextBlock, hp: nextBlock.maxHp }, broken: true, drops };
}
