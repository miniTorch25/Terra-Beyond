import { createInitialState, mineBlock } from "./game.js?v=20261128-3x-biome-hp";
import { INVENTORY_CATEGORIES, PLAINS_INVENTORY, TUNDRA_INVENTORY, CAVE_INVENTORY, LIQUID_INVENTORY, INVENTORY_ITEMS, chunkItems, formatItemCount, getItemDetails } from "./inventory.js";
import { createInventoryState, getInventoryCount, addInventoryItem, takeInventoryItem, returnInventoryItem, expireInventoryItem, mergeDetachedItems, isInventoryDropTarget } from "./inventory-state.js";
import { BIOMES, getBiomeAction, getBiomeById } from "./biomes.js";
import { STARTING_IC, DUPLICATE_COST, duplicateItem } from "./economy.js";
import { getPlayerDamageStats, getBlockDamage, formatDamage, getNonZeroDamageStats } from "./damage.js";
import { createWorkbenchState, CRAFTING_TABLE_COST, FURNACE_COST, RECIPES, getUncraftedToolRecipes, unlockCraftingTable, unlockFurnace, craftRecipe } from "./workbench.js";
import { renderRecipeCard } from "./workbench-ui.js";
import { createEquipmentState, equipItem, getEquippedItem, getEquipmentSlot, isEquippableItem } from "./equipment.js";
import { renderEquipmentSlots, renderAbilityLog } from "./equipment-ui.js";
import { pushToast, removeToast, TOAST_DURATION, getCraftFailureAdvice } from "./toast-state.js";

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
  worldItems: document.querySelector("#world-items"),
  inventoryContent: document.querySelector("#inventory-content"),
  inventoryTabs: [...document.querySelectorAll(".inventory-tab")],
  detailOverlay: document.querySelector("#item-detail-overlay"),
  detailCard: document.querySelector("#item-detail-card"),
  detailImage: document.querySelector("#detail-item-image"),
  detailName: document.querySelector("#detail-item-name"),
  detailDescription: document.querySelector("#detail-item-description"),
  detailAbilities: document.querySelector("#detail-item-abilities"),
  detailDamage: document.querySelector("#detail-item-damage"), detailDamageList: document.querySelector("#detail-item-damage-list"),
  detailOrigin: document.querySelector("#item-detail-origin"),
  detailTag: document.querySelector("#detail-item-tag"),
  detailCount: document.querySelector("#detail-item-count"),
  detailDuplicate: document.querySelector("#detail-duplicate-button"),
  detailEquip: document.querySelector("#detail-equip-button"), playerEquipment: document.querySelector("#player-equipment"), abilityLog: document.querySelector("#ability-log"),
  playerBaseDamage: document.querySelector("#player-base-damage"), playerBlockDamage: document.querySelector("#player-block-damage"), playerMobDamage: document.querySelector("#player-mob-damage"),
  currencyCount: document.querySelector("#ic-balance"),
  toastNotifications: document.querySelector("#toast-notifications"),
  toastDropLog: document.querySelector("#toast-drop-log"),
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
  baseDamage:document.querySelector("#base-damage"),blockDamage:document.querySelector("#block-damage"),mobDamage:document.querySelector("#mob-damage"),workbenchStations:document.querySelector("#workbench-stations"),craftingTableStatus:document.querySelector("#crafting-table-status"),craftingTableCost:document.querySelector("#crafting-table-cost"),furnaceStatus:document.querySelector("#furnace-status"),furnaceCost:document.querySelector("#furnace-cost"),workbenchCrafting:document.querySelector("#workbench-crafting"),workbenchRecipes:document.querySelector("#workbench-recipes"),workbenchTabs:[...document.querySelectorAll(".workbench-tab")],equippedToolLabel:document.querySelector("#equipped-tool-label"),
};

