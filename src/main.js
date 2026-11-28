import { createInitialState, mineBlock } from "./game.js";
import { INVENTORY_CATEGORIES, PLAINS_INVENTORY, TUNDRA_INVENTORY, LIQUID_INVENTORY, INVENTORY_ITEMS, chunkItems, formatItemCount, getItemDetails } from "./inventory.js";
import { createInventoryState, getInventoryCount, addInventoryItem, takeInventoryItem, returnInventoryItem, expireInventoryItem, isInventoryDropTarget } from "./inventory-state.js";
import { BIOMES, getBiomeAction, getBiomeById } from "./biomes.js";
import { STARTING_IC, DUPLICATE_COST, duplicateItem } from "./economy.js";
import { getPlayerDamageStats, getBlockDamage, formatDamage } from "./damage.js";
import { createWorkbenchState, CRAFTING_TABLE_COST, RECIPES, unlockCraftingTable, craftRecipe } from "./workbench.js";
import { equipItem, getEquippedItem, isEquippableItem } from "./equipment.js";

const elements = {
  button: document.querySelector("#mine-button"),
  image: document.querySelector("#block-image"),
  damage: document.querySelector("#damage-image"),
  name: document.querySelector("#block-name"),
  hp: document.querySelector("#hp-current"),
  maxHp: document.querySelector("#hp-max"),
  fill: document.querySelector("#hp-fill"),
  progress: document.querySelector("#hp-progress"),
  helper: document.querySelector("#helper-text"),
  currentBiomeLabel: document.querySelector("#current-biome-label"),
  inventory: document.querySelector("#inventory-panel"),
  inventoryButton: document.querySelector("#inventory-open"),
  inventoryClose: document.querySelector("#inventory-close"),
  inventoryCollapse: document.querySelector("#inventory-collapse"),
  worldItems: document.querySelector("#world-items"),
  inventoryContent: document.querySelector("#inventory-content"),
  inventoryTabs: [...document.querySelectorAll(".inventory-tab")],
  detailOverlay: document.querySelector("#item-detail-overlay"),
  detailCard: document.querySelector("#item-detail-card"),
  detailImage: document.querySelector("#detail-item-image"),
  detailName: document.querySelector("#detail-item-name"),
  detailDescription: document.querySelector("#detail-item-description"),
  detailOrigin: document.querySelector("#item-detail-origin"),
  detailTag: document.querySelector("#detail-item-tag"),
  detailCount: document.querySelector("#detail-item-count"),
  detailDuplicate: document.querySelector("#detail-duplicate-button"),
  detailEquip: document.querySelector("#detail-equip-button"), playerEquipment: document.querySelector("#player-equipment"),
  playerBaseDamage: document.querySelector("#player-base-damage"), playerBlockDamage: document.querySelector("#player-block-damage"), playerMobDamage: document.querySelector("#player-mob-damage"),
  currencyCount: document.querySelector("#ic-balance"),
  duplicateOverlay: document.querySelector("#duplicate-confirm-overlay"),
  duplicateImage: document.querySelector("#duplicate-item-image"),
  duplicateName: document.querySelector("#duplicate-item-name"),
  duplicateMessage: document.querySelector("#duplicate-message"),
  duplicateConfirm: document.querySelector("#duplicate-confirm-button"),
  duplicateCancel: document.querySelector("#duplicate-cancel-button"),
  map: document.querySelector("#map-panel"),
  biomeList: document.querySelector("#biome-list"),
  navButtons: [...document.querySelectorAll(".menu-button[data-nav-target]")],
  navPanels: [...document.querySelectorAll(".navigation-panel")],
  baseDamage:document.querySelector("#base-damage"),blockDamage:document.querySelector("#block-damage"),mobDamage:document.querySelector("#mob-damage"),workbenchStations:document.querySelector("#workbench-stations"),craftingTableStatus:document.querySelector("#crafting-table-status"),craftingTableCost:document.querySelector("#crafting-table-cost"),workbenchCrafting:document.querySelector("#workbench-crafting"),workbenchRecipes:document.querySelector("#workbench-recipes"),workbenchTabs:[...document.querySelectorAll(".workbench-tab")],equippedToolLabel:document.querySelector("#equipped-tool-label"),
};

