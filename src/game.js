export const PLAYER_DAMAGE = 1;

export const BLOCK_DROPS = Object.freeze({
  grass: Object.freeze([{ itemId: "item_grass", amount: 1 }]),
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
    Object.freeze({ id: "berry_bush", name: "Berry Bush", maxHp: 5, spawnRate: 40, image: "./sprites/block/tundra/berry_bush.png" }),
    Object.freeze({ id: "snow", name: "Snow", maxHp: 5, spawnRate: 25, image: "./sprites/block/tundra/snow.png" }),
    Object.freeze({ id: "ice_block", name: "Ice Block", maxHp: 10, spawnRate: 20, image: "./sprites/block/tundra/ice_block.png" }),
    Object.freeze({ id: "spruce_log", name: "Spruce Log", maxHp: 7, spawnRate: 10, image: "./sprites/block/tundra/spruce_log.png" }),
    Object.freeze({ id: "sapphire_ore", name: "Sapphire Ore", maxHp: 15, spawnRate: 5, image: "./sprites/block/tundra/sapphire_ore.png" }),
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

export function mineBlock(state, damage = PLAYER_DAMAGE, random = Math.random, biomeId = "plains") {
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
  return { state: { block: nextBlock, hp: nextBlock.maxHp }, broken: true, drops: getBlockDrops(state.block) };
}
