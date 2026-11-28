import test from "node:test";
import assert from "node:assert/strict";
import { createInventoryState, getInventoryCount, takeInventoryItem, returnInventoryItem, expireInventoryItem } from "../src/inventory-state.js";

test("taking an item decreases its inventory count and creates a 90-second world item", () => {
  const initial = createInventoryState([{ id: "emerald", count: 3 }]);
  const result = takeInventoryItem(initial, "emerald", 1000);
  assert.equal(getInventoryCount(result.state, "emerald"), 2);
  assert.equal(result.detachedItem.expiresAt, 91000);
});

test("the world item can be returned and restores its own item type", () => {
  let state = createInventoryState([{ id: "emerald", count: 2 }, { id: "water", count: 1 }]);
  const taken = takeInventoryItem(state, "emerald", 0);
  state = returnInventoryItem(taken.state, taken.detachedItem.instanceId);
  assert.equal(getInventoryCount(state, "emerald"), 2);
  assert.equal(getInventoryCount(state, "water"), 1);
  assert.equal(state.detached.length, 0);
});

test("up to ten detached items can exist at once", () => {
  let state = createInventoryState([{ id: "stone", count: 12 }]);
  for (let i = 0; i < 10; i++) state = takeInventoryItem(state, "stone").state;
  const blocked = takeInventoryItem(state, "stone");
  assert.equal(blocked.detachedItem, null);
  assert.equal(blocked.state.detached.length, 10);
});

test("items cannot be taken when inventory count is empty", () => {
  const state = createInventoryState([{ id: "stone", count: 0 }]);
  assert.equal(takeInventoryItem(state, "stone").detachedItem, null);
});

test("detached items expire after their lifetime", () => {
  const taken = takeInventoryItem(createInventoryState([{ id: "berry", count: 1 }]), "berry", 500);
  const beforeExpiry = expireInventoryItem(taken.state, taken.detachedItem.instanceId, 90499);
  assert.equal(beforeExpiry.detached.length, 1);
  const expired = expireInventoryItem(beforeExpiry, taken.detachedItem.instanceId, 90500);
  assert.equal(expired.detached.length, 0);
  assert.equal(getInventoryCount(expired, "berry"), 0);
});

test("returning or expiring an unknown item instance is safe", () => {
  const state = createInventoryState([]);
  assert.equal(returnInventoryItem(state, 99), state);
  assert.equal(expireInventoryItem(state, 99), state);
});
