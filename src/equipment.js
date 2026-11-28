export const EQUIPMENT_SLOT_COUNTS = Object.freeze({ tool: 3, sword: 3, artifact: 6 });
export function createEquipmentState() {
  return Object.fromEntries(Object.entries(EQUIPMENT_SLOT_COUNTS).map(([type, count]) => [type, Array(count).fill(null)]));
}
export function getEquipmentSlot(item) {
  return ["tool", "sword", "artifact"].includes(item?.category) ? item.category : null;
}
export function isEquippableItem(item) { return getEquipmentSlot(item) !== null; }
export function isEquipmentSlotUnlocked(type, index) {
  if (!Object.hasOwn(EQUIPMENT_SLOT_COUNTS, type) || !Number.isInteger(index) || index < 0 || index >= EQUIPMENT_SLOT_COUNTS[type]) return false;
  return type === "artifact" || index === 0;
}
export function equipItem(equipmentState, itemId, inventoryState, inventoryItems, slotIndex = 0) {
  const item = inventoryItems.find(entry => entry.id === itemId);
  const slot = getEquipmentSlot(item);
  if (!slot) return { success: false, reason: "not-equippable", equipmentState };
  if ((inventoryState.counts[itemId] ?? 0) < 1) return { success: false, reason: "not-owned", equipmentState };
  if (!isEquipmentSlotUnlocked(slot, slotIndex)) return { success: false, reason: "locked-slot", equipmentState };
  const current = equipmentState?.[slot]?.[slotIndex] ?? null;
  const slots = Array.isArray(equipmentState?.[slot]) ? equipmentState[slot] : createEquipmentState()[slot];
  const nextSlots = [...slots];
  nextSlots[slotIndex] = current === itemId ? null : itemId;
  return { success: true, slot, slotIndex, equipmentState: { ...createEquipmentState(), ...equipmentState, [slot]: nextSlots } };
}
export function getEquippedItem(id, items) { return items.find(item => item.id === id) ?? null; }