let state = createInitialState(Math.random, "plains");
let activeCategory = "item";
let activePanel = null;
let currentBiomeId = "plains";
const expandedBiomeInfo = new Set();
const unlockedBiomeIds = new Set(BIOMES.filter((biome) => biome.unlocked).map((biome) => biome.id));
const inventoryItems = INVENTORY_ITEMS;
let inventoryState = createInventoryState(inventoryItems);
let catalystBalance = STARTING_IC;
let pendingDuplicateItemId = null;
let workbenchState=createWorkbenchState();
let activeCraftCategory="item";
let equippedItemId=null;
let equippedToolId=null;
const INVENTORY_COMPACT_KEY = "terra-beyond-inventory-half-screen";
let inventoryCompact = localStorage.getItem(INVENTORY_COMPACT_KEY) === "true";
let activeWorldDrag = null;

function renderCurrency() {
  elements.currencyCount.textContent = formatItemCount(catalystBalance);
  elements.currencyCount.title = catalystBalance.toLocaleString("en-US") + " Infinity Catalyst";
}

function applyInventorySize() {
  elements.inventory.classList.toggle("is-half", inventoryCompact);
  elements.inventoryCollapse.setAttribute("aria-pressed", String(inventoryCompact));
  elements.inventoryCollapse.setAttribute("aria-label", inventoryCompact ? "Expand inventory" : "Shrink inventory to half screen");
  elements.inventoryCollapse.textContent = inventoryCompact ? "⌃" : "⌄";
}

function renderWorldItem(entry, x, y) {
  const data = inventoryItems.find((item) => item.id === entry.itemId);
  if (!data) return null;
  const node = document.createElement("button");
  node.type = "button";
  node.className = "world-item";
  node.dataset.worldItemId = String(entry.instanceId);
  node.setAttribute("aria-label", "Move " + data.name + " or drag it back into Inventory");
  const image = document.createElement("img");
  image.src = data.image;
  image.alt = data.name;
  node.append(image);
  node.style.left = x + "px";
  node.style.top = y + "px";
  node.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    activeWorldDrag = { instanceId: entry.instanceId, node, pointerId: event.pointerId };
    node.classList.add("is-dragging");
  });
  elements.worldItems.append(node);
  const remaining = Math.max(0, entry.expiresAt - Date.now());
  window.setTimeout(() => {
    inventoryState = expireInventoryItem(inventoryState, entry.instanceId);
    node.remove();
  }, remaining);
  return node;
}

function renderInventoryCounts() {
  elements.inventoryContent.querySelectorAll(".inventory-slot").forEach((slot) => {
    const count = getInventoryCount(inventoryState, slot.dataset.itemId);
    const counter = slot.querySelector(".item-count");
    if (counter) counter.textContent = formatItemCount(count);
    const dropButton = slot.querySelector(".inventory-item-button");
    if (dropButton) dropButton.disabled = count < 1;
    slot.classList.toggle("is-equipped", slot.dataset.itemId === equippedItemId);
    let marker = slot.querySelector(".equipped-marker");
    if (slot.dataset.itemId === equippedItemId && !marker) { marker=document.createElement("span"); marker.className="equipped-marker"; marker.textContent="E"; slot.append(marker); }
    if (slot.dataset.itemId !== equippedItemId) marker?.remove();
  });
}

function returnWorldItem(instanceId, node) {
  inventoryState = returnInventoryItem(inventoryState, instanceId);
  node?.remove();
  renderInventoryCounts();
  if (!elements.inventory.hidden) renderInventory();
}

function ejectInventoryItem(itemId, slot) {
  const result = takeInventoryItem(inventoryState, itemId);
  if (!result.detachedItem) return;
  inventoryState = result.state;

  const rect = slot.getBoundingClientRect();
  const angle = Math.random() * Math.PI * 2;
  const distance = 80 + Math.random() * 90;
  const margin = 30;
  const x = Math.min(window.innerWidth - margin, Math.max(margin,
    rect.left + rect.width / 2 + Math.cos(angle) * distance));
  const y = Math.min(window.innerHeight - 100, Math.max(70,
    rect.top + rect.height / 2 + Math.sin(angle) * distance));

  renderWorldItem(result.detachedItem, x, y);
  renderInventoryCounts();
}

