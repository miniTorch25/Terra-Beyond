import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, loadSettings, normalizeSettings, saveSettings } from "../src/settings.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

test("settings default to enabled when no saved preferences exist", () => {
  assert.deepEqual(loadSettings(createStorage()), { ...DEFAULT_SETTINGS });
});

test("settings load valid saved values and safely default missing options", () => {
  const storage = createStorage({ [SETTINGS_STORAGE_KEY]: JSON.stringify({ showDropNotifications: false }) });
  assert.deepEqual(loadSettings(storage), {
    showMiningFeedback: true,
    showDropNotifications: false,
    showDamageOverlay: true,
    protectLiquidSources: true,
  });
});

test("invalid stored settings fall back to defaults", () => {
  assert.deepEqual(loadSettings(createStorage({ [SETTINGS_STORAGE_KEY]: "not-json" })), { ...DEFAULT_SETTINGS });
});

test("saveSettings persists only supported boolean settings", () => {
  const storage = createStorage();
  const saved = saveSettings(storage, { showMiningFeedback: false, unknownOption: true });
  assert.deepEqual(saved, { showMiningFeedback: false, showDropNotifications: true, showDamageOverlay: true, protectLiquidSources: true });
  assert.deepEqual(loadSettings(storage), saved);
});

test("normalizeSettings rejects non-object input", () => {
  assert.deepEqual(normalizeSettings(null), { ...DEFAULT_SETTINGS });
});


test("liquid source protection can be disabled and persists across reloads", () => {
  const storage = createStorage();
  const saved = saveSettings(storage, { protectLiquidSources: false });
  assert.equal(saved.protectLiquidSources, false);
  assert.equal(loadSettings(storage).protectLiquidSources, false);
});

test("legacy settings default liquid source protection to enabled", () => {
  const storage = createStorage({ [SETTINGS_STORAGE_KEY]: JSON.stringify({ showMiningFeedback: false }) });
  assert.equal(loadSettings(storage).protectLiquidSources, true);
});
