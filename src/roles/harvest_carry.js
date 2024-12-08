const harvest = function (creep) {
    const droppedEnergy = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
        filter: (resource) => resource.resourceType === RESOURCE_ENERGY && resource.amount > 200
    });

    if (droppedEnergy) {
        if (creep.pickup(droppedEnergy) === ERR_NOT_IN_RANGE) {
            creep.moveTo(droppedEnergy, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
        return;
    }

    const ruinedEnergy = creep.pos.findClosestByRange(FIND_RUINS, {
        filter: (ruin) => ruin.store[RESOURCE_ENERGY] > 50
    });

    if (ruinedEnergy) {
        if (creep.withdraw(ruinedEnergy, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(ruinedEnergy, { visualizePathStyle: { stroke: '#ffaa00' }})
        }
        return;
    }

    const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_CONTAINER &&
                                structure.store[RESOURCE_ENERGY] > 50
    })
    if (container) {
        if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
        return;
    }

    // 检查spawn和tower是否需要补充能量
    const st = creep.room.CheckSpawnAndTower()

    const storage = creep.room.storage;
    const terminal = creep.room.terminal;

    // 检查storage是否存在且存储的能量大于10000
    if (st && storage && storage.store[RESOURCE_ENERGY] > 10000) {
        if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    }
    // 检查terminal是否存在且存储的能量大于10000
    else if (st && terminal && terminal.store[RESOURCE_ENERGY] > 10000){
        if (creep.withdraw(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    }
    // 如果terminal能量大于storage，则从terminal中取出能量
    else if (!st && storage && terminal && terminal.store[RESOURCE_ENERGY] > storage.store[RESOURCE_ENERGY]) {
        if (creep.withdraw(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    }
    else {
        const targetSource = Game.getObjectById(creep.memory.targetSourceId);
        if (targetSource && targetSource.energy > 0) {
            if (creep.harvest(targetSource) === ERR_NOT_IN_RANGE) {
                creep.moveTo(targetSource, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }
}

const transfer = function (creep) {
    let target = Game.getObjectById(creep.memory.cache.targetId);

    if (!target || target.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        creep.memory.cache.targetId = null;

        const targets = [];

        // 优先查找未满的 spawn 和 extension
        const spawnExtensions = (creep.room.spawn?.concat(creep.room.extension) ?? []).filter(o => o);
        for (const spawnExtension of spawnExtensions) {
            if (spawnExtension.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                targets.push(spawnExtension);
            }
        }

        // 找tower
        if(targets.length === 0) {
            const towers = creep.room.tower?.filter(o => o.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            if (towers && towers.length > 0) {
                targets.push(towers[0]);
            }
        }

        // 如果没有找到未满的 spawn 和 extension，则查找 storage
        if (targets.length === 0) {
            if (creep.room.storage && creep.room.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                targets.push(creep.room.storage);
            }
        }

        // 如果还是没有找到目标，则查找最近的 container
        if (targets.length === 0) {
            const containers = creep.room.container?.filter(o => o.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            if (containers && containers.length > 0) {
                targets.push(containers[0]);
            }
        }

        if (targets.length > 0) {
            target = (targets.length === 1) ? targets[0] : creep.pos.findClosestByRange(targets);
            if (target) creep.memory.cache.targetId = target.id;
        }
    }

    if (target) {
        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    } else {
        creep.say('🚨');
        creep.drop(RESOURCE_ENERGY);
    }
}

const HarvestCarryFunction = {
    prepare: function (creep) {
        const targetSource = creep.room.closestSource(creep);
        if (!targetSource) return false;
        creep.memory.targetSourceId = targetSource.id;
        return true;
    },
    source: function (creep) {
        if (!creep.moveHomeRoom()) return;
        harvest(creep);
        return creep.store.getFreeCapacity() === 0;
    },
    target: function (creep) {
        if (!creep.moveHomeRoom()) return;
        transfer(creep);
        return creep.store.getUsedCapacity() === 0;
    }
};

export default HarvestCarryFunction;