function render() {
  const { block, hp } = state;
  const damageTaken = block.maxHp - hp;
  const stage = Math.min(9, Math.floor((damageTaken / block.maxHp) * 10));
  elements.image.src = block.image;
  elements.image.alt = block.name;
  elements.name.textContent = block.name;
  elements.hp.textContent = String(hp);
  elements.maxHp.textContent = String(block.maxHp);
  elements.fill.style.width = String((hp / block.maxHp) * 100) + "%";
  elements.progress.setAttribute("aria-valuemax", String(block.maxHp));
  elements.progress.setAttribute("aria-valuenow", String(hp));
  elements.damage.hidden = hp === block.maxHp;
  if (!elements.damage.hidden) {
    elements.damage.src = "./sprites/environment/destroy_stage_" + stage + ".png";
  }
  elements.button.setAttribute("aria-label", "Mine " + block.name + ". " + hp + " of " + block.maxHp + " HP remaining.");
  const currentBiome = getBiomeById(currentBiomeId);
  elements.currentBiomeLabel.textContent = (currentBiome?.name || "Unknown").toUpperCase() + " BIOME";
  renderDamageStats();
}

function renderInventory() {
  const plainsSections = PLAINS_INVENTORY[activeCategory];
  const tundraSections = TUNDRA_INVENTORY[activeCategory];
  elements.inventoryTabs.forEach((tab) => {
    const selected = tab.dataset.category === activeCategory;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
    const check = tab.querySelector(".tab-check");
    if (check) check.remove();
    if (selected) {
      const marker = document.createElement("span");
      marker.className = "tab-check";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = "✓";
      tab.append(marker);
    }
  });

  const renderSections = (sections) => Object.entries(sections).map(([sectionName, items]) => {
    const rows = chunkItems(items, 6).map((row) => {
      const slots = row.map((item) =>
        '<div class="inventory-slot' + (item.id === equippedItemId ? ' is-equipped' : '') + '" data-item-id="' + item.id + '">' +
        '<button class="inventory-item-button" type="button" data-item-id="' + item.id +
        '" aria-label="Drop ' + item.name + '" title="Click to drop ' + item.name + '"' +
        (getInventoryCount(inventoryState, item.id) < 1 ? ' disabled' : '') + '>' +
        '<img src="' + item.image + '" alt="" loading="lazy"></button>' +
        (item.id === equippedItemId ? '<span class="equipped-marker" aria-label="Equipped">E</span>' : '') +
        '<button class="item-info-button" type="button" data-item-info="' + item.id +
        '" data-item-tag="' + sectionName + '" aria-label="View ' + item.name + ' details" title="Item information">?</button>' +
        (item.unique ? '' : '<span class="item-count">' + formatItemCount(getInventoryCount(inventoryState, item.id)) + '</span>') + '</div>'
      ).join("");
      return '<div class="item-row">' + slots + '</div>';
    }).join("");
    return '<section class="inventory-section"><h3>' + sectionName + '</h3>' +
      (rows || '<p class="empty-inventory">No items yet</p>') + '</section>';
  }).join("");

  const liquidMarkup = activeCategory === "item"
    ? '<section class="inventory-section liquid-inventory"><h3>Liquid</h3><div class="item-row">' +
      LIQUID_INVENTORY.map((item) =>
        '<div class="inventory-slot" data-item-id="' + item.id + '">' +
        '<button class="inventory-item-button" type="button" data-item-id="' + item.id +
        '" aria-label="Drop ' + item.name + '" title="Click to drop ' + item.name + '"' +
        (getInventoryCount(inventoryState, item.id) < 1 ? ' disabled' : '') + '>' +
        '<img src="' + item.image + '" alt="" loading="lazy"></button>' +
        '<button class="item-info-button" type="button" data-item-info="' + item.id +
        '" data-item-tag="Liquid" aria-label="View ' + item.name + ' details" title="Item information">?</button>' +
        '<span class="item-count">' + formatItemCount(getInventoryCount(inventoryState, item.id)) + '</span></div>'
      ).join("") + '</div></section>'
    : "";

  elements.inventoryContent.innerHTML =
    '<details class="biome-drawer" open><summary><span>Plains</span><span class="drawer-arrow" aria-hidden="true">⌄</span></summary>' +
    '<div class="biome-content">' + renderSections(plainsSections) + '</div></details>' +
    '<details class="biome-drawer" open><summary><span>Tundra</span><span class="drawer-arrow" aria-hidden="true">⌄</span></summary>' +
    '<div class="biome-content">' + renderSections(tundraSections) + '</div></details>' + liquidMarkup;
}