let state = createInitialState(Math.random, "plains");
let activeCategory = "item";
let activePanels = new Set();
let currentBiomeId = "plains";
const expandedBiomeInfo = new Set();
const unlockedBiomeIds = new Set(BIOMES.filter((biome) => biome.unlocked).map((biome) => biome.id));
const inventoryItems = INVENTORY_ITEMS;
let inventoryState = createInventoryState(inventoryItems);
let catalystBalance = STARTING_IC;
let toastSequence = 0;
const toastQueues = { notice: [], drops: [] };
const toastTimers = new Map();
let pendingDuplicateItemId = null;
let workbenchState=createWorkbenchState();
let activeCraftCategory="item";
let equipmentState=createEquipmentState();
let equippedToolId=null;
const PANEL_LAYOUT_KEY = "terra-beyond-panel-layouts";
const defaultPanelLayout = { inventory: { half: localStorage.getItem("terra-beyond-inventory-half-screen") === "true", position: "bottom" }, craft: { half: false, position: "bottom" }, gear: { half: false, position: "bottom" }, more: { half: false, position: "bottom" } };
let panelLayouts = (() => { try { return { ...defaultPanelLayout, ...JSON.parse(localStorage.getItem(PANEL_LAYOUT_KEY) || "{}") }; } catch { return defaultPanelLayout; } })();
let activeWorldDrag = null;
let equipmentDrag = null;
let suppressEquipClickItemId = null;

function renderToastQueue(queueName) {
  const container = queueName === "notice" ? elements.toastNotifications : elements.toastDropLog;
  container.replaceChildren();
  for (const toast of toastQueues[queueName]) {
    const node = document.createElement("div");
    if (queueName === "notice") {
      node.className = "toast-notice toast-notice--" + toast.type;
      node.setAttribute("role", "status");
      node.textContent = toast.message;
    } else {
      node.className = "toast-drop-entry";
      node.setAttribute("role", "status");
      const amount = document.createElement("span");
      amount.className = "toast-drop-amount";
      amount.textContent = "+" + toast.amount;
      const image = document.createElement("img");
      image.src = toast.image;
      image.alt = toast.name;
      image.title = toast.name;
      node.append(amount, image);
    }
    container.append(node);
  }
}
function enqueueToast(queueName, toast) {
  const id = ++toastSequence;
  const previous = toastQueues[queueName];
  const next = pushToast(previous, { ...toast, id });
  const retained = new Set(next.map(entry => entry.id));
  for (const old of previous) {
    if (!retained.has(old.id)) {
      clearTimeout(toastTimers.get(queueName + ":" + old.id));
      toastTimers.delete(queueName + ":" + old.id);
    }
  }
  toastQueues[queueName] = next;
  renderToastQueue(queueName);
  const timerKey = queueName + ":" + id;
  toastTimers.set(timerKey, window.setTimeout(() => {
    toastQueues[queueName] = removeToast(toastQueues[queueName], id);
    toastTimers.delete(timerKey);
    renderToastQueue(queueName);
  }, TOAST_DURATION));
}
function showToast(type, message) {
  enqueueToast("notice", { type: type === "danger" ? "danger" : "warning", message: String(message) });
}
function showDropLog(drop) {
  const item = inventoryItems.find(entry => entry.id === drop.itemId);
  if (!item || !Number.isInteger(drop.amount) || drop.amount <= 0) return;
  enqueueToast("drops", { amount: drop.amount, image: item.image, name: item.name });
}

function renderCurrency() {
  elements.currencyCount.textContent = formatItemCount(catalystBalance);
  elements.currencyCount.title = catalystBalance.toLocaleString("en-US") + " Infinity Catalyst";
}

