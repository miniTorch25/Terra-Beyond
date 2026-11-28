import test from "node:test";
import assert from "node:assert/strict";
import { createEquipmentState } from "../src/equipment.js";
import { renderEquipmentSlots, getEquippedAbilities, renderAbilityLog } from "../src/equipment-ui.js";

test("Gear renders Tool and Sword together as one six-slot row", () => {
  const html = renderEquipmentSlots(createEquipmentState(), []);
  assert.match(html, /equipment-primary-grid/);
  assert.equal((html.match(/data-equipment-slot="tool"/g) || []).length, 3);
  assert.equal((html.match(/data-equipment-slot="sword"/g) || []).length, 3);
  assert.equal((html.match(/data-equipment-slot="artifact"/g) || []).length, 6);
  assert.match(html, /<h4>TOOL<\/h4><h4>SWORD<\/h4>/);
});

test("unlocked empty slots remain blank and locked Tool/Sword slots show Locked", () => {
  const html = renderEquipmentSlots(createEquipmentState(), []);
  assert.equal((html.match(/>Locked<\/button>/g) || []).length, 4);
  assert.equal((html.match(/title="Empty[^"]*"><\/button>/g) || []).length, 8);
  assert.doesNotMatch(html, />(?:Drop Tool|Drop Sword|Empty Tool|Empty Sword)</);
});

test("equipped slots show only the item image and remain unequippable", () => {
  const item = { id: "pick", name: "Stone Pick", image: "./pick.png", category: "tool" };
  const state = { ...createEquipmentState(), tool: ["pick", null, null] };
  const html = renderEquipmentSlots(state, [item]);
  assert.match(html, /data-unequip-slot="tool"/);
  assert.match(html, /src="\.\/pick\.png"/);
  assert.doesNotMatch(html, /Stone Pick<\/strong>|Unequip<\/button>/);
});

test("Ability Log collects one line per equipped item's special effect", () => {
  const items = [
    { id: "pick", abilities: ["Chance to find extra ore", "Reduced stamina use"] },
    { id: "blade", abilities: [{ name: "Critical Strike", description: "Chance to deal critical damage" }] },
  ];
  const state = { ...createEquipmentState(), tool: ["pick", null, null], sword: ["blade", null, null] };
  assert.deepEqual(getEquippedAbilities(state, items), [
    "Chance to find extra ore", "Reduced stamina use", "Chance to deal critical damage"
  ]);
  const html = renderAbilityLog(state, items);
  assert.equal((html.match(/<li>/g) || []).length, 3);
  assert.match(html, /Chance to find extra ore/);
});

test("Ability Log shows a neutral empty state when no equipped item has special effects", () => {
  assert.equal(renderAbilityLog(createEquipmentState(), []), "<li>No special abilities.</li>");
});


test("Ability Log displays the real special abilities stored on crafted mining tools", async () => {
  const { INVENTORY_ITEMS } = await import("../src/inventory.js");
  const expected = {
    sharp_stone: "Block Dmg +2 when mining Oak Log",
    oak_pick: "Block Dmg -1 when mining Emerald Ore",
    emerald_pick: "+1 Emerald when mining Emerald Ore",
  };
  for (const [id, ability] of Object.entries(expected)) {
    const state = { ...createEquipmentState(), tool: [id, null, null] };
    assert.deepEqual(getEquippedAbilities(state, INVENTORY_ITEMS), [ability]);
    assert.ok(renderAbilityLog(state, INVENTORY_ITEMS).includes(ability));
  }
});
