export const PLAYER_DAMAGE = 1;

export const BLOCKS = Object.freeze([
  Object.freeze({ id: "grass", name: "Grass", maxHp: 5, image: "./sprites/block/plains/grass.png" }),
  Object.freeze({ id: "oak_log", name: "Oak Log", maxHp: 7, image: "./sprites/block/plains/oak_log.png" }),
  Object.freeze({ id: "stone", name: "Stone", maxHp: 10, image: "./sprites/block/plains/cobblestone.png" }),
  Object.freeze({ id: "emerald", name: "Emerald", maxHp: 15, image: "./sprites/block/plains/emerald_block.png" }),
]);

export function randomBlock(random = Math.random) {
  const index = Math.floor(random() * BLOCKS.length);
  return BLOCKS[Math.min(BLOCKS.length - 1, Math.max(0, index))];
}

export function createInitialState(random = Math.random) {
  const block = randomBlock(random);
  return { block, hp: block.maxHp };
}

export function mineBlock(state, damage = PLAYER_DAMAGE, random = Math.random) {
  if (!state || !state.block || !Number.isFinite(state.hp)) {
    throw new TypeError("A valid mining state is required.");
  }
  if (!Number.isFinite(damage) || damage <= 0) {
    throw new RangeError("Damage must be a positive number.");
  }

  const remainingHp = Math.max(0, state.hp - damage);
  if (remainingHp > 0) {
    return { state: { block: state.block, hp: remainingHp }, broken: false };
  }

  const nextBlock = randomBlock(random);
  return { state: { block: nextBlock, hp: nextBlock.maxHp }, broken: true };
}