function renderDamageStats(){const s=getPlayerDamageStats(equippedToolId);elements.baseDamage.textContent=formatDamage(s.baseDamage);elements.blockDamage.textContent=formatDamage(s.blockDamage);elements.mobDamage.textContent=formatDamage(s.mobDamage);elements.playerBaseDamage.textContent=formatDamage(s.baseDamage);elements.playerBlockDamage.textContent=formatDamage(s.blockDamage);elements.playerMobDamage.textContent=formatDamage(s.mobDamage);}
function renderWorkbench(){
const unlocked=workbenchState.unlockedStations.has("crafting_table"),wood=getInventoryCount(inventoryState,"wood_scrap"),rock=getInventoryCount(inventoryState,"cobble_rock");
elements.craftingTableStatus.textContent=unlocked?"Unlocked":"Locked";elements.craftingTableCost.textContent=unlocked?"Ready to use":"10 Wood Scrap ("+wood+") · 2 Cobble Rock ("+rock+")";
const station=elements.workbenchStations.querySelector('[data-station="crafting_table"]');station.classList.toggle("is-unlocked",unlocked);station.classList.toggle("can-unlock",!unlocked&&wood>=10&&rock>=2);elements.workbenchCrafting.hidden=!unlocked;
const equipped=getEquippedItem(equippedItemId,inventoryItems);elements.equippedToolLabel.textContent=equipped?"Equipped: "+equipped.name:"No equipment equipped";
elements.workbenchTabs.forEach(t=>{const active=t.dataset.craftCategory===activeCraftCategory;t.classList.toggle("is-active",active);t.setAttribute("aria-selected",String(active));});if(!unlocked)return;
const recipes=RECIPES[activeCraftCategory]||[];if(!recipes.length){elements.workbenchRecipes.innerHTML='<p class="workbench-empty">No craftable items in this category yet.</p>';return;}
const icon=(id,n)=>{const item=inventoryItems.find(x=>x.id===id);return '<span class="recipe-ingredient" title="'+(item?.name||id)+' ×'+n+'"><img src="'+(item?.image||"")+'" alt="'+(item?.name||id)+'"><small>×'+n+'</small></span>';};
elements.workbenchRecipes.innerHTML=recipes.map(recipe=>{
const owned=getInventoryCount(inventoryState,recipe.itemId),hasMaterials=Object.entries(recipe.materials).every(([id,n])=>getInventoryCount(inventoryState,id)>=n),hasRequirements=Object.entries(recipe.requirements).every(([id,n])=>getInventoryCount(inventoryState,id)>=n),can=hasMaterials&&hasRequirements&&(!recipe.unique||owned<1);
const materials=Object.entries(recipe.materials).map(([id,n])=>icon(id,n)).join("")||'<span class="recipe-none">None</span>';const requirements=Object.entries(recipe.requirements).map(([id,n])=>icon(id,n)).join("")||'<span class="recipe-none">None</span>';
const status=owned?"Already crafted":!hasRequirements?"Missing requirements":!hasMaterials?"Missing materials":"Ready to craft";
return '<button type="button" class="recipe-card" data-recipe="'+recipe.id+'"'+(can?'':' disabled')+' aria-label="Craft '+recipe.name+'. '+status+'"><span class="recipe-line recipe-title-line"><img class="recipe-line-icon" src="'+recipe.image+'" alt=""><strong>'+recipe.name+'</strong><small>'+(can?"Ready":status)+'</small></span><span class="recipe-line"><b>Mat:</b><span class="recipe-ingredients">'+materials+'</span></span><span class="recipe-line"><b>Req:</b><span class="recipe-ingredients">'+requirements+'</span></span><span class="recipe-line recipe-flavor"><img class="recipe-line-icon" src="'+recipe.image+'" alt=""><span>'+recipe.flavorText+'</span></span></button>';
}).join("");
}
function handleWorkbenchStation(id){if(id!=="crafting_table"||workbenchState.unlockedStations.has(id))return;const r=unlockCraftingTable(workbenchState,inventoryState);if(!r.success){elements.helper.textContent="Need 10 Wood Scrap and 2 Cobble Rock to unlock the Crafting Table.";return;}workbenchState=r.workbenchState;inventoryState=r.inventoryState;renderWorkbench();renderInventoryCounts();elements.helper.textContent="Crafting Table unlocked.";}
function handleCraftRecipe(id){const r=craftRecipe(workbenchState,inventoryState,id);if(!r.success){elements.helper.textContent="Cannot craft this recipe: "+r.reason+".";return;}workbenchState=r.workbenchState;inventoryState=r.inventoryState;renderWorkbench();renderInventoryCounts();if(!elements.inventory.hidden)renderInventory();elements.helper.textContent="Crafted "+r.item.name+". It is now in your Inventory."; }
function handleEquipItem(id){const result=equipItem(equippedItemId,id,inventoryState,inventoryItems);if(!result.success){elements.helper.textContent=result.reason==="not-owned"?"You must own this item before equipping it.":"This item cannot be equipped.";return;}equippedItemId=result.equippedItemId;const item=getEquippedItem(equippedItemId,inventoryItems);equippedToolId=item?.category==="tool"?item.id:null;renderDamageStats();renderInventoryCounts();if(!elements.inventory.hidden)renderInventory();renderGear();if(!elements.detailOverlay.hidden)updateDetailEquipButton(id);elements.helper.textContent=item?"Equipped "+item.name+".":"Equipment removed."; }
function updateDetailEquipButton(id){const item=inventoryItems.find(x=>x.id===id),available=isEquippableItem(item);elements.detailEquip.hidden=!available;elements.detailEquip.disabled=!available||getInventoryCount(inventoryState,id)<1;elements.detailEquip.dataset.itemId=id;elements.detailEquip.textContent=equippedItemId===id?"Unequip":"Equip";}
function renderGear(){const item=getEquippedItem(equippedItemId,inventoryItems);elements.playerEquipment.innerHTML=item?'<div class="player-equipped-card"><img src="'+item.image+'" alt=""><div><strong>'+item.name+'</strong><span>Equipped</span></div><button type="button" id="unequip-player-item">Unequip</button></div>':'<p class="player-no-equipment">No equipment equipped yet.</p>';const button=elements.playerEquipment.querySelector("#unequip-player-item");if(button)button.addEventListener("click",()=>handleEquipItem(equippedItemId));}

