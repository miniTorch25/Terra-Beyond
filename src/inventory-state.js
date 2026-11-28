export const WORLD_ITEM_LIMIT = 32;
export const WORLD_ITEM_LIFETIME = 90000;

export function createInventoryState(items=[]) {
 const counts={},uniqueIds=[]; for(const item of items){counts[item.id]=item.count??0;if(item.unique)uniqueIds.push(item.id);}
 return {counts,uniqueIds,detached:[],nextId:1};
}
export function getInventoryCount(state,itemId){return Math.max(0,Math.floor(state.counts[itemId]??0));}
export function addInventoryItem(state,itemId,amount=1){
 if(!Object.hasOwn(state.counts,itemId))throw new RangeError(`Unknown inventory item: ${itemId}`);
 if(!Number.isInteger(amount)||amount<=0)throw new RangeError("Item amount must be a positive integer.");
 const current=getInventoryCount(state,itemId),next=state.uniqueIds?.includes(itemId)?Math.min(1,current+amount):current+amount;
 return {...state,counts:{...state.counts,[itemId]:next}};
}
export function isInventoryDropTarget({overSlot=false,inventoryOpen=false,overInventoryButton=false}={}){return Boolean(overInventoryButton||(overSlot&&inventoryOpen));}
export function takeInventoryItem(state,itemId,now=Date.now(),maxDetached=WORLD_ITEM_LIMIT,lifetime=WORLD_ITEM_LIFETIME){
 if(state.detached.length>=maxDetached||getInventoryCount(state,itemId)<1)return {state,detachedItem:null};
 const detachedItem={instanceId:state.nextId,itemId,stackCount:1,expiresAt:now+lifetime};
 return {state:{...state,counts:{...state.counts,[itemId]:getInventoryCount(state,itemId)-1},detached:[...state.detached,detachedItem],nextId:state.nextId+1},detachedItem};
}
export function mergeDetachedItems(state,targetInstanceId,sourceInstanceId,now=Date.now(),lifetime=WORLD_ITEM_LIFETIME){
 if(targetInstanceId===sourceInstanceId)return {state,mergedItem:null};
 const target=state.detached.find(entry=>entry.instanceId===targetInstanceId);
 const source=state.detached.find(entry=>entry.instanceId===sourceInstanceId);
 if(!target||!source||target.itemId!==source.itemId)return {state,mergedItem:null};
 const mergedItem={...target,stackCount:(target.stackCount??1)+(source.stackCount??1),expiresAt:now+lifetime};
 return {state:{...state,detached:state.detached.filter(entry=>entry.instanceId!==sourceInstanceId).map(entry=>entry.instanceId===targetInstanceId?mergedItem:entry)},mergedItem};
}
export function returnInventoryItem(state,instanceId){
 const detachedItem=state.detached.find(entry=>entry.instanceId===instanceId);if(!detachedItem)return state;
 const amount=detachedItem.stackCount??1,current=getInventoryCount(state,detachedItem.itemId),next=state.uniqueIds?.includes(detachedItem.itemId)?Math.min(1,current+amount):current+amount;
 return {...state,counts:{...state.counts,[detachedItem.itemId]:next},detached:state.detached.filter(entry=>entry.instanceId!==instanceId)};
}
export function expireInventoryItem(state,instanceId,now=Date.now(),lifetime=WORLD_ITEM_LIFETIME){
 const entry=state.detached.find(item=>item.instanceId===instanceId);if(!entry||entry.expiresAt>now)return state;
 const remaining=(entry.stackCount??1)-1;
 if(remaining<=0)return {...state,detached:state.detached.filter(item=>item.instanceId!==instanceId)};
 return {...state,detached:state.detached.map(item=>item.instanceId===instanceId?{...item,stackCount:remaining,expiresAt:now+lifetime}:item)};
}
