import test from "node:test";
import assert from "node:assert/strict";
import { BLOCKS, PLAYER_DAMAGE, createInitialState, mineBlock, randomBlock } from "../src/game.js";

test("the four starter blocks have the requested maximum HP", () => {
  assert.deepEqual(BLOCKS.map(({ name, maxHp }) => [name, maxHp]), [
    ["Grass", 5], ["Oak Log", 7], ["Stone", 10], ["Emerald", 15],
  ]);
});

test("player default damage is 1", () => {
  assert.equal(PLAYER_DAMAGE, 1);
});

test("mining reduces the current block by one HP", () => {
  const state = { block: BLOCKS[0], hp: 5 };
  const result = mineBlock(state, PLAYER_DAMAGE, () => 0.99);
  assert.equal(result.broken, false);
  assert.equal(result.state.hp, 4);
  assert.equal(result.state.block.id, "grass");
});

test("block at zero HP is replaced and the new block starts at full HP", () => {
  const state = { block: BLOCKS[0], hp: 1 };
  const result = mineBlock(state, PLAYER_DAMAGE, () => 0.99);
  assert.equal(result.broken, true);
  assert.equal(result.state.block.id, "emerald");
  assert.equal(result.state.hp, 15);
});

test("random selection can select each block from the random range", () => {
  assert.equal(randomBlock(() => 0).id, "grass");
  assert.equal(randomBlock(() => 0.25).id, "oak_log");
  assert.equal(randomBlock(() => 0.5).id, "stone");
  assert.equal(randomBlock(() => 0.99).id, "emerald");
});

test("invalid damage is rejected", () => {
  assert.throws(() => mineBlock({ block: BLOCKS[0], hp: 5 }, 0), RangeError);
});
