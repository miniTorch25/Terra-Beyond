import test from "node:test";
import assert from "node:assert/strict";
import { STARTING_IC, DUPLICATE_COST, DUPLICATE_AMOUNT, duplicateItem } from "../src/economy.js";
import { createInventoryState, getInventoryCount } from "../src/inventory-state.js";

test("Infinity Catalyst starts at 100 million", () => {
  assert.equal(STARTING_IC, 100_000_000);
  assert.equal(DUPLICATE_COST, 1);
  assert.equal(DUPLICATE_AMOUNT, 500);
});

test("duplicate consumes 1 IC and grants 500 items when a prototype exists", () => {
  const state = createInventoryState([{ id: "item_grass", count: 1 }]);
  const result = duplicateItem(STARTING_IC, state, "item_grass");
  assert.equal(result.success, true);
  assert.equal(result.balance, 99_999_999);
  assert.equal(getInventoryCount(result.inventoryState, "item_grass"), 501);
  assert.equal(getInventoryCount(state, "item_grass"), 1);
});

test("duplicate is blocked without an owned prototype and does not charge IC", () => {
  const state = createInventoryState([{ id: "item_grass", count: 0 }]);
  const result = duplicateItem(STARTING_IC, state, "item_grass");
  assert.equal(result.success, false);
  assert.equal(result.reason, "missing-prototype");
  assert.equal(result.balance, STARTING_IC);
  assert.equal(getInventoryCount(result.inventoryState, "item_grass"), 0);
});

test("duplicate is blocked when IC is insufficient", () => {
  const state = createInventoryState([{ id: "item_grass", count: 1 }]);
  const result = duplicateItem(0, state, "item_grass");
  assert.equal(result.success, false);
  assert.equal(result.reason, "insufficient-ic");
  assert.equal(getInventoryCount(result.inventoryState, "item_grass"), 1);
});

test("unknown item IDs cannot be duplicated", () => {
  const result = duplicateItem(STARTING_IC, createInventoryState([]), "unknown");
  assert.equal(result.success, false);
  assert.equal(result.reason, "unknown-item");
});
