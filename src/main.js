import { createInitialState, mineBlock, PLAYER_DAMAGE } from "./game.js";

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
};

let state = createInitialState();

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

elements.button.addEventListener("click", () => {
  const result = mineBlock(state, PLAYER_DAMAGE);
  state = result.state;
  elements.helper.textContent = result.broken
    ? `${result.state.block.name} appeared. Keep mining!`
    : `-${PLAYER_DAMAGE} HP · ${result.state.hp} HP remaining`;
  render();
});

render();
