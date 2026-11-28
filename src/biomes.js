export const BIOMES = Object.freeze([
  Object.freeze({
    id: "plains",
    name: "Plains",
    description: "An open grassland with gentle terrain. Oak trees, grass, stone, and emerald deposits can be found here.",
    unlocked: true,
    unlockCost: null,
  }),
  Object.freeze({
    id: "tundra",
    name: "Tundra",
    description: "A cold northern biome covered in snow and ice. Spruce trees, frozen water, berries, and sapphire deposits are found here.",
    unlocked: false,
    unlockCost: Object.freeze({ itemId: "emerald", amount: 75 }),
  }),
]);

export function getBiomeAction(biome, currentBiomeId) {
  if (!biome || typeof biome.id !== "string") throw new TypeError("A valid biome is required.");
  if (biome.id === currentBiomeId) return "Current";
  if (biome.unlocked) return "Visit";
  if (biome.unlockCost === null || biome.unlockCost === undefined || biome.unlockCost === "") return "Lock";
  return typeof biome.unlockCost === "string" ? biome.unlockCost : "Unlock";
}

export function getBiomeById(id) {
  return BIOMES.find((biome) => biome.id === id) || null;
}
