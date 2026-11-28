# Terra Beyond

## Game progress saves

Terra Beyond automatically saves gameplay progress in the browser's LocalStorage and restores it when the game opens again.

The save includes:
- Current biome, current block, and remaining block HP
- Unlocked biomes and inventory item counts
- Items dropped into the world, including their remaining lifetime
- Infinity Catalyst balance
- Unlocked Workbench stations and crafted recipes
- Equipped tools, swords, and artifacts

Settings and navigation panel layouts are stored separately and are not overwritten by gameplay saves. The **Reset Game Progress** action starts a fresh Plains run and saves that reset state.

**Storage limitation:** saves are local to the current browser and device. They are not uploaded to a cloud account or synchronized between devices. Clearing this site's browser storage or using a private browsing session can remove or prevent the save from being retained.
