export function renderRecipeCard(recipe, inventoryItems, { can, status, materials, requirements }) {
  const readyLabel = can ? "Ready" : status;
  return '<button type="button" class="recipe-card" data-recipe="' + recipe.id + '"' + (can ? '' : ' aria-disabled="true" class="recipe-card recipe-card--unavailable"') + ' aria-label="Craft ' + recipe.name + '. ' + status + '">' +
    '<img class="recipe-result-image" src="' + recipe.image + '" alt="' + recipe.name + '">' +
    '<span class="recipe-details">' +
      '<span class="recipe-line recipe-title-line"><strong>' + recipe.name + '</strong><small>' + readyLabel + '</small></span>' +
      '<span class="recipe-line"><b>Mat:</b><span class="recipe-ingredients">' + materials + '</span></span>' +
      '<span class="recipe-line"><b>Req:</b><span class="recipe-ingredients">' + requirements + '</span></span>' +
      '<span class="recipe-line recipe-flavor"><span>' + recipe.flavorText + '</span></span>' +
    '</span>' +
  '</button>';
}
