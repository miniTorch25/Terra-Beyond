import { BLOCKS_BY_BIOME } from "./game.js";
import { BIOMES } from "./biomes.js";
import { EQUIPMENT_SLOT_COUNTS, createEquipmentState, getEquipmentSlot, isEquipmentSlotUnlocked } from "./equipment.js";
import { RECIPES, createWorkbenchState } from "./workbench.js";

export const GAME_SAVE_VERSION = 1;
export const GAME_SAVE_STORAGE_KEY = "terra-beyond-game-save";

const biomeIds = new Set(BIOMES.map((biome) => biome.id));
const blockById = new Map(Object.values(BLOCKS_BY_BIOME).flat().map((block) => [block.id, block]));
const recipeIds = new Set(Object.values(RECIPES).flat().map((recipe) => recipe.id));
const stationIds = new Set(["crafting_table", "furnace"]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validCount(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

export function createGameSave({
  state,
  currentBiomeId,
  unlockedBiomeIds,
  inventoryState,
  catalystBalance,
  workbenchState,
  equipmentState,
  savedAt = Date.now(),
}) {
  return {
    version: GAME_SAVE_VERSION,
    savedAt,
    currentBiomeId,
    unlockedBiomeIds: [...unlockedBiomeIds],
    blockId: state.block.id,
    blockHp: state.hp,
    inventoryCounts: { ...inventoryState.counts },
    detachedItems: inventoryState.detached.map((entry) => ({ ...entry })),
    nextWorldItemId: inventoryState.nextId,
    catalystBalance,
    unlockedStations: [...workbenchState.unlockedStations],
    craftedRecipes: [...workbenchState.craftedRecipes],
    equipment: Object.fromEntries(Object.entries(equipmentState).map(([slot, items]) => [slot, [...items]])),
  };
}

export function saveGameProgress(storage, progress) {
  try {
    storage.setItem(GAME_SAVE_STORAGE_KEY, JSON.stringify(createGameSave(progress)));
    return true;
  } catch {
    return false;
  }
}

export function loadGameProgress(storage, inventoryItems, now = Date.now()) {
  let saved;
  try {
    const raw = storage.getItem(GAME_SAVE_STORAGE_KEY);
    if (!raw) return null;
    saved = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(saved) || saved.version !== GAME_SAVE_VERSION) return null;

  const knownItems = new Map(inventoryItems.map((item) => [item.id, item]));
  const unlockedBiomeIds = new Set(
    (Array.isArray(saved.unlockedBiomeIds) ? saved.unlockedBiomeIds : [])
      .filter((id) => typeof id === "string" && biomeIds.has(id)),
  );
  unlockedBiomeIds.add("plains");
  const currentBiomeId = typeof saved.currentBiomeId === "string"
    && biomeIds.has(saved.currentBiomeId)
    && unlockedBiomeIds.has(saved.currentBiomeId)
    ? saved.currentBiomeId
    : "plains";

  const block = blockById.get(saved.blockId);
  const selectedBlock = block && BLOCKS_BY_BIOME[currentBiomeId].some((entry) => entry.id === block.id)
    ? block
    : BLOCKS_BY_BIOME[currentBiomeId][0];
  const blockHp = typeof saved.blockHp === "number" && Number.isFinite(saved.blockHp) && saved.blockHp > 0
    ? Math.min(selectedBlock.maxHp, saved.blockHp)
    : selectedBlock.maxHp;

  const inventoryCounts = Object.fromEntries(inventoryItems.map((item) => {
    const count = isRecord(saved.inventoryCounts) && validCount(saved.inventoryCounts[item.id])
      ? saved.inventoryCounts[item.id]
      : 0;
    return [item.id, item.unique ? Math.min(1, count) : count];
  }));
  const detachedItems = [];
  const usedIds = new Set();
  if (Array.isArray(saved.detachedItems)) {
    for (const entry of saved.detachedItems) {
      if (detachedItems.length >= 32) break;
      if (!isRecord(entry)
        || !knownItems.has(entry.itemId)
        || !Number.isSafeInteger(entry.instanceId)
        || entry.instanceId < 1
        || usedIds.has(entry.instanceId)
        || !validCount(entry.stackCount)
        || entry.stackCount < 1
        || !Number.isFinite(entry.expiresAt)
        || entry.expiresAt <= now) continue;
      const item = knownItems.get(entry.itemId);
      detachedItems.push({
        instanceId: entry.instanceId,
        itemId: entry.itemId,
        stackCount: item.unique ? 1 : entry.stackCount,
        expiresAt: entry.expiresAt,
      });
      usedIds.add(entry.instanceId);
    }
  }
  const maxWorldItemId = detachedItems.reduce((max, entry) => Math.max(max, entry.instanceId), 0);
  const nextId = Number.isSafeInteger(saved.nextWorldItemId) && saved.nextWorldItemId > maxWorldItemId
    ? saved.nextWorldItemId
    : maxWorldItemId + 1;

  const inventoryState = {
    counts: inventoryCounts,
    uniqueIds: inventoryItems.filter((item) => item.unique).map((item) => item.id),
    detached: detachedItems,
    nextId,
  };

  const workbenchState = createWorkbenchState();
  workbenchState.unlockedStations = new Set(
    (Array.isArray(saved.unlockedStations) ? saved.unlockedStations : [])
      .filter((id) => typeof id === "string" && stationIds.has(id)),
  );
  workbenchState.craftedRecipes = new Set(
    (Array.isArray(saved.craftedRecipes) ? saved.craftedRecipes : [])
      .filter((id) => typeof id === "string" && recipeIds.has(id)),
  );

  const equipmentState = createEquipmentState();
  if (isRecord(saved.equipment)) {
    for (const [slot, slotCount] of Object.entries(EQUIPMENT_SLOT_COUNTS)) {
      const savedSlots = Array.isArray(saved.equipment[slot]) ? saved.equipment[slot] : [];
      for (let index = 0; index < slotCount; index += 1) {
        const itemId = savedSlots[index];
        const item = knownItems.get(itemId);
        if (typeof itemId === "string"
          && item
          && getEquipmentSlot(item) === slot
          && isEquipmentSlotUnlocked(slot, index)
          && inventoryCounts[itemId] > 0
          && !equipmentState[slot].includes(itemId)) {
          equipmentState[slot][index] = itemId;
        }
      }
    }
  }

  return {
    state: { block: selectedBlock, hp: blockHp },
    currentBiomeId,
    unlockedBiomeIds,
    inventoryState,
    catalystBalance: validCount(saved.catalystBalance) ? saved.catalystBalance : 0,
    workbenchState,
    equipmentState,
    savedAt: Number.isFinite(saved.savedAt) ? saved.savedAt : null,
  };
}
