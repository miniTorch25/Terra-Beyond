import test from "node:test";
import assert from "node:assert/strict";
import { createEquipmentState, equipItem, getEquippedItem, getEquipmentSlot, isEquippableItem, isEquipmentSlotUnlocked } from "../src/equipment.js";
import { createInventoryState, addInventoryItem } from "../src/inventory-state.js";
import { INVENTORY_ITEMS } from "../src/inventory.js";
const owned = (...ids) => ids.reduce((state, id) => addInventoryItem(state, id, 1), createInventoryState(INVENTORY_ITEMS));
test("equipment state creates 3 Tool, 3 Sword and 6 Artifact slots", () => {
  const state = createEquipmentState();
  assert.equal(state.tool.length, 3); assert.equal(state.sword.length, 3); assert.equal(state.artifact.length, 6);
  assert.deepEqual(state.tool, [null, null, null]);
});
test("Tool, Sword and Artifact categories map to their own slots", () => {
  assert.equal(getEquipmentSlot(INVENTORY_ITEMS.find(x => x.id === "sharp_stone")), "tool");
  assert.equal(getEquipmentSlot(INVENTORY_ITEMS.find(x => x.id === "stone_dagger")), "sword");
  assert.equal(getEquipmentSlot({ category: "artifact" }), "artifact");
  assert.equal(isEquippableItem(INVENTORY_ITEMS.find(x => x.id === "wood_scrap")), false);
});
test("only first Tool and Sword slots are unlocked; all Artifact slots are unlocked", () => {
  assert.equal(isEquipmentSlotUnlocked("tool", 0), true);
  assert.equal(isEquipmentSlotUnlocked("tool", 1), false);
  assert.equal(isEquipmentSlotUnlocked("sword", 2), false);
  assert.equal(isEquipmentSlotUnlocked("artifact", 5), true);
});
test("equipping requires ownership", () => assert.equal(equipItem(createEquipmentState(), "sharp_stone", createInventoryState(INVENTORY_ITEMS), INVENTORY_ITEMS).reason, "not-owned"));
test("Tool and Sword can be equipped simultaneously", () => {
  let state = createEquipmentState();
  const inventory = owned("sharp_stone", "stone_dagger");
  state = equipItem(state, "sharp_stone", inventory, INVENTORY_ITEMS).equipmentState;
  state = equipItem(state, "stone_dagger", inventory, INVENTORY_ITEMS).equipmentState;
  assert.deepEqual(state.tool, ["sharp_stone", null, null]);
  assert.deepEqual(state.sword, ["stone_dagger", null, null]);
  assert.equal(getEquippedItem(state.tool[0], INVENTORY_ITEMS).name, "Sharp Stone");
});
test("locked Tool and Sword slots reject equipment", () => {
  const inventory = owned("sharp_stone", "stone_dagger");
  assert.equal(equipItem(createEquipmentState(), "sharp_stone", inventory, INVENTORY_ITEMS, 1).reason, "locked-slot");
  assert.equal(equipItem(createEquipmentState(), "stone_dagger", inventory, INVENTORY_ITEMS, 2).reason, "locked-slot");
});
test("equipping into Artifact slots works independently", () => {
  const artifact = { id: "test_artifact", category: "artifact" };
  const inventory = { counts: { test_artifact: 1 } };
  const result = equipItem(createEquipmentState(), artifact.id, inventory, [artifact], 5);
  assert.equal(result.success, true);
  assert.equal(result.equipmentState.artifact[5], artifact.id);
});
test("equipping same item toggles off only its own slot", () => {
  const inventory = owned("sharp_stone", "stone_dagger");
  let state = { ...createEquipmentState(), tool: ["sharp_stone", null, null], sword: ["stone_dagger", null, null] };
  state = equipItem(state, "sharp_stone", inventory, INVENTORY_ITEMS).equipmentState;
  assert.deepEqual(state.tool, [null, null, null]);
  assert.deepEqual(state.sword, ["stone_dagger", null, null]);
});
test("natural resources cannot be equipped", () => assert.equal(equipItem(createEquipmentState(), "wood_scrap", owned("wood_scrap"), INVENTORY_ITEMS).reason, "not-equippable"));
