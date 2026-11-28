import test from"node:test";import assert from"node:assert/strict";import{createWorkbenchState,CRAFTING_TABLE_COST,FURNACE_COST,RECIPES,getUncraftedToolRecipes,getVisibleRecipes,unlockCraftingTable,unlockFurnace,craftRecipe}from"../src/workbench.js";import{createInventoryState,addInventoryItem}from"../src/inventory-state.js";import{INVENTORY_ITEMS}from"../src/inventory.js";
const unlocked=()=>{const w=createWorkbenchState();w.unlockedStations.add("crafting_table");return w;};const invWith=o=>{let s=createInventoryState(INVENTORY_ITEMS);for(const[k,n]of Object.entries(o))s=addInventoryItem(s,k,n);return s;};
test("Crafting Table costs 10 Wood Scrap and 2 Cobble Rock",()=>{assert.deepEqual(CRAFTING_TABLE_COST,{wood_scrap:10,cobble_rock:2});const r=unlockCraftingTable(createWorkbenchState(),invWith({wood_scrap:10,cobble_rock:2}));assert.equal(r.success,true);assert.equal(r.inventoryState.counts.wood_scrap,0);assert.equal(r.inventoryState.counts.cobble_rock,0);});
test("Furnace remains locked pending Cave Biome",()=>assert.equal(createWorkbenchState().unlockedStations.has("furnace"),false));
test("Tool recipes and categories are defined",()=>{assert.deepEqual(Object.keys(RECIPES),["item","tool","artifact"]);assert.deepEqual(RECIPES.tool.map(r=>r.name),["Sharp Stone","Wood Pick","Rock Pick","Emerald Pick","Ice Pick","Sapphire Pick"]);});
test("Sharp Stone consumes two Cobble Rock",()=>{const r=craftRecipe(unlocked(),invWith({cobble_rock:2}),"sharp_stone");assert.equal(r.success,true);assert.equal(r.inventoryState.counts.cobble_rock,0);});
test("Wood Pick consumes Mat but preserves Sharp Stone Req",()=>{const r=craftRecipe(unlocked(),invWith({wood_scrap:10,item_grass:3,sharp_stone:1}),"wood_pick");assert.equal(r.success,true);assert.equal(r.inventoryState.counts.wood_scrap,0);assert.equal(r.inventoryState.counts.item_grass,0);assert.equal(r.inventoryState.counts.sharp_stone,1);});
test("Wood Pick requires Sharp Stone without consuming it",()=>{const r=craftRecipe(unlocked(),invWith({wood_scrap:10,item_grass:3}),"wood_pick");assert.equal(r.reason,"missing-requirements");assert.equal(r.inventoryState.counts.wood_scrap,10);});
test("Rock Pick and Emerald Pick preserve their prerequisite items",()=>{let r=craftRecipe(unlocked(),invWith({wood_scrap:4,cobble_rock:6,item_grass:3,oak_pick:1}),"rock_pick");assert.equal(r.success,true);assert.equal(r.inventoryState.counts.oak_pick,1);r=craftRecipe(unlocked(),invWith({wood_scrap:4,emerald:6,item_grass:5,rock_pick:1}),"emerald_pick");assert.equal(r.success,true);assert.equal(r.inventoryState.counts.rock_pick,1);});
test("Emerald Pick consumes exactly its materials",()=>{const r=craftRecipe(unlocked(),invWith({wood_scrap:4,emerald:6,item_grass:5,rock_pick:1}),"emerald_pick");for(const id of ["wood_scrap","emerald","item_grass"])assert.equal(r.inventoryState.counts[id],0);});
test("Recipes require unlocked table and prevent duplicate unique crafts",()=>{assert.equal(craftRecipe(createWorkbenchState(),invWith({cobble_rock:2}),"sharp_stone").reason,"station-locked");assert.equal(craftRecipe(unlocked(),invWith({cobble_rock:2,sharp_stone:1}),"sharp_stone").reason,"already-owned");});

test("Crafting recipe preview uses one large result image for all four information rows",async()=>{
  const {renderRecipeCard}=await import("../src/workbench-ui.js");
  const recipe={id:"test_recipe",name:"Test Item",image:"./sprites/test-result.png",flavorText:"A sample result.",materials:{wood_scrap:2},requirements:{sharp_stone:1}};
  const html=renderRecipeCard(recipe,[],{can:true,status:"Ready to craft",materials:"<span>Material</span>",requirements:"<span>Requirement</span>"});
  assert.equal((html.match(/class="recipe-result-image"/g)||[]).length,1);
  assert.ok(html.includes('src="./sprites/test-result.png"'));
  assert.ok(html.includes('class="recipe-details"'));
  assert.ok(html.includes("Mat:"));
  assert.ok(html.includes("Req:"));
  assert.ok(html.includes("A sample result."));
  assert.ok(!html.includes("recipe-line-icon"));
});

