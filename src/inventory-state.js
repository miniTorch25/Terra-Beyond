export function createInventoryState(items = []) {
  const counts = {};
  for (const item of items) counts[item.id] = item.count ?? 0;
  return { counts, detached: [], nextId: 1 };
}

export function getInventoryCount(state, itemId) {
  return Math.max(0, Math.floor(state.counts[itemId] ?? 0));
}

export function isInventoryDropTarget({ overSlot = false, inventoryOpen = false, overInventoryButton = false } = {}) {
  return Boolean(overInventoryButton || (overSlot && inventoryOpen));
}

export function takeInventoryItem(state, itemId, now = Date.now(), maxDetached = 10, lifetime = 90000) {
  if (state.detached.length >= maxDetached || getInventoryCount(state, itemId) < 1) {
    return { state, detachedItem: null };
  }
  const detachedItem = { instanceId: state.nextId, itemId, expiresAt: now + lifetime };
  return {
    state: {
      ...state,
      counts: { ...state.counts, [itemId]: getInventoryCount(state, itemId) - 1 },
      detached: [...state.detached, detachedItem],
      nextId: state.nextId + 1,
    },
    detachedItem,
  };
}

export function returnInventoryItem(state, instanceId) {
  const detachedItem = state.detached.find((entry) => entry.instanceId === instanceId);
  if (!detachedItem) return state;
  return {
    ...state,
    counts: { ...state.counts, [detachedItem.itemId]: getInventoryCount(state, detachedItem.itemId) + 1 },
    detached: state.detached.filter((entry) => entry.instanceId !== instanceId),
  };
}

export function expireInventoryItem(state, instanceId, now = Date.now()) {
  const entry = state.detached.find((item) => item.instanceId === instanceId);
  if (!entry || entry.expiresAt > now) return state;
  return { ...state, detached: state.detached.filter((item) => item.instanceId !== instanceId) };
}
