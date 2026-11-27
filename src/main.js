import { createInitialState, mineBlock, PLAYER_DAMAGE } from "./game.js";
import { INVENTORY_CATEGORIES, PLAINS_INVENTORY, TUNDRA_INVENTORY, LIQUID_INVENTORY, chunkItems } from "./inventory.js";

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
  inventory: document.querySelector("#inventory-panel"),
  inventoryOpen: document.querySelector("#inventory-open"),
  inventoryClose: document.querySelector("#inventory-close"),
  inventoryContent: document.querySelector("#inventory-content"),
  inventoryTabs: [...document.querySelectorAll(".inventory-tab")],
};

let state = createInitialState();
let activeCategory = "item";

function render() {
  const { block, hp } = state;
  const damageTaken = block.maxHp - hp;
  const stage = Math.min(9, Math.floor((damageTaken / block.maxHp) * 10));

  elements.image.src = block.image;
  elements.image.alt = block.name;
  elements.name.textContent = block.name;
  elements.hp.textContent = String(hp);
  elements.maxHp.textContent = String(block.maxHp);
  elements.fill.style.width = `${(hp / block.maxHp) * 100}%`;
  elements.progress.setAttribute("aria-valuemax", String(block.maxHp));
  elements.progress.setAttribute("aria-valuenow", String(hp));
  elements.damage.src = `./sprites/environment/destroy_stage_${stage}.png`;
  elements.button.setAttribute("aria-label", `Mine ${block.name}. ${hp} of ${block.maxHp} HP remaining.`);
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
    const rows = chunkItems(items, 6).map((row) => `
      <div class="item-row">
        ${row.map((item) => `
          <div class="inventory-slot" title="${item.name}">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
            <span class="item-count">${item.count}</span>
          </div>
        `).join("")}
      </div>
    `).join("");
    return `
      <section class="inventory-section">
        <h3>${sectionName}</h3>
        ${rows || '<p class="empty-inventory">No items yet</p>'}
      </section>
    `;
  }).join("");

  const liquidMarkup = activeCategory === "item" ? `
    <section class="inventory-section liquid-inventory">
      <h3>Liquid</h3>
      <div class="item-row">
        ${LIQUID_INVENTORY.map((item) => `
          <div class="inventory-slot" title="${item.name}">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
            <span class="item-count">${item.count}</span>
          </div>
        `).join("")}
      </div>
    </section>
  ` : "";

  elements.inventoryContent.innerHTML = `
    <details class="biome-drawer" open>
      <summary><span>Plains</span><span class="drawer-arrow" aria-hidden="true">⌄</span></summary>
      <div class="biome-content">${renderSections(plainsSections)}</div>
    </details>
    <details class="biome-drawer" open>
      <summary><span>Tundra</span><span class="drawer-arrow" aria-hidden="true">⌄</span></summary>
      <div class="biome-content">${renderSections(tundraSections)}</div>
    </details>
    ${liquidMarkup}
  `;
}

function setInventoryOpen(isOpen) {
  elements.inventory.hidden = !isOpen;
  elements.inventory.setAttribute("aria-hidden", String(!isOpen));
  elements.inventoryOpen.setAttribute("aria-expanded", String(isOpen));
  elements.inventoryOpen.classList.toggle("is-selected", isOpen);
  if (isOpen) {
    renderInventory();
    elements.inventoryClose.focus();
  } else {
    elements.inventoryOpen.focus();
  }
}

elements.button.addEventListener("click", () => {
  const result = mineBlock(state, PLAYER_DAMAGE);
  state = result.state;
  elements.helper.textContent = result.broken
    ? `${result.state.block.name} appeared. Keep mining!`
    : `-${PLAYER_DAMAGE} HP · ${result.state.hp} HP remaining`;
  render();
});

elements.inventoryOpen.addEventListener("click", () => {
  setInventoryOpen(elements.inventory.hidden);
});
elements.inventoryClose.addEventListener("click", () => setInventoryOpen(false));
elements.inventoryTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeCategory = INVENTORY_CATEGORIES.find((category) => category.id === tab.dataset.category)?.id ?? "item";
    renderInventory();
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.inventory.hidden) setInventoryOpen(false);
});

render();