function applyPanelLayout(panelName) {
  const panel = document.querySelector('[data-nav-panel="' + panelName + '"]');
  const layout = panelLayouts[panelName];
  if (!panel || !layout || panelName === "map") return;
  panel.classList.toggle("is-half", Boolean(layout.half));
  panel.classList.toggle("is-top", layout.half && layout.position === "top");
  panel.classList.toggle("is-bottom", layout.half && layout.position !== "top");
  panel.querySelectorAll("[data-ui-half]").forEach(button => {
    button.setAttribute("aria-pressed", String(Boolean(layout.half)));
    button.setAttribute("aria-label", layout.half ? "Expand panel" : "Split panel to half screen");
    button.textContent = layout.half ? "⤢" : "↕";
  });
  panel.querySelectorAll("[data-ui-position]").forEach(button => {
    button.disabled = !layout.half;
    button.setAttribute("aria-label", layout.position === "top" ? "Move panel to bottom half" : "Move panel to top half");
    button.textContent = layout.position === "top" ? "↓" : "↑";
  });
}
function savePanelLayouts() { localStorage.setItem(PANEL_LAYOUT_KEY, JSON.stringify(panelLayouts)); }
function applyAllPanelLayouts() { ["inventory", "craft", "gear", "more"].forEach(applyPanelLayout); }
function setPanelHalf(panelName) {
  const layout = panelLayouts[panelName];
  if (!layout) return;
  layout.half = !layout.half;
  savePanelLayouts();
  applyPanelLayout(panelName);
}
function swapPanelHalf(panelName) {
  const layout = panelLayouts[panelName];
  if (!layout) return;
  layout.half = true;
  layout.position = layout.position === "top" ? "bottom" : "top";
  savePanelLayouts();
  applyPanelLayout(panelName);
}

function updateWorldItemBadges(node, entry) {
  const timer = node.querySelector(".world-item-timer");
  const stack = node.querySelector(".world-item-stack");
  if (timer) timer.textContent = Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000)) + "s";
  if (stack) { stack.textContent = "x" + entry.stackCount; stack.hidden = entry.stackCount <= 1; }
  else if (entry.stackCount > 1) {
    const badge = document.createElement("span"); badge.className = "world-item-stack"; badge.textContent = "x" + entry.stackCount; node.append(badge);
  }
  node.setAttribute("aria-label", entry.stackCount + " " + (inventoryItems.find(item => item.id === entry.itemId)?.name || entry.itemId) + ", expires in " + Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000)) + " seconds");
}
function renderWorldItem(entry, x, y) {
  const data = inventoryItems.find((item) => item.id === entry.itemId);
  if (!data) return null;
  const node = document.createElement("button");
  node.type = "button"; node.className = "world-item"; node.dataset.worldItemId = String(entry.instanceId);
  const image = document.createElement("img"); image.src = data.image; image.alt = data.name; node.append(image);
  const timer = document.createElement("span"); timer.className = "world-item-timer"; node.append(timer);
  if ((entry.stackCount ?? 1) > 1) { const stack = document.createElement("span"); stack.className = "world-item-stack"; node.append(stack); }
  node.style.left = x + "px"; node.style.top = y + "px";
  updateWorldItemBadges(node, {...entry, stackCount:entry.stackCount??1});
  node.addEventListener("pointerdown", (event) => {
    event.preventDefault(); activeWorldDrag = { instanceId: entry.instanceId, node, pointerId: event.pointerId }; node.classList.add("is-dragging");
  });
  elements.worldItems.append(node); return node;
}
function updateWorldItemTimers() {
  const now = Date.now();
  for (const entry of [...inventoryState.detached]) {
    if (entry.expiresAt <= now) inventoryState = expireInventoryItem(inventoryState, entry.instanceId, now);
    const current = inventoryState.detached.find(item => item.instanceId === entry.instanceId);
    const node = elements.worldItems.querySelector('[data-world-item-id="' + entry.instanceId + '"]');
    if (!current) node?.remove();
    else if (node) updateWorldItemBadges(node, current);
  }
}
window.setInterval(updateWorldItemTimers, 250);

