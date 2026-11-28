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
export function takeInventoryItem(state,itemId,now=Date.now(),maxDetached=10,lifetime=90000){
 if(state.detached.length>=maxDetached||getInventoryCount(state,itemId)<1)return {state,detachedItem:null};
 const detachedItem={instanceId:state.nextId,itemId,expiresAt:now+lifetime};
 return {state:{...state,counts:{...state.counts,[itemId]:getInventoryCount(state,itemId)-1},detached:[...state.detached,detachedItem],nextId:state.nextId+1},detachedItem};
}
export function returnInventoryItem(state,instanceId){
 const detachedItem=state.detached.find(entry=>entry.instanceId===instanceId);if(!detachedItem)return state;
 const current=getInventoryCount(state,detachedItem.itemId),next=state.uniqueIds?.includes(detachedItem.itemId)?Math.min(1,current+1):current+1;
 return {...state,counts:{...state.counts,[detachedItem.itemId]:next},detached:state.detached.filter(entry=>entry.instanceId!==instanceId)};
}
export function expireInventoryItem(state,instanceId,now=Date.now()){
 const entry=state.detached.find(item=>item.instanceId===instanceId);if(!entry||entry.expiresAt>now)return state;
 return {...state,detached:state.detached.filter(item=>item.instanceId!==instanceId)};
}
