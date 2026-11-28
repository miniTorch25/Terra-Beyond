export const INVENTORY_CATEGORIES = Object.freeze([
  Object.freeze({ id: "item", label: "Item" }), Object.freeze({ id: "tool", label: "Tool" }),
  Object.freeze({ id: "sword", label: "Sword" }), Object.freeze({ id: "artifact", label: "Artifact" }),
]);
const item = (id, name, biome) => Object.freeze({ id, name, image: `./sprites/item/${biome}/${id}.png`, count: 0, unique: false });
const tool = (id, name, biome) => Object.freeze({ id, name, image: `./sprites/tool/${biome}/${id}.png`, count: 0, unique: true });
const sword = (id, name, biome) => Object.freeze({ id, name, image: `./sprites/sword/${biome}/${id}.png`, count: 0, unique: true });
const sections = (natural = [], crafted = []) => Object.freeze({ Natural: Object.freeze(natural), Crafted: Object.freeze(crafted) });
const craftedOnly = (crafted = []) => Object.freeze({ Crafted: Object.freeze(crafted.map((entry) => Object.freeze({ ...entry, unique: true }))) });
export const PLAINS_INVENTORY = Object.freeze({
  item: sections([item("item_grass","Grass","plains"),item("wood_scrap","Wood Scrap","plains"),item("cobble_rock","Cobble Rock","plains"),item("emerald","Emerald","plains")]),
  tool: craftedOnly([tool("sharp_stone","Sharp Stone","plains"),tool("oak_pick","Wood Pick","plains"),tool("rock_pick","Rock Pick","plains"),tool("emerald_pick","Emerald Pick","plains")]),
  sword: craftedOnly([sword("stone_dagger","Stone Dagger","plains")]), artifact: craftedOnly(),
});
export const TUNDRA_INVENTORY = Object.freeze({
  item: sections([item("sweet_berry","Sweet Berry","tundra"),item("snowball","Snowball","tundra"),item("spruce_wood","Spruce Wood","tundra"),item("ice_shard","Ice Shard","tundra"),item("sapphire","Sapphire","tundra")]),
  tool: craftedOnly([tool("ice_pick","Ice Pick","tundra"),tool("sapphire_pick","Sapphire Pick","tundra")]),
  sword: craftedOnly([sword("sapphire_dagger","Sapphire Dagger","tundra")]), artifact: craftedOnly(),
});
export const LIQUID_INVENTORY = Object.freeze([
  Object.freeze({id:"water",name:"Water",image:"./sprites/liquid/water.png",count:0,biome:"Plains",tag:"Liquid",unique:false}),
  Object.freeze({id:"cold_water",name:"Cold Water",image:"./sprites/liquid/cold_water.png",count:0,biome:"Tundra",tag:"Liquid",unique:false}),
]);
export const INVENTORY_ITEMS = Object.freeze([
  ...PLAINS_INVENTORY.item.Natural,...PLAINS_INVENTORY.item.Crafted,...PLAINS_INVENTORY.tool.Crafted,...PLAINS_INVENTORY.sword.Crafted,...PLAINS_INVENTORY.artifact.Crafted,
  ...TUNDRA_INVENTORY.item.Natural,...TUNDRA_INVENTORY.item.Crafted,...TUNDRA_INVENTORY.tool.Crafted,...TUNDRA_INVENTORY.sword.Crafted,...TUNDRA_INVENTORY.artifact.Crafted,...LIQUID_INVENTORY,
]);
export function chunkItems(items, perRow=6) {
  if (!Array.isArray(items)) throw new TypeError("Items must be an array.");
  if (!Number.isInteger(perRow)||perRow<1) throw new RangeError("Items per row must be a positive integer.");
  const rows=[]; for(let i=0;i<items.length;i+=perRow) rows.push(items.slice(i,i+perRow)); return rows;
}
const ITEM_DESCRIPTIONS = Object.freeze({
 item_grass:"A little piece of the world. It looks ordinary, but every journey starts somewhere.",wood_scrap:"A rough piece of timber left behind after gathering wood.",cobble_rock:"A sturdy stone fragment. Useful, dependable, and not very comfortable to carry.",emerald:"A bright green gem that seems far too valuable to leave lying around.",sweet_berry:"A bright berry that brings a little colour to the frozen landscape.",snowball:"A tightly packed ball of snow. Cold, round, and ready to be thrown.",spruce_wood:"A piece of hardy wood gathered from the northern forest.",ice_shard:"A sharp fragment of clear ice that catches the light.",sapphire:"A precious blue gemstone hidden beneath the frozen ground.",sharp_stone:"A carefully sharpened stone that improves your basic damage.",oak_pick:"A simple wooden pick made for getting started. It improves damage against blocks.",rock_pick:"A rough but reliable pick for harder materials.",emerald_pick:"A brilliant pick with an unmistakable green shine.",stone_dagger:"A small stone blade. Better than facing the wilderness empty-handed.",ice_pick:"A cold-forged pick suited to the frozen frontier.",sapphire_dagger:"A blue gemstone blade with a crisp edge.",sapphire_pick:"A powerful pick fitted with a sapphire head.",cold_water:"Water chilled by the frozen air of the Tundra.",water:"A clear and familiar liquid found in the Plains."
});
const ORIGIN_BLOCKS = Object.freeze({
  item_grass: ["plains", "grass"], wood_scrap: ["plains", "oak_log"],
  cobble_rock: ["plains", "cobblestone"], emerald: ["plains", "emerald_ore"],
  sweet_berry: ["tundra", "berry_bush"], snowball: ["tundra", "snow"],
  spruce_wood: ["tundra", "spruce_log"], ice_shard: ["tundra", "ice_block"],
  sapphire: ["tundra", "sapphire_ore"],
});
export function getItemDetails(id, fallbackTag="Natural") {
 const entry=INVENTORY_ITEMS.find(candidate=>candidate.id===id); if(!entry)return null;
 const source=ORIGIN_BLOCKS[id];
 const origin=source?{name:source[1].replaceAll("_"," ").replace(/\b\w/g,letter=>letter.toUpperCase()),image:`./sprites/block/${source[0]}/${source[1]}.png`}:null;
 return {...entry,description:ITEM_DESCRIPTIONS[id]||"A curious item waiting to be discovered.",tag:entry.tag||fallbackTag,origin};
}
const COUNT_SUFFIXES=["","k","M","B","T","Qa","Qi","Sx","Sp","Oc","No","Dc"];
export function formatItemCount(value) {
 if(!Number.isFinite(value)||value<0)throw new RangeError("Item count must be a non-negative finite number.");
 const count=Math.floor(value); if(count<1000)return String(count);
 const tier=Math.floor(Math.log10(count)/3); if(tier>=COUNT_SUFFIXES.length)return `1e${tier*3}`;
 return `${Math.floor(count/(1000**tier))}${COUNT_SUFFIXES[tier]}`;
}