function renderMap() {
  elements.biomeList.innerHTML = BIOMES.map((biome) => {
    const unlocked = unlockedBiomeIds.has(biome.id);
    const action = getBiomeAction({ ...biome, unlocked }, currentBiomeId);
    const isCurrent = action === "Current";
    const cost = biome.unlockCost && typeof biome.unlockCost === "object" ? biome.unlockCost : null;
    const canAfford = cost ? getInventoryCount(inventoryState, cost.itemId) >= cost.amount : false;
    const isLocked = action === "Lock" || (!unlocked && !cost && action !== "Current");
    const buttonLabel = action === "Visit" ? "Visit" : action === "Current" ? "Current" : action === "Lock" ? "Lock" : action;
    const buttonContent = !unlocked && cost ? `Unlock <img class="biome-cost-icon" src="./sprites/item/plains/emerald.png" alt="Emerald"> <strong>${cost.amount}</strong>` : buttonLabel;
    const infoOpen = expandedBiomeInfo.has(biome.id);
    return '<article class="map-biome-row" data-biome-row="' + biome.id + '">' +
      '<div class="map-biome-heading"><h3>' + biome.name + '</h3>' +
      '<div class="map-biome-actions">' +
      '<button class="biome-info-toggle' + (infoOpen ? ' is-open' : '') + '" type="button" data-biome-info="' + biome.id + '" aria-expanded="' + String(infoOpen) + '" aria-label="' + (infoOpen ? 'Hide' : 'Show') + ' ' + biome.name + ' information">!</button>' +
      '<button class="biome-visit-button' + (isCurrent ? ' is-current' : isLocked ? ' is-locked' : '') + '" type="button" data-biome-visit="' + biome.id + '"' + (isCurrent || isLocked || (!unlocked && cost && !canAfford) ? ' disabled' : '') + '>' + buttonContent + '</button>' +
      '</div></div>' +
      '<div class="map-biome-info"' + (infoOpen ? '' : ' hidden') + '><p>' + biome.description + '</p></div>' +
      '</article>';
  }).join("");
}

