import test from "node:test";
import assert from "node:assert/strict";
import { BLOCKS, BLOCKS_BY_BIOME, PLAYER_DAMAGE, createInitialState, getBlockDrops, mineBlock, randomBlock } from "../src/game.js";

test("Plains blocks use the requested spawn rates", () => {
  assert.deepEqual(BLOCKS.map(({ name, spawnRate }) => [name, spawnRate]), [
    ["Grass", 40], ["Oak Log", 30], ["Cobblestone", 25], ["Emerald Ore", 5],
  ]);
  assert.equal(BLOCKS.reduce((sum, block) => sum + block.spawnRate, 0), 100);
});

test("Tundra blocks use the requested spawn rates", () => {
  assert.deepEqual(BLOCKS_BY_BIOME.tundra.map(({ name, spawnRate }) => [name, spawnRate]), [
    ["Berry Bush", 40], ["Snow", 25], ["Ice Block", 20], ["Spruce Log", 10], ["Sapphire Ore", 5],
  ]);
  assert.equal(BLOCKS_BY_BIOME.tundra.reduce((sum, block) => sum + block.spawnRate, 0), 100);
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

test("breaking a block respawns from the selected biome", () => {
  const state = { block: BLOCKS[0], hp: 1 };
  const result = mineBlock(state, PLAYER_DAMAGE, () => 0.99, "tundra");
  assert.equal(result.broken, true);
  assert.equal(result.state.block.id, "sapphire_ore");
  assert.equal(result.state.hp, result.state.block.maxHp);
});

test("weighted random selection respects Plains probability intervals", () => {
  assert.equal(randomBlock(() => 0).id, "grass");
  assert.equal(randomBlock(() => 0.399999).id, "grass");
  assert.equal(randomBlock(() => 0.4).id, "oak_log");
  assert.equal(randomBlock(() => 0.7).id, "cobblestone");
  assert.equal(randomBlock(() => 0.95).id, "emerald_ore");
  assert.equal(randomBlock(() => 0.999).id, "emerald_ore");
});

test("weighted random selection respects Tundra probability intervals", () => {
  assert.equal(randomBlock(() => 0, "tundra").id, "berry_bush");
  assert.equal(randomBlock(() => 0.4, "tundra").id, "snow");
  assert.equal(randomBlock(() => 0.65, "tundra").id, "ice_block");
  assert.equal(randomBlock(() => 0.85, "tundra").id, "spruce_log");
  assert.equal(randomBlock(() => 0.95, "tundra").id, "sapphire_ore");
});

test("initial state uses the requested biome", () => {
  assert.equal(createInitialState(() => 0, "tundra").block.id, "berry_bush");
});

test("unknown biome and invalid random sources are rejected", () => {
  assert.throws(() => randomBlock(() => 0, "unknown"), RangeError);
  assert.throws(() => randomBlock(null), TypeError);
});

test("invalid damage is rejected", () => {
  assert.throws(() => mineBlock({ block: BLOCKS[0], hp: 5 }, 0), RangeError);
});

test("breaking Grass drops one Grass inventory item", () => {
  const result = mineBlock({ block: BLOCKS[0], hp: 1 }, PLAYER_DAMAGE, () => 0.99, "plains");
  assert.equal(result.broken, true);
  assert.deepEqual(result.drops, [{ itemId: "item_grass", amount: 1 }]);
  assert.equal(getBlockDrops(BLOCKS[0])[0].itemId, "item_grass");
});

test("every non-Grass block has a matching resource drop", () => {
  const expected = { oak_log: "wood_scrap", cobblestone: "cobble_rock", emerald_ore: "emerald", berry_bush: "sweet_berry", snow: "snowball", ice_block: "ice_shard", spruce_log: "spruce_wood", sapphire_ore: "sapphire" };
  for (const blocks of Object.values(BLOCKS_BY_BIOME)) for (const block of blocks) {
    if (block.id === "grass") continue;
    assert.deepEqual(getBlockDrops(block).map(({ itemId }) => itemId), [expected[block.id]]);
  }
});