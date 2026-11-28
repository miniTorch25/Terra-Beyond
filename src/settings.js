export const SETTINGS_STORAGE_KEY = "terra-beyond-settings";

export const DEFAULT_SETTINGS = Object.freeze({
  showMiningFeedback: true,
  showDropNotifications: true,
  showDamageOverlay: true,
  protectLiquidSources: true,
});

export function normalizeSettings(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    showMiningFeedback: source.showMiningFeedback !== false,
    showDropNotifications: source.showDropNotifications !== false,
    showDamageOverlay: source.showDamageOverlay !== false,
    protectLiquidSources: source.protectLiquidSources !== false,
  };
}

export function loadSettings(storage) {
  try {
    return normalizeSettings(JSON.parse(storage.getItem(SETTINGS_STORAGE_KEY) || "{}"));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(storage, settings) {
  const normalized = normalizeSettings(settings);
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}