function openItemDetails(id, fallbackTag) {
  const item = getItemDetails(id, fallbackTag);
  if (!item) return;
  elements.detailImage.src = item.image;
  elements.detailImage.alt = item.name;
  elements.detailName.textContent = item.name;
  elements.detailDescription.textContent = item.description;
  elements.detailTag.textContent = item.tag;
  elements.detailCount.textContent = String(getInventoryCount(inventoryState, item.id));
  elements.detailCount.closest(".detail-row").hidden = Boolean(item.unique);
  elements.detailDuplicate.dataset.itemId = item.id;
  updateDetailEquipButton(item.id);
  if (item.tag === "Natural" && item.origin) {
    elements.detailOrigin.hidden = false;
    elements.detailOrigin.querySelector("img").src = item.origin.image;
    elements.detailOrigin.querySelector("img").alt = item.origin.name;
    elements.detailOrigin.querySelector(".origin-name").textContent = item.origin.name;
  } else {
    elements.detailOrigin.hidden = true;
  }
  elements.detailOverlay.hidden = false;
  elements.detailOverlay.setAttribute("aria-hidden", "false");
  elements.detailCard.focus();
}

function openDuplicateConfirmation(itemId) {
  const item = inventoryItems.find((entry) => entry.id === itemId);
  if (!item) return;
  pendingDuplicateItemId = itemId;
  elements.duplicateImage.src = item.image;
  elements.duplicateImage.alt = item.name;
  elements.duplicateName.textContent = item.name;
  const owned = getInventoryCount(inventoryState, itemId);
  const canDuplicate = owned >= 1 && catalystBalance >= DUPLICATE_COST;
  elements.duplicateMessage.textContent = owned < 1
    ? "You must own at least 1 copy of this item before duplicating it."
    : catalystBalance < DUPLICATE_COST
      ? "Not enough Infinity Catalyst."
      : "Spend 1 IC to receive 500 additional " + item.name + "?";
  elements.duplicateConfirm.disabled = !canDuplicate;
  elements.duplicateOverlay.hidden = false;
  elements.duplicateOverlay.setAttribute("aria-hidden", "false");
  elements.duplicateConfirm.focus();
}

function closeDuplicateConfirmation() {
  elements.duplicateOverlay.hidden = true;
  elements.duplicateOverlay.setAttribute("aria-hidden", "true");
  pendingDuplicateItemId = null;
}

function confirmDuplicate() {
  if (!pendingDuplicateItemId) return;
  const result = duplicateItem(catalystBalance, inventoryState, pendingDuplicateItemId);
  if (!result.success) {
    elements.duplicateMessage.textContent = result.reason === "missing-prototype"
      ? "You must own at least 1 copy of this item before duplicating it."
      : "Not enough Infinity Catalyst.";
    elements.duplicateConfirm.disabled = true;
    return;
  }
  const duplicatedItemId = pendingDuplicateItemId;
  catalystBalance = result.balance;
  inventoryState = result.inventoryState;
  renderCurrency();
  renderInventoryCounts();
  if (!elements.inventory.hidden) renderInventory();
  elements.detailCount.textContent = String(getInventoryCount(inventoryState, duplicatedItemId));
  elements.detailCount.closest(".detail-row").hidden = false;
  closeDuplicateConfirmation();
  elements.helper.textContent = "Duplicated " + inventoryItems.find((item) => item.id === duplicatedItemId)?.name + " ×500.";
}

