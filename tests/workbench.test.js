import test from"node:test";import assert from"node:assert/strict";import{createWorkbenchState,CRAFTING_TABLE_COST,RECIPES,unlockCraftingTable,craftRecipe}from"../src/workbench.js";import{createInventoryState,addInventoryItem}from"../src/inventory-state.js";import{INVENTORY_ITEMS}from"../src/inventory.js";
const unlocked=()=>{const w=createWorkbenchState();w.unlockedStations.add("crafting_table");return w;};const invWith=o=>{let s=createInventoryState(INVENTORY_ITEMS);for(const[k,n]of Object.entries(o))s=addInventoryItem(s,k,n);return s;};
test("Crafting Table costs 10 Wood Scrap and 2 Cobble Rock",()=>{assert.deepEqual(CRAFTING_TABLE_COST,{wood_scrap:10,cobble_rock:2});const r=unlockCraftingTable(createWorkbenchState(),invWith({wood_scrap:10,cobble_rock:2}));assert.equal(r.success,true);assert.equal(r.inventoryState.counts.wood_scrap,0);assert.equal(r.inventoryState.counts.cobble_rock,0);});
test("Furnace remains locked pending Cave Biome",()=>assert.equal(createWorkbenchState().unlockedStations.has("furnace"),false));
test("Tool recipes and categories are defined",()=>{assert.deepEqual(Object.keys(RECIPES),["item","tool","artifact"]);assert.deepEqual(RECIPES.tool.map(r=>r.name),["Sharp Stone","Wood Pick","Rock Pick","Emerald Pick"]);});
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
  expect(html.match(/class="recipe-result-image"/g)).toHaveLength(1);
  expect(html).toContain('src="./sprites/test-result.png"');
  expect(html).toContain('class="recipe-details"');
  expect(html).toContain("Mat:");
  expect(html).toContain("Req:");
  expect(html).toContain("A sample result.");
  expect(html).not.toContain("recipe-line-icon");
});
