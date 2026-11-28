import test from "node:test";
import assert from "node:assert/strict";
import { BIOMES, getBiomeAction, getBiomeById } from "../src/biomes.js";

test("map includes Plains and Tundra with descriptive text", () => {
  assert.deepEqual(BIOMES.map(({ id }) => id), ["plains", "tundra", "cave"]);
  assert.ok(BIOMES.every(({ name, description }) => name && description.length > 20));
});

test("the current biome is marked Current", () => {
  assert.equal(getBiomeAction(getBiomeById("plains"), "plains"), "Current");
});

test("unlocked non-current biomes are marked Visit", () => {
  const biome = { id: "forest", unlocked: true, unlockCost: null };
  assert.equal(getBiomeAction(biome, "plains"), "Visit");
});

test("Tundra unlock cost is 75 Emerald", () => {
  assert.deepEqual(getBiomeById("tundra").unlockCost, { itemId: "emerald", amount: 75 });
  assert.equal(getBiomeAction(getBiomeById("tundra"), "plains"), "Unlock");
});

test("locked biomes with a configured cost show that cost", () => {
  const biome = { id: "desert", unlocked: false, unlockCost: "250 Coins" };
  assert.equal(getBiomeAction(biome, "plains"), "250 Coins");
});

test("unknown biome IDs return null", () => {
  assert.equal(getBiomeById("unknown"), null);
});

test("invalid biome values are rejected", () => {
  assert.throws(() => getBiomeAction(null, "plains"), TypeError);
});

test("Cave unlock costs 100 Sapphire", () => {
  assert.deepEqual(getBiomeById("cave").unlockCost, { itemId: "sapphire", amount: 100 });
  assert.equal(getBiomeAction(getBiomeById("cave"), "tundra"), "Unlock");
});