test("Furnace costs 10 Stone and 1 Coal and consumes both resources",()=>{
 assert.deepEqual(FURNACE_COST,{stone_item:10,coal:1});
 const r=unlockFurnace(createWorkbenchState(),invWith({stone_item:10,coal:1}));
 assert.equal(r.success,true);assert.equal(r.workbenchState.unlockedStations.has("furnace"),true);
 assert.equal(r.inventoryState.counts.stone_item,0);assert.equal(r.inventoryState.counts.coal,0);
});
test("Furnace cannot unlock without the required Cave resources",()=>{
 const r=unlockFurnace(createWorkbenchState(),invWith({stone_item:9,coal:1}));
 assert.equal(r.success,false);assert.equal(r.reason,"missing-materials");
 assert.equal(r.inventoryState.counts.stone_item,9);assert.equal(r.inventoryState.counts.coal,1);
});

test("Ice Pick recipe consumes 12 Ice Shard, 6 Spruce Wood and 12 Grass with no prerequisite",()=>{
 const recipe=RECIPES.tool.find(r=>r.id==="ice_pick");
 assert.deepEqual(recipe.materials,{ice_shard:12,spruce_wood:6,item_grass:12});
 assert.deepEqual(recipe.requirements,{});
 const r=craftRecipe(unlocked(),invWith({ice_shard:12,spruce_wood:6,item_grass:12}),"ice_pick");
 assert.equal(r.success,true);
 for(const id of ["ice_shard","spruce_wood","item_grass"])assert.equal(r.inventoryState.counts[id],0);
 assert.equal(r.inventoryState.counts.ice_pick,1);
 assert.ok(r.workbenchState.craftedRecipes.has("ice_pick"));
});
test("Sapphire Pick requires Ice Pick and consumes 24 Sapphire and 12 Spruce Wood",()=>{
 const recipe=RECIPES.tool.find(r=>r.id==="sapphire_pick");
 assert.deepEqual(recipe.materials,{sapphire:24,spruce_wood:12});
 assert.deepEqual(recipe.requirements,{ice_pick:1});
 const missing=craftRecipe(unlocked(),invWith({sapphire:24,spruce_wood:12}),"sapphire_pick");
 assert.equal(missing.success,false);assert.equal(missing.reason,"missing-requirements");
 const craftedIce=craftRecipe(unlocked(),invWith({ice_shard:12,spruce_wood:6,item_grass:12,sapphire:24}),"ice_pick");
 const r=craftRecipe(craftedIce.workbenchState,{...craftedIce.inventoryState,counts:{...craftedIce.inventoryState.counts,sapphire:24,spruce_wood:12}},"sapphire_pick");
 assert.equal(r.success,true);
 assert.equal(r.inventoryState.counts.sapphire,0);assert.equal(r.inventoryState.counts.spruce_wood,0);
 assert.equal(r.inventoryState.counts.ice_pick,1);
 assert.equal(r.inventoryState.counts.sapphire_pick,1);
});
test("Tool recipe list hides crafted tools immediately and never restores them after dropping",()=>{
 const initial=getUncraftedToolRecipes(unlocked());
 assert.deepEqual(initial.map(r=>r.id),RECIPES.tool.map(r=>r.id));
 const crafted=craftRecipe(unlocked(),invWith({ice_shard:12,spruce_wood:6,item_grass:12}),"ice_pick");
 assert.ok(!getUncraftedToolRecipes(crafted.workbenchState).some(r=>r.id==="ice_pick"));
 assert.ok(getUncraftedToolRecipes(crafted.workbenchState).some(r=>r.id==="sapphire_pick"));
 const dropped={...crafted.inventoryState,counts:{...crafted.inventoryState.counts,ice_pick:0}};
 assert.ok(!getUncraftedToolRecipes(crafted.workbenchState).some(r=>r.id==="ice_pick"));
 assert.equal(craftRecipe(crafted.workbenchState,dropped,"ice_pick").reason,"already-owned");
});

test("Crafting recipes stay hidden until their biome is unlocked",()=>{const wb=unlocked();const plains=getVisibleRecipes("tool",new Set(["plains"]),wb);assert.deepEqual(plains.map(r=>r.id),["sharp_stone","wood_pick","rock_pick","emerald_pick"]);const tundra=getVisibleRecipes("tool",new Set(["plains","tundra"]),wb);assert.deepEqual(tundra.map(r=>r.id),["sharp_stone","wood_pick","rock_pick","emerald_pick","ice_pick","sapphire_pick"]);});
test("Crafted tools remain hidden after their biome becomes available",()=>{const wb=unlocked();wb.craftedRecipes.add("ice_pick");const recipes=getVisibleRecipes("tool",new Set(["plains","tundra"]),wb);assert.ok(!recipes.some(r=>r.id==="ice_pick"));assert.ok(recipes.some(r=>r.id==="sapphire_pick"));});
