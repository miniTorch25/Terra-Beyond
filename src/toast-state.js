export const MAX_TOASTS = 3;
export const TOAST_DURATION = 5000;

export function pushToast(queue, toast) {
  return [...queue, toast].slice(-MAX_TOASTS);
}

export function removeToast(queue, id) {
  return queue.filter((toast) => toast.id !== id);
}

export function getCraftFailureAdvice(reason) {
  return reason === "already-owned"
    ? "You already own this unique item."
    : "Gather the required resources before crafting this item.";
}