function renderInventoryCounts() {
  elements.inventoryContent.querySelectorAll(".inventory-slot").forEach((slot) => {
    const count = getInventoryCount(inventoryState, slot.dataset.itemId);
    const counter = slot.querySelector(".item-count");
    if (counter) counter.textContent = formatItemCount(count);
    const dropButton = slot.querySelector(".inventory-item-button");
    if (dropButton) dropButton.disabled = count < 1;
    const equippedSlots = equipmentState[getEquipmentSlot(inventoryItems.find(item=>item.id===slot.dataset.itemId))] || [];
    const equipped = equippedSlots.includes(slot.dataset.itemId);
    slot.classList.toggle("is-equipped", equipped);
    let marker = slot.querySelector(".equipped-marker");
    if (equipped && !marker) { marker=document.createElement("span"); marker.className="equipped-marker"; marker.textContent="E"; slot.append(marker); }
    if (!equipped) marker?.remove();
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
  if (!result.detachedItem) {
    showToast("warning", "The ground is full. Pick up dropped items before dropping more.");
    return;
  }
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
  document.body.dataset.biome = currentBiomeId;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = currentBiomeId === "tundra" ? "#172b3a" : currentBiomeId === "cave" ? "#292929" : "#18251f";
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
  if (activePanels.has("craft")) renderWorkbench();
}

function renderInventory() {
  const plainsSections = PLAINS_INVENTORY[activeCategory];
  const tundraSections = TUNDRA_INVENTORY[activeCategory];
  const caveSections = CAVE_INVENTORY[activeCategory];
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
        '<div class="inventory-slot' + ((equipmentState[getEquipmentSlot(item)] || []).includes(item.id) ? ' is-equipped' : '') + '" data-item-id="' + item.id + '">' +
        '<button class="inventory-item-button" type="button" data-item-id="' + item.id +
        '" aria-label="Drop ' + item.name + '" title="Click to drop ' + item.name + '"' +
        (getInventoryCount(inventoryState, item.id) < 1 ? ' disabled' : '') + '>' +
        '<img src="' + item.image + '" alt="" loading="lazy"></button>' +
        ((equipmentState[getEquipmentSlot(item)] || []).includes(item.id) ? '<span class="equipped-marker" aria-label="Equipped">E</span>' : '') +
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
    '<div class="biome-content">' + renderSections(tundraSections) + '</div></details>' +
    '<details class="biome-drawer" open><summary><span>Cave</span><span class="drawer-arrow" aria-hidden="true">⌄</span></summary>' +
    '<div class="biome-content">' + renderSections(caveSections) + '</div></details>' + liquidMarkup;
}

function renderDamageStats(){equippedToolId=equipmentState.tool[0];const s=getPlayerDamageStats(equippedToolId);elements.baseDamage.textContent=formatDamage(s.baseDamage);elements.blockDamage.textContent=formatDamage(s.blockDamage);elements.mobDamage.textContent=formatDamage(s.mobDamage);elements.playerBaseDamage.textContent=formatDamage(s.baseDamage);elements.playerBlockDamage.textContent=formatDamage(s.blockDamage);elements.playerMobDamage.textContent=formatDamage(s.mobDamage);}
function renderWorkbench(){
const unlocked=workbenchState.unlockedStations.has("crafting_table"),wood=getInventoryCount(inventoryState,"wood_scrap"),rock=getInventoryCount(inventoryState,"cobble_rock");
elements.craftingTableStatus.textContent=unlocked?"Unlocked":"Locked";elements.craftingTableCost.textContent=unlocked?"Ready to use":"10 Wood Scrap ("+wood+") · 2 Cobble Rock ("+rock+")";
const station=elements.workbenchStations.querySelector('[data-station="crafting_table"]');station.classList.toggle("is-unlocked",unlocked);station.classList.toggle("can-unlock",!unlocked&&wood>=10&&rock>=2);elements.workbenchCrafting.hidden=!unlocked;
const furnaceUnlocked=workbenchState.unlockedStations.has("furnace"),stone=getInventoryCount(inventoryState,"stone_item"),coal=getInventoryCount(inventoryState,"coal"),canUnlockFurnace=currentBiomeId==="cave"&&stone>=FURNACE_COST.stone_item&&coal>=FURNACE_COST.coal;
elements.furnaceStatus.textContent=furnaceUnlocked?"Unlocked":"Locked";
elements.furnaceCost.textContent=furnaceUnlocked?"Ready to use":currentBiomeId!=="cave"?"Requires Cave Biome":"10 Stone ("+stone+") · 1 Coal ("+coal+")";
const furnace=elements.workbenchStations.querySelector('[data-station="furnace"]');furnace.disabled=furnaceUnlocked||!canUnlockFurnace;furnace.classList.toggle("is-unlocked",furnaceUnlocked);furnace.classList.toggle("can-unlock",!furnaceUnlocked&&canUnlockFurnace);
const equippedTool=getEquippedItem(equipmentState.tool[0],inventoryItems),equippedSword=getEquippedItem(equipmentState.sword[0],inventoryItems);elements.equippedToolLabel.textContent="Tool: "+(equippedTool?.name||"None")+" · Sword: "+(equippedSword?.name||"None");
elements.workbenchTabs.forEach(t=>{const active=t.dataset.craftCategory===activeCraftCategory;t.classList.toggle("is-active",active);t.setAttribute("aria-selected",String(active));});if(!unlocked)return;
const recipes=activeCraftCategory==="tool"?getUncraftedToolRecipes(workbenchState):(RECIPES[activeCraftCategory]||[]);if(!recipes.length){elements.workbenchRecipes.innerHTML='<p class="workbench-empty">'+(activeCraftCategory==="tool"?"All tools have been crafted.":"No craftable items in this category yet.")+'</p>';return;}
const icon=(id,n)=>{const item=inventoryItems.find(x=>x.id===id);return '<span class="recipe-ingredient" title="'+(item?.name||id)+' ×'+n+'"><img src="'+(item?.image||"")+'" alt="'+(item?.name||id)+'"><small>×'+n+'</small></span>';};
elements.workbenchRecipes.innerHTML=recipes.map(recipe=>{
const owned=getInventoryCount(inventoryState,recipe.itemId),hasMaterials=Object.entries(recipe.materials).every(([id,n])=>getInventoryCount(inventoryState,id)>=n),hasRequirements=Object.entries(recipe.requirements).every(([id,n])=>getInventoryCount(inventoryState,id)>=n),can=hasMaterials&&hasRequirements&&(!recipe.unique||owned<1);
const materials=Object.entries(recipe.materials).map(([id,n])=>icon(id,n)).join("")||'<span class="recipe-none">None</span>';const requirements=Object.entries(recipe.requirements).map(([id,n])=>icon(id,n)).join("")||'<span class="recipe-none">None</span>';
const status=owned?"Already crafted":!hasRequirements?"Missing requirements":!hasMaterials?"Missing materials":"Ready to craft";
return renderRecipeCard(recipe,inventoryItems,{can,status,materials,requirements});
}).join("");
}
function handleWorkbenchStation(id){
if(id==="furnace"){
  if(workbenchState.unlockedStations.has("furnace"))return;
  if(currentBiomeId!=="cave"){elements.helper.textContent="Enter the Cave biome to unlock the Furnace.";showToast("warning","Enter the Cave biome to unlock the Furnace.");return;}
  const r=unlockFurnace(workbenchState,inventoryState);
  if(!r.success){elements.helper.textContent="Need 10 Stone and 1 Coal to unlock the Furnace.";showToast("warning","Not enough materials to unlock the Furnace.");return;}
  workbenchState=r.workbenchState;inventoryState=r.inventoryState;renderWorkbench();renderInventoryCounts();if(!elements.inventory.hidden)renderInventory();elements.helper.textContent="Furnace unlocked.";return;
}
if(id!=="crafting_table"||workbenchState.unlockedStations.has(id))return;
const r=unlockCraftingTable(workbenchState,inventoryState);if(!r.success){elements.helper.textContent="Need 10 Wood Scrap and 2 Cobble Rock to unlock the Crafting Table.";showToast("warning","Not enough materials to unlock the Crafting Table.");return;}workbenchState=r.workbenchState;inventoryState=r.inventoryState;renderWorkbench();renderInventoryCounts();elements.helper.textContent="Crafting Table unlocked.";
}
function handleCraftRecipe(id){const r=craftRecipe(workbenchState,inventoryState,id);if(!r.success){elements.helper.textContent="Cannot craft this recipe: "+r.reason+".";showToast("warning",getCraftFailureAdvice(r.reason));return;}workbenchState=r.workbenchState;inventoryState=r.inventoryState;renderWorkbench();renderInventoryCounts();if(!elements.inventory.hidden)renderInventory();elements.helper.textContent="Crafted "+r.item.name+". It is now in your Inventory."; }
function handleEquipItem(id, slotIndex = 0) {
  const result = equipItem(equipmentState, id, inventoryState, inventoryItems, slotIndex);
  if (!result.success) {
    elements.helper.textContent = result.reason === "not-owned" ? "You must own this item before equipping it." : result.reason === "locked-slot" ? "This equipment slot is locked." : result.reason === "already-equipped" ? "This item is already equipped in another slot." : "This item cannot be equipped.";
    showToast("danger", elements.helper.textContent);
    return;
  }
  equipmentState = result.equipmentState;
  const item = getEquippedItem(id, inventoryItems);
  renderDamageStats(); renderWorkbench(); renderInventoryCounts();
  if (!elements.inventory.hidden) renderInventory();
  renderGear();
  if (!elements.detailOverlay.hidden) updateDetailEquipButton(id);
  elements.helper.textContent = equipmentState[result.slot][slotIndex] ? "Equipped " + item.name + " in " + result.slot + " slot " + (slotIndex + 1) + "." : "Unequipped " + item.name + ".";
}
function updateDetailEquipButton(id) {
  const item = inventoryItems.find(x => x.id === id), slot = getEquipmentSlot(item), available = Boolean(slot);
  elements.detailEquip.hidden = !available;
  elements.detailEquip.disabled = !available || getInventoryCount(inventoryState, id) < 1;
  elements.detailEquip.dataset.itemId = id;
  elements.detailEquip.textContent = slot ? ((equipmentState[slot] || []).includes(id) ? "Unequip" : "Equip") + " " + slot[0].toUpperCase() + slot.slice(1) : "Equip";
}
function renderGear() {
  elements.playerEquipment.innerHTML = renderEquipmentSlots(equipmentState, inventoryItems);
  elements.abilityLog.innerHTML = renderAbilityLog(equipmentState, inventoryItems);
  elements.playerEquipment.querySelectorAll("[data-unequip-slot]").forEach(button => {
    button.addEventListener("click", () => handleEquipItem(
      equipmentState[button.dataset.unequipSlot][Number(button.dataset.slotIndex)],
      Number(button.dataset.slotIndex)
    ));
  });
}

function renderMap() {
  elements.biomeList.innerHTML = BIOMES.map((biome) => {
    const unlocked = unlockedBiomeIds.has(biome.id);
    const action = getBiomeAction({ ...biome, unlocked }, currentBiomeId);
    const isCurrent = action === "Current";
    const cost = biome.unlockCost && typeof biome.unlockCost === "object" ? biome.unlockCost : null;
    const canAfford = cost ? getInventoryCount(inventoryState, cost.itemId) >= cost.amount : false;
    const isLocked = action === "Lock" || (!unlocked && !cost && action !== "Current");
    const buttonLabel = action === "Visit" ? "Visit" : action === "Current" ? "Current" : action === "Lock" ? "Lock" : action;
    const costItem = cost ? inventoryItems.find((item) => item.id === cost.itemId) : null;
    const buttonContent = !unlocked && cost ? `Unlock <img class="biome-cost-icon" src="${costItem?.image || ""}" alt="${costItem?.name || ""}"> <strong>${cost.amount}</strong>` : buttonLabel;
    const infoOpen = expandedBiomeInfo.has(biome.id);
    return '<article class="map-biome-row" data-biome-row="' + biome.id + '">' +
      '<div class="map-biome-heading"><h3>' + biome.name + '</h3>' +
      '<div class="map-biome-actions">' +
      '<button class="biome-info-toggle' + (infoOpen ? ' is-open' : '') + '" type="button" data-biome-info="' + biome.id + '" aria-expanded="' + String(infoOpen) + '" aria-label="' + (infoOpen ? 'Hide' : 'Show') + ' ' + biome.name + ' information">!</button>' +
      '<button class="biome-visit-button' + (isCurrent ? ' is-current' : isLocked ? ' is-locked' : '') + '" type="button" data-biome-visit="' + biome.id + '"' + (isCurrent || isLocked ? ' disabled' : '') + '>' + buttonContent + '</button>' +
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
  elements.detailAbilities.textContent = (item.abilities || []).join(" · ");
  elements.detailAbilities.closest(".detail-abilities").hidden = !(item.abilities || []).length;
  const damageStats = ["tool", "sword"].includes(item.category) ? getNonZeroDamageStats(item.id) : [];
  elements.detailDamage.hidden = damageStats.length === 0;
  elements.detailDamageList.innerHTML = damageStats.map(({ label, value }) => "<li><span>" + label + "</span><strong>" + formatDamage(value) + "</strong></li>").join("");
  elements.detailTag.textContent = item.tag;
  elements.detailCount.textContent = String(getInventoryCount(inventoryState, item.id));
  elements.detailCount.closest(".detail-row").hidden = Boolean(item.unique);
  elements.detailDuplicate.dataset.itemId = item.id;
  elements.detailDuplicate.hidden = ["tool", "sword", "artifact"].includes(item.category);
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
  if (!item || ["tool", "sword", "artifact"].includes(item.category)) return;
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
  if (owned < 1) showToast("warning", "You need at least 1 item before duplicating it.");
  else if (catalystBalance < DUPLICATE_COST) showToast("warning", "Not enough Infinity Catalyst.");
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
  const wasOpen = activePanels.has(panelName);
  if (panelName === "map") {
    if (wasOpen) activePanels.clear();
    else { activePanels.clear(); activePanels.add("map"); }
    expandedBiomeInfo.clear();
  } else if (wasOpen) {
    activePanels.delete(panelName);
  } else if ((panelName === "inventory" && activePanels.has("gear")) || (panelName === "gear" && activePanels.has("inventory"))) {
    activePanels.add(panelName);
    for (const name of ["inventory", "gear"]) { panelLayouts[name].half = true; panelLayouts[name].position = name === "inventory" ? "top" : "bottom"; }
    savePanelLayouts();
  } else {
    activePanels.clear();
    activePanels.add(panelName);
  }
  if (!activePanels.has("inventory")) closeItemDetails();
  elements.navPanels.forEach(panel => {
    const isOpen = activePanels.has(panel.dataset.navPanel);
    panel.hidden = !isOpen;
    panel.setAttribute("aria-hidden", String(!isOpen));
  });
  elements.navButtons.forEach(button => {
    const isOpen = activePanels.has(button.dataset.navTarget);
    button.classList.toggle("is-selected", isOpen);
    button.setAttribute("aria-expanded", String(isOpen));
  });
  applyAllPanelLayouts();
  if (activePanels.has("inventory")) renderInventory();
  if (activePanels.has("map")) renderMap();
  if (activePanels.has("gear")) renderGear();
  if (activePanels.has("craft")) renderWorkbench();
}

function closeActivePanel() {
  if (activePanels.has("map")) expandedBiomeInfo.clear();
  closeItemDetails();
  activePanels.clear();
  elements.navPanels.forEach(panel => { panel.hidden = true; panel.setAttribute("aria-hidden", "true"); });
  elements.navButtons.forEach(button => { button.classList.remove("is-selected"); button.setAttribute("aria-expanded", "false"); });
}

elements.button.addEventListener("click", () => {
  const damage=getBlockDamage(equippedToolId,state.block);
  const result=mineBlock(state,damage,Math.random,currentBiomeId,equippedToolId);
  state = result.state;
  for (const drop of result.drops) {
    inventoryState = addInventoryItem(inventoryState, drop.itemId, drop.amount);
    if (result.broken) showDropLog(drop);
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
    if (suppressEquipClickItemId === item?.id) { suppressEquipClickItemId = null; return; }
    if(isEquippableItem(item)){handleEquipItem(item.id);return;}
    ejectInventoryItem(itemButton.dataset.itemId, itemButton.closest(".inventory-slot"));
  }
});
document.addEventListener("click", event => {
  const halfButton = event.target.closest("[data-ui-half]");
  const positionButton = event.target.closest("[data-ui-position]");
  if (halfButton) setPanelHalf(halfButton.dataset.uiHalf);
  if (positionButton) swapPanelHalf(positionButton.dataset.uiPosition);
});
function finishEquipmentDrag(event, cancelled = false) {
  if (!equipmentDrag || (event && equipmentDrag.pointerId !== event.pointerId)) return;
  const drag = equipmentDrag;
  equipmentDrag = null;
  drag.ghost.remove();
  if (cancelled || !event) return;
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-equipment-slot]");
  const item = inventoryItems.find(entry => entry.id === drag.itemId);
  if (target && !target.classList.contains("is-locked") && target.dataset.equipmentSlot === getEquipmentSlot(item)) {
    handleEquipItem(drag.itemId, Number(target.dataset.slotIndex));
    suppressEquipClickItemId = drag.itemId;
  }
}

function finishWorldDrag(event, cancelled = false) {
  if (!activeWorldDrag || (event && activeWorldDrag.pointerId !== event.pointerId)) return;
  const drag = activeWorldDrag; activeWorldDrag = null; drag.node.classList.remove("is-dragging");
  if (cancelled || !event) return;
  drag.node.style.pointerEvents = "none";
  const dropTarget = document.elementFromPoint(event.clientX, event.clientY);
  const inventorySlot = dropTarget?.closest?.(".inventory-slot");
  const inventoryButton = dropTarget?.closest?.("#inventory-open");
  const worldTarget = dropTarget?.closest?.(".world-item");
  drag.node.style.pointerEvents = "auto";
  if (worldTarget && worldTarget !== drag.node) {
    const targetId = Number(worldTarget.dataset.worldItemId);
    const merged = mergeDetachedItems(inventoryState, targetId, drag.instanceId);
    if (merged.mergedItem) {
      inventoryState = merged.state; drag.node.remove();
      updateWorldItemBadges(worldTarget, merged.mergedItem);
      return;
    }
  }
  if (isInventoryDropTarget({overSlot:Boolean(inventorySlot),inventoryOpen:!elements.inventory.hidden,overInventoryButton:Boolean(inventoryButton)})) {
    returnWorldItem(drag.instanceId, drag.node);
  }
}

elements.inventoryContent.addEventListener("pointerdown", event => {
  if (!activePanels.has("inventory") || !activePanels.has("gear") || equipmentDrag) return;
  const button = event.target.closest(".inventory-item-button");
  if (!button || button.disabled) return;
  const item = inventoryItems.find(entry => entry.id === button.dataset.itemId);
  if (!isEquippableItem(item)) return;
  event.preventDefault();
  if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
  const ghost = document.createElement("div");
  ghost.className = "equipment-drag-ghost";
  ghost.innerHTML = '<img src="' + item.image + '" alt="">';
  ghost.style.left = event.clientX + "px";
  ghost.style.top = event.clientY + "px";
  document.body.append(ghost);
  equipmentDrag = { itemId: item.id, pointerId: event.pointerId, ghost };
});
document.addEventListener("pointermove", event => {
  if (equipmentDrag && equipmentDrag.pointerId === event.pointerId) {
    equipmentDrag.ghost.style.left = event.clientX + "px";
    equipmentDrag.ghost.style.top = event.clientY + "px";
  }
  if (activeWorldDrag && activeWorldDrag.pointerId === event.pointerId) {
    activeWorldDrag.node.style.left = event.clientX + "px";
    activeWorldDrag.node.style.top = event.clientY + "px";
  }
});
document.addEventListener("pointerup", event => {
  finishEquipmentDrag(event);
  finishWorldDrag(event);
});
document.addEventListener("pointercancel", event => {
  finishEquipmentDrag(event, true);
  finishWorldDrag(event, true);
});
window.addEventListener("blur", () => {
  finishEquipmentDrag(null, true);
  finishWorldDrag(null, true);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    finishEquipmentDrag(null, true);
    finishWorldDrag(null, true);
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
      const owned = getInventoryCount(inventoryState, itemId);
      if (owned >= amount) {
        inventoryState = { ...inventoryState, counts: { ...inventoryState.counts, [itemId]: owned - amount } };
        unlockedBiomeIds.add(biome.id);
        renderInventoryCounts();
        renderMap();
      } else {
        const itemName = inventoryItems.find(item => item.id === itemId)?.name || itemId;
        showToast("danger", "Not enough " + itemName + " to unlock " + biome.name + ". Need " + amount + ".");
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
  else if (event.key === "Escape" && activePanels.size > 0) closeActivePanel();
});

applyAllPanelLayouts();
renderCurrency();
render();