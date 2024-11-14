

/**
 * 连续自动任务，持续执行到旗帜被删除
 */
function AutoMissionFlag(flagName) {
    if (Game.time % 20 != 2) return;


    // // 查找符合automanage-{source}2{target}-{type}-{amount}的flag
    // const automanageMatch = flagName.match(/^automanage[-#/ ]([stlf])2([stlf])[-#/ ](\w+)[-#/ ](\d+)$/);
    // if(automanageMatch) {
    //     AutoManageFlag(automanageMatch, flagName);
    //     return true;
    // }

    // 查找符合autofactory-{resourceType}-{amount}的flag
    const autofactoryMatch = flagName.match(/^autofactory[-#/ ](\w+)[-#/ ](\d+)$/);
    if(autofactoryMatch) {
        AutoFactoryFlag(autofactoryMatch, flagName);
        return true;
    }
    
}

function AutoManageFlag(automanageMatch, flagName) {
    const source = automanageMatch[1];  // 资源来源
    const target = automanageMatch[2];  // 资源目标
    let type = automanageMatch[3];    // 资源类型
    const amount = parseInt(automanageMatch[4]); // 资源数量, 自动搬运阈值
    const flag = Game.flags[flagName];
    const room = flag.room;

    type = global.BaseConfig.RESOURCE_ABBREVIATIONS[type] || type;

    const getObj = (type) => {
        switch(type) {
            case 's':
                return room.storage;
            case 't':
                return room.terminal;
            case 'l':
                return room.link.find(l => l.pos.inRangeTo(room.storage.pos, 2)) || null;
            case 'f':
                return room.factory;
            default:
                return null;
        }
    }
   
    const sourceObj = getObj(source);
    const targetObj = getObj(target);

    if(!sourceObj || !targetObj) {
        console.log(`旗帜 ${flagName} 关联的资源对象不存在`);
        return;
    }

    if(sourceObj.store[type] < amount) return;
    if(targetObj.store[type] >= amount) return;

    const transferAmount = amount - targetObj.store[type];
    if(transferAmount <= amount * 0.1) return;

    room.ManageMissionAdd(source, target, type, transferAmount);
    
}

function AutoFactoryFlag(autofactoryMatch, flagName) {
    let resourceType = autofactoryMatch[1];  // 资源类型
    const amount = parseInt(autofactoryMatch[2]); // 资源数量, 自动搬运阈值
    const flag = Game.flags[flagName];
    const room = flag.room;

    resourceType = global.BaseConfig.RESOURCE_ABBREVIATIONS[resourceType] || resourceType;

    const factory = room.factory;
    if(!factory) {
        console.log(`旗帜 ${flagName} 所在房间不存在工厂`);
        return;
    }

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
        if(room.storage?.store[component] < 6000 - factory.store[component]) continue;
        room.ManageMissionAdd('s', 'f', component, 6000 - factory.store[component]);
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

    if(factory.store[resourceType] >= amount) {
        const storage = room.storage;
        if (storage && storage.store.getFreeCapacity() >= amount) {
            room.ManageMissionAdd('f', 's', resourceType, amount);
        }
        // 仓库空间不足时停歇
    }

}



export { AutoMissionFlag };
