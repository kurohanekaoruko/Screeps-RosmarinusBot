export default class AutoFactory extends Room {
    autoFactory() {
        if (Game.time % 50) return;

        const task = Memory[global.BOT_NAME]['autoFactory'][this.name];
        if (!task) return;

        FactoryAutoTask(this, task);
    }
}

function FactoryAutoTask(room: Room, type: string) {
    let resourceType = global.BaseConfig.RESOURCE_ABBREVIATIONS[type] || type;

    const factory = room.factory;
    if(!factory) return;

    const components = COMMODITIES[resourceType].components;

    // 将不是材料也不是产物的搬走
    for(const type in factory.store) {
        if(components[type]) continue;
        if(type === resourceType) continue;
        room.ManageMissionAdd('f', 's', type, factory.store[type]);
    }

    // 材料不足时补充
    for(const component in components){
        if(factory.store[component] >= 3000) continue;
        if(room.storage?.store[component] < 3000 - factory.store[component]) continue;
        room.ManageMissionAdd('s', 'f', component, 3000 - factory.store[component]);
    }

    if(!room.memory.factoryTask || room.memory.factoryTask !== resourceType) {
        // 检查原材料是否足够
        const hasEnoughComponents = Object.keys(components).every(component => 
            factory.store[component] >= components[component] * 10
        );
        
        if (hasEnoughComponents) {
            room.memory.factoryTask = resourceType;
        }
    }

    if(factory.store[resourceType] >= 3000) {
        const storage = room.storage;
        if (storage && storage.store.getFreeCapacity() >= 3000) {
            room.ManageMissionAdd('f', 's', resourceType, 3000);
        }
        else {
            return; // 仓库空间不足时停歇
        }
    }
}