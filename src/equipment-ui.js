const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function renderSlot(type, index, equipmentState, inventoryItems) {
  const locked = (type === "tool" || type === "sword") && index > 0;
  const itemId = equipmentState[type]?.[index] ?? null;
  const item = itemId ? inventoryItems.find(entry => entry.id === itemId) : null;
  const label = type[0].toUpperCase() + type.slice(1);
  const classes = ["equipment-slot-card", "equipment-" + type];
  if (locked) classes.push("is-locked");
  const ariaLabel = locked ? label + " " + (index + 1) + " locked" : item ? "Unequip " + label + " " + (index + 1) + ": " + item.name : "Empty " + label + " " + (index + 1) + " slot";
  const content = locked ? "Locked" : item ? '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '">' : "";
  return '<button type="button" class="' + classes.join(" ") + '" data-equipment-slot="' + type + '" data-slot-index="' + index + '"' +
    (locked ? " disabled" : "") +
    (item ? ' data-unequip-slot="' + type + '"' : "") +
    ' aria-label="' + escapeHtml(ariaLabel) + '" title="' + escapeHtml(ariaLabel) + '">' + content + "</button>";
}

export function renderEquipmentSlots(equipmentState, inventoryItems) {
  const primary = ["tool", "sword"].map(type => Array.from({ length: 3 }, (_, index) =>
    renderSlot(type, index, equipmentState, inventoryItems)
  ).join("")).join("");
  const artifacts = Array.from({ length: 6 }, (_, index) =>
    renderSlot("artifact", index, equipmentState, inventoryItems)
  ).join("");
  return '<section class="equipment-group equipment-group-primary">' +
    '<div class="equipment-primary-headings"><h4>Tool</h4><h4>Sword</h4></div>' +
    '<div class="equipment-slot-grid equipment-primary-grid">' + primary + '</div></section>' +
    '<section class="equipment-group equipment-group-artifact"><h4>Artifact</h4>' +
    '<div class="equipment-slot-grid equipment-artifact-grid">' + artifacts + '</div></section>';
}

export function getEquippedAbilities(equipmentState, inventoryItems) {
  return ["tool", "sword", "artifact"].flatMap(type =>
    (equipmentState[type] || []).flatMap(id => {
      if (!id) return [];
      const item = inventoryItems.find(entry => entry.id === id);
      return (item?.abilities || []).map(ability => typeof ability === "string" ? ability : ability?.description || ability?.name || "").filter(Boolean);
    })
  );
}

export function renderAbilityLog(equipmentState, inventoryItems) {
  const abilities = getEquippedAbilities(equipmentState, inventoryItems);
  if (!abilities.length) return "<li>No special abilities.</li>";
  return abilities.map(ability => "<li>" + escapeHtml(ability) + "</li>").join("");
}
