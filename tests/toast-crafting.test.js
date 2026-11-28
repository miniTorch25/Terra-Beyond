import test from "node:test";
import assert from "node:assert/strict";
import { getCraftFailureAdvice } from "../src/toast-state.js";

test("crafting failures advise gathering missing resources", () => {
  assert.equal(getCraftFailureAdvice("missing-materials"), "Gather the required resources before crafting this item.");
  assert.equal(getCraftFailureAdvice("missing-requirements"), "Gather the required resources before crafting this item.");
});

test("already-owned unique items get a specific crafting explanation", () => {
  assert.equal(getCraftFailureAdvice("already-owned"), "You already own this unique item.");
});
