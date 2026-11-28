export const STARTING_IC = 100_000_000;
export const DUPLICATE_COST = 1;
export const DUPLICATE_AMOUNT = 500;

export function duplicateItem(balance, inventoryState, itemId) {
  if (!Object.hasOwn(inventoryState.counts, itemId)) {
    return { success: false, reason: "unknown-item", balance, inventoryState };
  }
  const owned = Math.max(0, Math.floor(inventoryState.counts[itemId] ?? 0));
  if (owned < 1) {
    return { success: false, reason: "missing-prototype", balance, inventoryState };
  }
  if (!Number.isSafeInteger(balance) || balance < DUPLICATE_COST) {
    return { success: false, reason: "insufficient-ic", balance, inventoryState };
  }
  return {
    success: true,
    balance: balance - DUPLICATE_COST,
    inventoryState: {
      ...inventoryState,
      counts: {
        ...inventoryState.counts,
        [itemId]: owned + DUPLICATE_AMOUNT,
      },
    },
    amount: DUPLICATE_AMOUNT,
    cost: DUPLICATE_COST,
  };
}
