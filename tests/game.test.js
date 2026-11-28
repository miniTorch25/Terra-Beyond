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
  const expected = { oak_log: "wood_scrap", cobblestone: "cobble_rock", emerald_ore: "emerald", berry_bush: "sweet_berry", snow: "snowball", ice_block: "ice_shard", spruce_log: "spruce_wood", sapphire_ore: "sapphire", stone_block: "stone_item", coal_ore: "coal", copper_ore: "raw_copper", iron_ore: "raw_iron", lead_ore: "raw_lead" };
  for (const blocks of Object.values(BLOCKS_BY_BIOME)) for (const block of blocks) {
    if (block.id === "grass") continue;
    assert.deepEqual(getBlockDrops(block).map(({ itemId }) => itemId), [expected[block.id]]);
  }
});

test("Emerald Pick grants one bonus Emerald when Emerald Ore breaks",()=>{const ore=BLOCKS.find(block=>block.id==="emerald_ore");const r=mineBlock({block:ore,hp:1},1,()=>0,"plains","emerald_pick");assert.deepEqual(r.drops,[{itemId:"emerald",amount:2}])});test("fractional mining damage preserves decimal HP",()=>{const r=mineBlock({block:BLOCKS[0],hp:5},1.5,()=>0.99);assert.equal(r.broken,false);assert.equal(r.state.hp,3.5)});
test("Tundra block HP is twice the corresponding Plains progression",()=>{
 const plains=BLOCKS,tundra=BLOCKS_BY_BIOME.tundra;
 assert.deepEqual(tundra.map(block=>block.maxHp),[10,14,20,24,30]);
 assert.deepEqual([tundra[0].maxHp,tundra[1].maxHp,tundra[2].maxHp,tundra[4].maxHp],plains.map(block=>block.maxHp*2));
});
test("Cave blocks follow Stone to Lead rarity order and descending spawn rates",()=>{
 const cave=BLOCKS_BY_BIOME.cave;
 assert.deepEqual(cave.map(block=>block.id),["stone_block","coal_ore","copper_ore","iron_ore","lead_ore"]);
 assert.deepEqual(cave.map(block=>block.spawnRate),[40,25,18,12,5]);
 assert.equal(cave.reduce((sum,block)=>sum+block.spawnRate,0),100);
});
test("every Cave block drops its matching natural resource",()=>{
 const expected={stone_block:"stone_item",coal_ore:"coal",copper_ore:"raw_copper",iron_ore:"raw_iron",lead_ore:"raw_lead"};
 for(const block of BLOCKS_BY_BIOME.cave)assert.deepEqual(getBlockDrops(block),[{itemId:expected[block.id],amount:1}]);
});
