export const BASE_DAMAGE=1;const BONUS=Object.freeze({sharp_stone:{baseDamage:1},oak_pick:{blockDamage:1},rock_pick:{blockDamage:1.5},emerald_pick:{blockDamage:1.5}});
export function getPlayerDamageStats(id=null){const b=BONUS[id]||{};return{baseDamage:BASE_DAMAGE+(b.baseDamage||0),blockDamage:b.blockDamage||0,mobDamage:b.mobDamage||0};}
export function getBlockDamage(id,block){const s=getPlayerDamageStats(id);let b=s.blockDamage;if(id==="sharp_stone"&&block?.id==="oak_log")b+=2;if(id==="oak_pick"&&block?.id==="emerald_ore")b-=1;return Math.max(.1,s.baseDamage+b);}
export function getMobDamage(id=null){const s=getPlayerDamageStats(id);return s.baseDamage+s.mobDamage;}
export function formatDamage(n){return Number.isInteger(n)?String(n):String(Number(n.toFixed(2)));}
