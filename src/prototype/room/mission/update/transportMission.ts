// 更新运输任务
function UpdateTransportMission(room: Room) {
    const storage = room.storage;
    if(!storage) return;

    UpdateEnergyMission(room);
    UpdatePowerMission(room);
    UpdateLabMission(room);
    UpdateLabBoostMission(room);
    UpdateNukerMission(room);
}

function UpdateEnergyMission(room: Room) {
    const storage = room.storage;
    let energy = storage.store[RESOURCE_ENERGY];
    if(energy < 3000) return;

    // 检查spawn和扩展是否需要填充能量
    if(room.spawn) {
        const spawnsAndExtensions = (room.spawn?.concat(room.extension as any) ?? [])
            .filter((s: StructureSpawn | StructureExtension) => s && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
        spawnsAndExtensions.forEach((s: StructureSpawn | StructureExtension) => {
            if(energy < s.store.getFreeCapacity(RESOURCE_ENERGY)) return;
            energy -= s.store.getFreeCapacity(RESOURCE_ENERGY);
            const posInfo = `${s.pos.x}/${s.pos.y}/${s.pos.roomName}`
            const taskdata = {
                pos: posInfo,
                source: storage.id,
                target: s.id,
                resourceType: RESOURCE_ENERGY,
                amount: s.store.getFreeCapacity(RESOURCE_ENERGY),
            }
            room.TransportMissionAdd(0, taskdata)
        })
    }

    // 检查tower是否需要填充能量
    if(room.level >= 3 && room.tower) {
        const towers = (room.tower || [])
            .filter((t: StructureTower) => t && t.store.getFreeCapacity(RESOURCE_ENERGY) > 200);
        towers.forEach((t: StructureTower) => {
            if(energy < t.store.getFreeCapacity(RESOURCE_ENERGY)) return;
            energy -= t.store.getFreeCapacity(RESOURCE_ENERGY);
            const posInfo = `${t.pos.x}/${t.pos.y}/${t.pos.roomName}`;
            const taskdata = {
                pos: posInfo,
                source: storage.id,
                target: t.id,
                resourceType: RESOURCE_ENERGY,
                amount: t.store.getFreeCapacity(RESOURCE_ENERGY),
            }
            room.TransportMissionAdd(0, taskdata)
        })
    }

    // 能量缺少时不填充以下的
    if(room.getResourceAmount(RESOURCE_ENERGY) < 10000) return;

    // 检查powerSpawn是否需要填充能量
    if(Game.time % 20 === 0 && room.level == 8 && room.powerSpawn) {
        const powerSpawn = room.powerSpawn;
        const amount = powerSpawn.store.getFreeCapacity(RESOURCE_ENERGY);
        if(powerSpawn && powerSpawn.store.getFreeCapacity(RESOURCE_ENERGY) > 400 && energy >= amount) {
            energy -= amount;
            const posInfo = `${powerSpawn.pos.x}/${powerSpawn.pos.y}/${powerSpawn.pos.roomName}`;
            const taskdata = {
                pos: posInfo,
                source: storage.id,
                target: powerSpawn.id,
                resourceType: RESOURCE_ENERGY,
                amount: amount,
            }
            room.TransportMissionAdd(0, taskdata)
        }
    }

    // 检查lab是否需要填充能量
    if(Game.time % 20 === 0 && room.level >= 6 && room.lab) {
        const labs = room.lab
            .filter((l: StructureLab) => l && l.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
        labs.forEach((l: StructureLab) => {
            if(energy < l.store.getFreeCapacity(RESOURCE_ENERGY)) return;
            energy -= l.store.getFreeCapacity(RESOURCE_ENERGY);
            const posInfo = `${l.pos.x}/${l.pos.y}/${l.pos.roomName}`;
            const taskdata = {
                pos: posInfo,
                source: storage.id,
                target: l.id,
                resourceType: RESOURCE_ENERGY,
                amount: l.store.getFreeCapacity(RESOURCE_ENERGY),
            }
            room.TransportMissionAdd(1, taskdata)
        })
    }

    // 检查nuker是否需要填充能量
    if(Game.time % 20 === 0 && room.level == 8 && room.nuker) {
        const nuker = room.nuker;
        const amount = Math.min(nuker.store.getFreeCapacity(RESOURCE_ENERGY), 3000);
        if(nuker && amount > 0 && energy >= amount) {
            energy -= amount;
            const posInfo = `${nuker.pos.x}/${nuker.pos.y}/${nuker.pos.roomName}`;
            const taskdata = {
                pos: posInfo,
                source: storage.id,
                target: nuker.id,
                resourceType: RESOURCE_ENERGY,
                amount: amount,
            }
            room.TransportMissionAdd(3, taskdata)
        }
    }

    return OK;
}

// 检查powerSpawn是否需要填充power
function UpdatePowerMission(room: Room) {
    if(room.level < 8 || !room.powerSpawn) return;
    const storage = room.storage;
    const terminal = room.terminal;
    if(!storage && !terminal) return;
    if(room.getResourceAmount(RESOURCE_POWER) < 1000) return;

    const powerSpawn = room.powerSpawn;
    if(!powerSpawn) return;
    const neededAmount = 100 - powerSpawn.store[RESOURCE_POWER];
    if (neededAmount < 50) return;

    const source = (storage.store[RESOURCE_POWER] >= neededAmount && storage) || 
                    (terminal.store[RESOURCE_POWER] >= neededAmount && terminal) || null;
    if(!source) return;
    const posInfo = `${powerSpawn.pos.x}/${powerSpawn.pos.y}/${powerSpawn.pos.roomName}`;
    const taskdata = {
        pos: posInfo,
        source: source.id,
        target: powerSpawn.id,
        resourceType: RESOURCE_POWER,
        amount: neededAmount,
    }
    room.TransportMissionAdd(0, taskdata)
}

// 检查lab是否需要填充资源
function UpdateLabMission(room: Room) {
    const storage = room.storage;
    const terminal = room.terminal;
    if (!storage) return;
    const BotMemStructures =  global.BotMem('structures', room.name);
    if (!BotMemStructures.lab || room.memory.defend) return;    // lab关停时不进行操作
    if (!BotMemStructures.labA || !BotMemStructures.labB ||
        !BotMemStructures.labAtype || !BotMemStructures.labBtype) return;
    const labA = Game.getObjectById(BotMemStructures.labA) as StructureLab;
    const labB = Game.getObjectById(BotMemStructures.labB) as StructureLab;
    const labAtype = BotMemStructures.labAtype;
    const labBtype = BotMemStructures.labBtype;

    // 检查labA和labB中是否存在非设定资源
    [labA, labB].forEach((lab, index) => {
        const type = index === 0 ? labAtype : labBtype;
        if(!lab.mineralType || lab.mineralType === type) return; // 资源类型正确时不操作
        if(!lab.store[lab.mineralType] || lab.store[lab.mineralType] === 0) return; // 资源为空
        const posInfo = `${lab.pos.x}/${lab.pos.y}/${lab.pos.roomName}`;
        const taskdata = {
            pos: posInfo,
            source: lab.id,
            target: storage.id,
            resourceType: lab.mineralType,
            amount: lab.store[lab.mineralType],
        }
        room.TransportMissionAdd(2, taskdata)
    });

    // 检查labA和labB是否需要填充设定的资源
    [labA, labB].forEach((lab, index) => {
        const type = index === 0 ? labAtype : labBtype;
        if(lab.mineralType && lab.mineralType !== type) return;    // 有其他资源时不填充
        if(lab.store.getFreeCapacity(type) < 1000) return;   // 需要填充的量太少时不添加任务
        if(room.getResourceAmount(type) < 1000) return; // 资源不足时不添加任务
        const posInfo = `${lab.pos.x}/${lab.pos.y}/${lab.pos.roomName}`;
        const target = [storage, terminal].reduce((prev, cur) => {
            if(prev.store[type] >= cur.store[type]) return prev;
            return cur;
        })
        const taskdata = {
            pos: posInfo,
            source: target.id,
            target: lab.id,
            resourceType: type,
            amount: Math.min(lab.store.getFreeCapacity(type), target.store[type]),
        }
        room.TransportMissionAdd(2, taskdata)
    });

    if(!room.lab || room.lab.length === 0) return;

    const botmem = global.BotMem('structures', room.name, 'boostTypes');

    // 从已满的lab中取出产物到storage（不包括labA、labB，以及设定了boost的）
    const Labs = room.lab.filter(lab => lab);
    Labs.forEach(lab => {
        if (lab.id === labA.id || lab.id === labB.id || botmem[lab.id]) return;
        if (!lab.store[lab.mineralType] || lab.store[lab.mineralType] === 0) return;
        if (lab.store.getFreeCapacity(lab.mineralType) >= 100) return;
        const posInfo = `${lab.pos.x}/${lab.pos.y}/${lab.pos.roomName}`;
        const taskdata = {
            pos: posInfo,
            source: lab.id,
            target: storage.id,
            resourceType: lab.mineralType,
            amount: lab.store[lab.mineralType],
        }
        room.TransportMissionAdd(2, taskdata)
    });

    // 如果lab的资源不同于产物，则全部取出（不包括labA、labB，以及设定了boost的）
    Labs.forEach(lab => {
        if(lab.id === labA.id || lab.id === labB.id || botmem[lab.id]) return;
        if(lab.mineralType === REACTIONS[labAtype][labBtype]) return;
        if(!lab.store[lab.mineralType] || lab.store[lab.mineralType] === 0) return;
        const posInfo = `${lab.pos.x}/${lab.pos.y}/${lab.pos.roomName}`;
        const taskdata = {
            pos: posInfo,
            source: lab.id,
            target: storage.id,
            resourceType: lab.mineralType,
            amount: lab.store[lab.mineralType],
        }
        room.TransportMissionAdd(2, taskdata)
    });
}

// 填充boost用的资源
function UpdateLabBoostMission(room: Room) {
    const storage = room.storage;
    const terminal = room.terminal;
    if (!storage && !terminal) return;
    
    const botmem =  global.BotMem('structures', room.name);
    if (!botmem['boostTypes']) return;

    if (!room.lab || room.lab.length === 0) return;

    const Labs = room.lab.filter(lab => lab);
    Labs.forEach(lab => {
        const boostType = botmem['boostTypes'][lab.id];
        // 如果没有设定boost，则不填充
        if(!boostType) return;
        // 如果处于开启合成状态，并且该lab是底物lab，那么不填充
        if (botmem.lab && (lab.id == botmem.labA || lab.id == botmem.labB)) return;
        // 如果lab中存在非设定的资源，则搬走
        if(lab.mineralType !== boostType && lab.store[lab.mineralType] > 0) {
            const posInfo = `${lab.pos.x}/${lab.pos.y}/${lab.pos.roomName}`;
            const taskdata = {
                pos: posInfo,
                source: lab.id,
                target: storage.id,
                resourceType: lab.mineralType,
                amount: lab.store[lab.mineralType],
            }
            room.TransportMissionAdd(2, taskdata)
            return;
        }
        
        if(!boostType || !RESOURCES_ALL.includes(boostType)) return;

        // 如果设定的资源不足，则补充
        if(lab.store.getUsedCapacity(boostType) < 2500) {
            const amount = 3000 - lab.store[boostType];
            if (room.getResourceAmount(boostType) < 1000) return;
            const target = [storage, terminal].reduce((prev, cur) => {
                if(prev.store[boostType] >= cur.store[boostType]) return prev;
                return cur;
            })
            const posInfo = `${lab.pos.x}/${lab.pos.y}/${lab.pos.roomName}`;
            const taskdata = {
                pos: posInfo,
                source: target.id,
                target: lab.id,
                resourceType: boostType,
                amount: Math.min(amount, target.store[boostType])
            }
            room.TransportMissionAdd(2, taskdata)
        }
    });
}

// 填充nuket用的资源
function UpdateNukerMission(room: Room) {
    if(Game.time % 50 !== 0) return;
    if(room.level < 8) return;
    if(!room.nuker) return;
    const storage = room.storage;
    const terminal = room.terminal;
    if(!storage && !terminal) return;
    
    const nuker = room.nuker;
    if(!nuker) return;
    if(nuker.store[RESOURCE_GHODIUM] === 5000) return;  // 如果nuker中已经满了，则不补充

    const amount = 5000 - nuker.store[RESOURCE_GHODIUM];
    let source: Id<Structure>;
    if (storage.store[RESOURCE_GHODIUM] >= amount) {
        source = storage.id; // 从storage获取
    } else if (terminal && terminal.store[RESOURCE_GHODIUM] >= amount) {
        source = terminal.id; // 从terminal获取
    } else {
        return; // 如果storage和terminal都不足，则不补充
    }
    const posInfo = `${nuker.pos.x}/${nuker.pos.y}/${nuker.pos.roomName}`;
    const taskdata = {
        pos: posInfo,
        source: source,
        target: nuker.id,
        resourceType: RESOURCE_GHODIUM,
        amount: amount,
    }
    room.TransportMissionAdd(3, taskdata)
}


// 检查任务是否有效
function TransportMissionCheck(room: Room) {
    const checkFunc = (task: Task) => {
        // 如果任务被锁定，检查锁定是否有效，那么解锁
        if(task.lock) {
            const creep = Game.getObjectById(task.lock) as Creep;
            const mission = creep?.memory?.mission;
            if(!creep || !mission || mission?.id !== task.id) task.lock = null;
        };
        // 检查目标是否有效
        const data = task.data as TransportTask
        const source = Game.getObjectById(data.source) as any;
        const target = Game.getObjectById(data.target) as any;
        if(!source || !target) return false;
        return target.store.getFreeCapacity(data.resourceType) > 0 && data.amount >= 100;
    }

    room.checkMissionPool('transport', checkFunc);
}

export {
    UpdateTransportMission,
    TransportMissionCheck,
}