function closeItemDetails() {
  elements.detailOverlay.hidden = true;
  elements.detailOverlay.setAttribute("aria-hidden", "true");
}

function setActivePanel(panelName) {
  const nextPanel = activePanel === panelName ? null : panelName;
  if (activePanel === "map" && nextPanel !== "map") expandedBiomeInfo.clear();
  if (activePanel === "inventory" && nextPanel !== "inventory") closeItemDetails();
  if (nextPanel !== "inventory") closeItemDetails();
  activePanel = nextPanel;

  elements.navPanels.forEach((panel) => {
    const isOpen = panel.dataset.navPanel === activePanel;
    panel.hidden = !isOpen;
    panel.setAttribute("aria-hidden", String(!isOpen));
  });
  elements.navButtons.forEach((button) => {
    const isOpen = button.dataset.navTarget === activePanel;
    button.classList.toggle("is-selected", isOpen);
    button.setAttribute("aria-expanded", String(isOpen));
  });

  if (activePanel === "inventory") { applyInventorySize(); renderInventory(); }
  if (activePanel === "map") renderMap();
  if (activePanel === "gear") renderGear();
  if (activePanel === "craft") renderWorkbench();
}

function closeActivePanel() {
  if (activePanel === "map") expandedBiomeInfo.clear();
  closeItemDetails();
  activePanel = null;
  elements.navPanels.forEach((panel) => {
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
  });
  elements.navButtons.forEach((button) => {
    button.classList.remove("is-selected");
    button.setAttribute("aria-expanded", "false");
  });
}

elements.button.addEventListener("click", () => {
  const damage=getBlockDamage(equippedToolId,state.block);
  const result=mineBlock(state,damage,Math.random,currentBiomeId,equippedToolId);
  state = result.state;
  for (const drop of result.drops) {
    inventoryState = addInventoryItem(inventoryState, drop.itemId, drop.amount);
  }
  if (result.drops.length > 0) renderInventoryCounts();
  const dropMessage = result.drops.map((drop) => {
    const item = inventoryItems.find((entry) => entry.id === drop.itemId);
    return (item?.name || drop.itemId) + " +" + drop.amount;
  }).join(", ");
  elements.helper.textContent = result.broken
    ? (dropMessage ? dropMessage + " · " : "") + result.state.block.name + " appeared. Keep mining!"
    : "-" + formatDamage(damage) + " HP · " + formatDamage(result.state.hp) + " HP remaining";
  render();
});

