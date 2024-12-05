import {LabMap} from "@/constant/ResourceConstant";

function UpdateManageMission(room: Room) {
    CheckTerminalResAmount(room);  // 检查终端资源预留数量，不足则补充
    CheckFactoryResAmount(room); // 检查工厂资源数量，补充或搬出
}

// 检查终端资源, 自动调度资源
function CheckTerminalResAmount(room: Room) {
    if (!room.storage || !room.terminal) return false;
    if (!room.storage.pos.inRange(room.terminal.pos, 2)) return false;

    // 发送任务资源数
    const sendTotal = room.getSendMissionTotalAmount();
    // 自动调度资源阈值
    const THRESHOLD = {
        source: {
            RESOURCE_ENERGY: 15000,
            default: 6000
        },
        target: {
            RESOURCE_ENERGY: 10000,
            default: 4000
        }
    }
    Object.keys(LabMap).forEach((r) => { THRESHOLD.source[r] = 15000; THRESHOLD.target[r] = 10000 } )

    // 自动平衡资源排除项
    const exclude: ResourceConstant[] = [
        RESOURCE_METAL, RESOURCE_BIOMASS, RESOURCE_SILICON, RESOURCE_MIST,
        RESOURCE_ALLOY, RESOURCE_CELL, RESOURCE_WIRE, RESOURCE_CONDENSATE,
        RESOURCE_TUBE, RESOURCE_PHLEGM, RESOURCE_SWITCH, RESOURCE_CONCENTRATE,
        RESOURCE_FIXTURES, RESOURCE_TISSUE, RESOURCE_TRANSISTOR, RESOURCE_EXTRACT,
        RESOURCE_FRAME, RESOURCE_MUSCLE, RESOURCE_MICROCHIP, RESOURCE_SPIRIT,
        RESOURCE_HYDRAULICS, RESOURCE_ORGANOID, RESOURCE_CIRCUIT, RESOURCE_EMANATION,
        RESOURCE_MACHINE, RESOURCE_ORGANISM, RESOURCE_DEVICE, RESOURCE_ESSENCE,
        RESOURCE_COMPOSITE, RESOURCE_CRYSTAL, RESOURCE_LIQUID
    ];

    // 检查终端自动转入
    for (const resourceType in room.storage.store) {
        let amount = 0;
        if(resourceType === RESOURCE_ENERGY && Object.keys(sendTotal).length > 0) {
            amount = Math.min(
                room.storage.store[resourceType],
                Object.values(sendTotal).reduce((a, b) => a + b, 0) - room.terminal.store[resourceType]
            )
        }
        // 有发送任务时，根据总量来定
        else if (sendTotal[resourceType]) {
            amount = Math.min(
                room.storage.store[resourceType],
                sendTotal[resourceType] - room.terminal.store[resourceType]
            )
        } else {
            if(room.memory.AUTO_S2T === false) continue;
            if(exclude.includes(resourceType as ResourceConstant)) continue;
            // 当终端资源不足时，将storage资源补充到终端
            const threshold = THRESHOLD.target[resourceType] || THRESHOLD.target.default;
            if (room.terminal.store[resourceType] >= threshold) continue;
            amount = Math.min(
                room.storage.store[resourceType],
                threshold - room.terminal.store[resourceType]
            );
        }
        if(amount <= 0) continue;
        room.ManageMissionAdd('s', 't', resourceType, amount);
    }

    // 检查终端自动转出
    for (const resourceType in room.terminal.store) {
        if(room.memory.AUTO_T2S === false) break;
        if(sendTotal[resourceType]) continue;
        if(exclude.includes(resourceType as ResourceConstant)) continue;
        // 当终端资源过多，且storage有空间时，将终端多余资源转入storage
        const threshold = THRESHOLD.source[resourceType] || THRESHOLD.source.default;
        if(room.terminal.store[resourceType] <= threshold) continue;

        const amount = room.terminal.store[resourceType] - threshold;
        if(amount <= 0) continue;
        if(room.storage.store.getFreeCapacity(resourceType as ResourceConstant) < amount) continue;
        room.ManageMissionAdd('t', 's', resourceType, amount);
    }
}

function CheckFactoryResAmount(room: Room) {
    const factory = room.factory;
    if (!factory) return;
    const product = global.BotMem('structures', room.name, 'factoryProduct');
    let resourceType = product;
    if (!resourceType) return;
    const components = COMMODITIES[resourceType].components;

    // 将不是材料也不是产物的搬走
    for(const type in factory.store) {
        if(components[type]) continue;
        if(type === resourceType) continue;
        room.ManageMissionAdd('f', 's', type, factory.store[type]);
    }

    // 材料不足时补充
    for(const component in components){
        if(factory.store[component] >= 1000) continue;
        const amount = 3000 - factory.store[component];
        if((room.getResourceAmount(component)) < 1000) continue;

        room.ManageMissionAdd('s', 'f', component, Math.min(amount, room.storage.store[component]));
        if(room.storage.store[component] < amount) {
            room.ManageMissionAdd('t', 'f', component,
                Math.min(amount - room.storage.store[component],
                        room.terminal.store[component]));
        }
    }

    // 产物过多时搬出
    if(factory.store[resourceType] >= 3000) {
        if (room.storage && room.storage.store.getFreeCapacity() >= 3000) {
            room.ManageMissionAdd('f', 's', resourceType, 3000);
        } else if (room.terminal && room.terminal.store.getFreeCapacity() >= 3000) {
            if (!room.storage.pos.inRange(room.terminal.pos, 2)) return false;
            room.ManageMissionAdd('f', 't', resourceType, 3000);
        }
    }
}

export  {UpdateManageMission};