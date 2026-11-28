import test from "node:test";
import assert from "node:assert/strict";
import { MAX_TOASTS, TOAST_DURATION, pushToast, removeToast } from "../src/toast-state.js";

test("toast queues retain at most three entries and discard the oldest", () => {
  const queue = pushToast(pushToast(pushToast([], { id: 1 }), { id: 2 }), { id: 3 });
  const next = pushToast(queue, { id: 4 });
  assert.deepEqual(next.map((toast) => toast.id), [2, 3, 4]);
  assert.equal(MAX_TOASTS, 3);
});

test("notice and drop-log queues can be managed independently", () => {
  const notices = pushToast([], { id: 1, type: "warning" });
  const drops = pushToast([], { id: 2, amount: 2 });
  assert.equal(notices.length, 1);
  assert.equal(drops.length, 1);
  assert.equal(notices[0].type, "warning");
  assert.equal(drops[0].amount, 2);
});

test("a toast can be removed without mutating the original queue", () => {
  const queue = [{ id: 1 }, { id: 2 }];
  assert.deepEqual(removeToast(queue, 1), [{ id: 2 }]);
  assert.equal(queue.length, 2);
});

test("toast lifetime is five seconds", () => {
  assert.equal(TOAST_DURATION, 5000);
});
