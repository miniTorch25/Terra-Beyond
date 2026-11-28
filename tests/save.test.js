import test from "node:test";
import assert from "node:assert/strict";
import { INVENTORY_ITEMS } from "../src/inventory.js";
import { createInitialState } from "../src/game.js";
import { createInventoryState } from "../src/inventory-state.js";
import { createEquipmentState } from "../src/equipment.js";
import { createWorkbenchState } from "../src/workbench.js";
import { STARTING_IC } from "../src/economy.js";
import { GAME_SAVE_STORAGE_KEY, GAME_SAVE_VERSION, loadGameProgress, saveGameProgress } from "../src/save.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

function createProgress(overrides = {}) {
  const inventoryState = createInventoryState(INVENTORY_ITEMS);
  inventoryState.counts.emerald = 85;
  inventoryState.counts.ice_pick = 1;
  const workbenchState = createWorkbenchState();
  workbenchState.unlockedStations.add("crafting_table");
  workbenchState.craftedRecipes.add("ice_pick");
  const equipmentState = createEquipmentState();
  equipmentState.tool[0] = "ice_pick";
  return {
    state: { block: { id: "ice_block" }, hp: 12.5 },
    currentBiomeId: "tundra",
    unlockedBiomeIds: new Set(["plains", "tundra"]),
    inventoryState,
    catalystBalance: 9876,
    workbenchState,
    equipmentState,
    savedAt: 1234,
    ...overrides,
  };
}

test("save and load restore mining, inventory, biome, economy, workbench and equipment progress", () => {
  const storage = createStorage();
  assert.equal(saveGameProgress(storage, createProgress()), true);
  const raw = JSON.parse(storage.getItem(GAME_SAVE_STORAGE_KEY));
  assert.equal(raw.version, GAME_SAVE_VERSION);
  const restored = loadGameProgress(storage, INVENTORY_ITEMS, 1000);
  assert.equal(restored.currentBiomeId, "tundra");
  assert.equal(restored.state.block.id, "ice_block");
  assert.equal(restored.state.hp, 12.5);
  assert.equal(restored.inventoryState.counts.emerald, 85);
  assert.equal(restored.catalystBalance, 9876);
  assert.ok(restored.unlockedBiomeIds.has("tundra"));
  assert.ok(restored.workbenchState.unlockedStations.has("crafting_table"));
  assert.ok(restored.workbenchState.craftedRecipes.has("ice_pick"));
  assert.equal(restored.equipmentState.tool[0], "ice_pick");
});

test("world drops survive reload with remaining lifetime and unique instance IDs", () => {
  const storage = createStorage();
  const progress = createProgress();
  progress.inventoryState.detached = [
    { instanceId: 4, itemId: "emerald", stackCount: 3, expiresAt: 9000 },
    { instanceId: 5, itemId: "wood_scrap", stackCount: 2, expiresAt: 8000 },
    { instanceId: 6, itemId: "coal", stackCount: 1, expiresAt: 500 },
  ];
  progress.inventoryState.nextId = 6;
  saveGameProgress(storage, progress);
  const restored = loadGameProgress(storage, INVENTORY_ITEMS, 1000);
  assert.deepEqual(restored.inventoryState.detached.map((item) => item.instanceId), [4, 5]);
  assert.equal(restored.inventoryState.nextId, 6);
});

test("expired, unknown and malformed world drops are ignored", () => {
  const storage = createStorage();
  const progress = createProgress();
  progress.inventoryState.detached = [
    { instanceId: 1, itemId: "missing_item", stackCount: 1, expiresAt: 9000 },
    { instanceId: 2, itemId: "emerald", stackCount: 1, expiresAt: 9000 },
    { instanceId: 3, itemId: "coal", stackCount: 0, expiresAt: 9000 },
  ];
  saveGameProgress(storage, progress);
  const restored = loadGameProgress(storage, INVENTORY_ITEMS, 1000);
  assert.deepEqual(restored.inventoryState.detached.map((item) => item.instanceId), [2]);
});

test("locked biomes cannot be selected as the active biome and Plains is always unlocked", () => {
  const storage = createStorage();
  saveGameProgress(storage, createProgress({ currentBiomeId: "cave", unlockedBiomeIds: new Set(["plains"]) }));
  const restored = loadGameProgress(storage, INVENTORY_ITEMS);
  assert.equal(restored.currentBiomeId, "plains");
  assert.deepEqual([...restored.unlockedBiomeIds], ["plains"]);
});

test("unknown block IDs fall back to the first block in the saved biome", () => {
  const storage = createStorage();
  const progress = createProgress({ state: { block: { id: "invalid_block" }, hp: 4 } });
  saveGameProgress(storage, progress);
  const restored = loadGameProgress(storage, INVENTORY_ITEMS);
  assert.equal(restored.state.block.id, "berry_bush");
  assert.equal(restored.state.hp, 15);
});

test("equipment is restored only for owned items in valid unlocked slots", () => {
  const storage = createStorage();
  const progress = createProgress();
  progress.equipmentState.tool[1] = "ice_pick";
  progress.equipmentState.sword[0] = "ice_pick";
  progress.inventoryState.counts.ice_pick = 0;
  saveGameProgress(storage, progress);
  const restored = loadGameProgress(storage, INVENTORY_ITEMS);
  assert.equal(restored.equipmentState.tool[0], null);
  assert.equal(restored.equipmentState.tool[1], null);
  assert.equal(restored.equipmentState.sword[0], null);
});

test("invalid currency data falls back to the normal starting balance", () => {
  const storage = createStorage();
  saveGameProgress(storage, createProgress({ catalystBalance: -1 }));
  assert.equal(loadGameProgress(storage, INVENTORY_ITEMS).catalystBalance, STARTING_IC);
});

test("unsupported save versions and corrupt JSON are ignored", () => {
  const storage = createStorage({ [GAME_SAVE_STORAGE_KEY]: JSON.stringify({ version: 999 }) });
  assert.equal(loadGameProgress(storage, INVENTORY_ITEMS), null);
  storage.setItem(GAME_SAVE_STORAGE_KEY, "{broken");
  assert.equal(loadGameProgress(storage, INVENTORY_ITEMS), null);
});

test("save failures are handled without interrupting gameplay", () => {
  const storage = { setItem() { throw new Error("quota exceeded"); } };
  assert.equal(saveGameProgress(storage, createProgress()), false);
});

test("missing save data leaves a new game untouched", () => {
  assert.equal(loadGameProgress(createStorage(), INVENTORY_ITEMS), null);
  assert.equal(createInitialState(() => 0, "plains").block.id, "grass");
});


test("water puddle state is saved and restored only for Grass", () => {
  const storage = createStorage();
  const progress = createProgress({ currentBiomeId: "plains", unlockedBiomeIds: new Set(["plains"]), state: { block: { id: "grass" }, hp: 3, waterPuddle: true } });
  saveGameProgress(storage, progress);
  const raw = JSON.parse(storage.getItem(GAME_SAVE_STORAGE_KEY));
  assert.equal(raw.waterPuddle, true);
  assert.equal(loadGameProgress(storage, INVENTORY_ITEMS).state.waterPuddle, true);

  const nonGrass = createProgress({ state: { block: { id: "ice_block" }, hp: 12, waterPuddle: true } });
  saveGameProgress(storage, nonGrass);
  assert.equal(loadGameProgress(storage, INVENTORY_ITEMS).state.waterPuddle, false);
});
