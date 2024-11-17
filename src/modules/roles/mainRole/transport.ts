
const TransportFunction = function(creep: Creep) {
    // 如果没有任务，则接取任务. 如果即将死亡，则不接取任务
    if (!creep.memory.mission && creep.ticksToLive > 20) {
        creep.memory.mission = creep.room.getTransportMission(creep);
    }

    // 如果接取不到任务，检查身上是否有资源，如果有则运输回storage. 如果即将死亡，则运输回storage
    if (!creep.memory.mission || creep.ticksToLive < 20) {
        if(creep.store.getUsedCapacity() === 0) return;
        const storage = creep.room.storage;
        if(!storage) return;
        const resource = Object.keys(creep.store)[0];
        if (creep.transfer(storage, resource as ResourceConstant) === ERR_NOT_IN_RANGE) {
            creep.moveTo(storage);
        }
        return;
    }

    // 执行任务
    let mission = creep.memory.mission;
    let { source, target, resourceType, amount} = mission.data as TransportTask;

    let targetObj = Game.getObjectById(target) as any;
    let sourceObj = Game.getObjectById(source) as StructureContainer | StructureStorage | StructureTerminal | undefined;
    let storage = creep.room.storage;

    // 如果target已满，移除当前任务
    if(!targetObj || targetObj.store.getFreeCapacity(resourceType) === 0) {
        creep.room.deleteMissionFromPool('transport', mission.id);
        delete creep.memory.mission;
        return;
    }

    // 如果没有足够的资源，移除当前任务
    if (!sourceObj || creep.store[resourceType] + sourceObj.store[resourceType] < amount) {
        creep.room.deleteMissionFromPool('transport', mission.id);
        delete creep.memory.mission;
        return;
    }

    // 如果身上有多余资源，先将其放入storage
    if (creep.store.getUsedCapacity() > 0 && Object.keys(creep.store).some(r => r !== resourceType) && storage) {
        for (let resource in creep.store) {
            if (resource === resourceType) continue;
            creep.transferOrMoveTo(storage, resource as ResourceConstant);
            return;
        }
    }

    // 如果creep没有足够的指定资源，从source获取
    if (creep.store.getFreeCapacity(resourceType) > 0 && creep.store[resourceType] < amount) {
        // 检查source是否有足够的资源
        creep.withdrawOrMoveTo(sourceObj, resourceType);
    } 
    
    // 如果creep有足够的指定资源，将其转移到target
    else {
        // 如果目标是extension，优先检查并补充周围未满的extension
        if (targetObj.structureType === STRUCTURE_EXTENSION) {
            const nearbyExtension = creep.room.lookForAtArea(
                LOOK_STRUCTURES,
                Math.max(0, creep.pos.y - 1), Math.max(0, creep.pos.x - 1),
                Math.min(49, creep.pos.y + 1), Math.min(49, creep.pos.x + 1),
                true
            ).filter(item => 
                item.structure.structureType === STRUCTURE_EXTENSION && 
                (item.structure as StructureExtension).store.getFreeCapacity(RESOURCE_ENERGY) > 0
            ).map(item => item.structure)[0];
            if (nearbyExtension && creep.transfer(nearbyExtension, RESOURCE_ENERGY) === OK) {
                return; // 补充成功，结束当前tick
            }
        }

        // 尝试向目标转移资源
        if(creep.pos.isNearTo(targetObj)) {
            const result = creep.transfer(targetObj, resourceType);
            if(result === OK) {
                // 任务完成
                creep.room.doneTransportMission(mission.id, Math.min(amount, creep.store[resourceType]), creep.id);
                delete creep.memory.mission;
            }
        }
        else {
            creep.moveTo(targetObj.pos, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    }
}

export default TransportFunction;