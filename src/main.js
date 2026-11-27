import { createInitialState, mineBlock, PLAYER_DAMAGE } from "./game.js";
import { INVENTORY_CATEGORIES, PLAINS_INVENTORY, TUNDRA_INVENTORY, LIQUID_INVENTORY, chunkItems, formatItemCount, getItemDetails } from "./inventory.js";
import { BIOMES, getBiomeAction, getBiomeById } from "./biomes.js";

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
  inventoryClose: document.querySelector("#inventory-close"),
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
  map: document.querySelector("#map-panel"),
  biomeList: document.querySelector("#biome-list"),
  navButtons: [...document.querySelectorAll(".menu-button[data-nav-target]")],
  navPanels: [...document.querySelectorAll(".navigation-panel")],
};

let state = createInitialState(Math.random, "plains");
let activeCategory = "item";
let activePanel = null;
let currentBiomeId = "plains";
const expandedBiomeInfo = new Set();

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
  elements.damage.src = "./sprites/environment/destroy_stage_" + stage + ".png";
  elements.button.setAttribute("aria-label", "Mine " + block.name + ". " + hp + " of " + block.maxHp + " HP remaining.");
  const currentBiome = getBiomeById(currentBiomeId);
  elements.currentBiomeLabel.textContent = (currentBiome?.name || "Unknown").toUpperCase() + " BIOME";
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
        '<button class="inventory-slot" type="button" data-item-id="' + item.id +
        '" data-item-tag="' + sectionName + '" title="' + item.name +
        '" aria-label="View ' + item.name + ' details">' +
        '<img src="' + item.image + '" alt="" loading="lazy">' +
        '<span class="item-count">' + formatItemCount(item.count) + '</span></button>'
      ).join("");
      return '<div class="item-row">' + slots + '</div>';
    }).join("");
    return '<section class="inventory-section"><h3>' + sectionName + '</h3>' +
      (rows || '<p class="empty-inventory">No items yet</p>') + '</section>';
  }).join("");

  const liquidMarkup = activeCategory === "item"
    ? '<section class="inventory-section liquid-inventory"><h3>Liquid</h3><div class="item-row">' +
      LIQUID_INVENTORY.map((item) =>
        '<button class="inventory-slot" type="button" data-item-id="' + item.id +
        '" data-item-tag="Liquid" title="' + item.name + '" aria-label="View ' + item.name + ' details">' +
        '<img src="' + item.image + '" alt="" loading="lazy">' +
        '<span class="item-count">' + formatItemCount(item.count) + '</span></button>'
      ).join("") + '</div></section>'
    : "";

  elements.inventoryContent.innerHTML =
    '<details class="biome-drawer" open><summary><span>Plains</span><span class="drawer-arrow" aria-hidden="true">⌄</span></summary>' +
    '<div class="biome-content">' + renderSections(plainsSections) + '</div></details>' +
    '<details class="biome-drawer" open><summary><span>Tundra</span><span class="drawer-arrow" aria-hidden="true">⌄</span></summary>' +
    '<div class="biome-content">' + renderSections(tundraSections) + '</div></details>' + liquidMarkup;
}

function renderMap() {
  elements.biomeList.innerHTML = BIOMES.map((biome) => {
    const action = getBiomeAction(biome, currentBiomeId);
    const isCurrent = action === "Current";
    const isLocked = action === "Lock" || (!biome.unlocked && action !== "Current");
    const buttonLabel = action === "Visit" ? "Visit" : action === "Current" ? "Current" : action === "Lock" ? "Lock" : action;
    const infoOpen = expandedBiomeInfo.has(biome.id);
    return '<article class="map-biome-row" data-biome-row="' + biome.id + '">' +
      '<div class="map-biome-heading"><h3>' + biome.name + '</h3>' +
      '<div class="map-biome-actions">' +
      '<button class="biome-info-toggle' + (infoOpen ? ' is-open' : '') + '" type="button" data-biome-info="' + biome.id + '" aria-expanded="' + String(infoOpen) + '" aria-label="' + (infoOpen ? 'Hide' : 'Show') + ' ' + biome.name + ' information">!</button>' +
      '<button class="biome-visit-button' + (isCurrent ? ' is-current' : isLocked ? ' is-locked' : '') + '" type="button" data-biome-visit="' + biome.id + '"' + (isCurrent || isLocked ? ' disabled' : '') + '>' + buttonLabel + '</button>' +
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
  elements.detailCount.textContent = String(Math.floor(item.count || 0));
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

  if (activePanel === "inventory") renderInventory();
  if (activePanel === "map") renderMap();
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
  const result = mineBlock(state, PLAYER_DAMAGE, Math.random, currentBiomeId);
  state = result.state;
  elements.helper.textContent = result.broken
    ? result.state.block.name + " appeared. Keep mining!"
    : "-" + PLAYER_DAMAGE + " HP · " + result.state.hp + " HP remaining";
  render();
});

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
elements.inventoryContent.addEventListener("click", (event) => {
  const slot = event.target.closest(".inventory-slot");
  if (slot) openItemDetails(slot.dataset.itemId, slot.dataset.itemTag);
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
    if (biome && getBiomeAction(biome, currentBiomeId) === "Visit") {
      currentBiomeId = biome.id;
      state = createInitialState(Math.random, currentBiomeId);
      elements.helper.textContent = "Entered " + biome.name + ". A new block appeared!";
      render();
      renderMap();
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.detailOverlay.hidden) closeItemDetails();
  else if (event.key === "Escape" && activePanel !== null) closeActivePanel();
});

render();
