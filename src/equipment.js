export function createEquipmentState(){return{tool:null,sword:null};}
export function getEquipmentSlot(item){return item?.category==="tool"?"tool":item?.category==="sword"?"sword":null;}
export function isEquippableItem(item){return getEquipmentSlot(item)!==null;}
export function equipItem(equipmentState,itemId,inventoryState,inventoryItems){
 const item=inventoryItems.find(entry=>entry.id===itemId),slot=getEquipmentSlot(item);
 if(!slot)return{success:false,reason:"not-equippable",equipmentState};
 if((inventoryState.counts[itemId]??0)<1)return{success:false,reason:"not-owned",equipmentState};
 const current=equipmentState?.[slot]??null;
 return{success:true,slot,equipmentState:{...(equipmentState??createEquipmentState()),[slot]:current===itemId?null:itemId}};
}
export function getEquippedItem(id,items){return items.find(item=>item.id===id)??null;}