elements.workbenchStations.addEventListener("click",e=>{const b=e.target.closest("[data-station]");if(b&&!b.disabled)handleWorkbenchStation(b.dataset.station);});elements.workbenchTabs.forEach(t=>t.addEventListener("click",()=>{activeCraftCategory=t.dataset.craftCategory;renderWorkbench();}));elements.workbenchRecipes.addEventListener("click",e=>{const b=e.target.closest("[data-recipe]");if(b&&!b.disabled)handleCraftRecipe(b.dataset.recipe);});
elements.navButtons.forEach((button) => {
  button.addEventListener("click", () => setActivePanel(button.dataset.navTarget));
});
elements.inventoryClose.addEventListener("click", closeActivePanel);
elements.inventoryTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeCategory = INVENTORY_CATEGORIES.find((category) => category.id === tab.dataset.category)?.id ?? "item";
    renderInventory();
  });
});
elements.detailDuplicate.addEventListener("click", () => openDuplicateConfirmation(elements.detailDuplicate.dataset.itemId));
elements.detailEquip.addEventListener("click",()=>handleEquipItem(elements.detailEquip.dataset.itemId));
elements.duplicateConfirm.addEventListener("click", confirmDuplicate);
elements.duplicateCancel.addEventListener("click", closeDuplicateConfirmation);
elements.duplicateOverlay.addEventListener("click", (event) => {
  if (event.target === elements.duplicateOverlay) closeDuplicateConfirmation();
});
elements.inventoryContent.addEventListener("click", (event) => {
  const infoButton = event.target.closest(".item-info-button");
  if (infoButton) {
    openItemDetails(infoButton.dataset.itemInfo, infoButton.dataset.itemTag);
    return;
  }
  const itemButton = event.target.closest(".inventory-item-button");
  if (itemButton && !itemButton.disabled) {
    const item = inventoryItems.find(entry=>entry.id===itemButton.dataset.itemId);
    if(isEquippableItem(item)){handleEquipItem(item.id);return;}
    ejectInventoryItem(itemButton.dataset.itemId, itemButton.closest(".inventory-slot"));
  }
});
elements.inventoryCollapse.addEventListener("click", () => {
  inventoryCompact = !inventoryCompact;
  localStorage.setItem(INVENTORY_COMPACT_KEY, String(inventoryCompact));
  applyInventorySize();
});
document.addEventListener("pointermove", (event) => {
  if (activeWorldDrag && activeWorldDrag.pointerId === event.pointerId) {
    activeWorldDrag.node.style.left = event.clientX + "px";
    activeWorldDrag.node.style.top = event.clientY + "px";
  }
});
document.addEventListener("pointerup", (event) => {
  if (activeWorldDrag && activeWorldDrag.pointerId === event.pointerId) {
    const drag = activeWorldDrag;
    drag.node.classList.remove("is-dragging");
    drag.node.style.pointerEvents = "none";
    const dropTarget = document.elementFromPoint(event.clientX, event.clientY);
    const inventorySlot = dropTarget?.closest?.(".inventory-slot");
    const inventoryButton = dropTarget?.closest?.("#inventory-open");
    drag.node.style.pointerEvents = "auto";
    if (isInventoryDropTarget({
      overSlot: Boolean(inventorySlot),
      inventoryOpen: !elements.inventory.hidden,
      overInventoryButton: Boolean(inventoryButton),
    })) returnWorldItem(drag.instanceId, drag.node);
    activeWorldDrag = null;
  }
});
elements.detailOverlay.addEventListener("click", (event) => {
  if (event.target === elements.detailOverlay) closeItemDetails();
});
elements.detailCard.addEventListener("click", (event) => event.stopPropagation());

elements.biomeList.addEventListener("click", (event) => {
  const infoButton = event.target.closest("[data-biome-info]");
  if (infoButton) {
    const biomeId = infoButton.dataset.biomeInfo;
    if (expandedBiomeInfo.has(biomeId)) expandedBiomeInfo.delete(biomeId);
    else expandedBiomeInfo.add(biomeId);
    renderMap();
    elements.biomeList.querySelector('[data-biome-info="' + biomeId + '"]')?.focus();
    return;
  }
  const visitButton = event.target.closest("[data-biome-visit]");
  if (visitButton) {
    const biome = getBiomeById(visitButton.dataset.biomeVisit);
    if (biome && !unlockedBiomeIds.has(biome.id) && biome.unlockCost && typeof biome.unlockCost === "object") {
      const { itemId, amount } = biome.unlockCost;
      if (getInventoryCount(inventoryState, itemId) >= amount) {
        inventoryState = { ...inventoryState, counts: { ...inventoryState.counts, [itemId]: getInventoryCount(inventoryState, itemId) - amount } };
        unlockedBiomeIds.add(biome.id);
        renderInventoryCounts();
        renderMap();
      }
      return;
    }
    if (biome && getBiomeAction({ ...biome, unlocked: unlockedBiomeIds.has(biome.id) }, currentBiomeId) === "Visit") {
      currentBiomeId = biome.id;
      state = createInitialState(Math.random, currentBiomeId);
      elements.helper.textContent = "Entered " + biome.name + ". A new block appeared!";
      render();
      renderMap();
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.duplicateOverlay.hidden) closeDuplicateConfirmation();
  else if (event.key === "Escape" && !elements.detailOverlay.hidden) closeItemDetails();
  else if (event.key === "Escape" && activePanel !== null) closeActivePanel();
});

renderCurrency();
render();
