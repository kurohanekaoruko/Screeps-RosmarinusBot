const CarryEnergySource = {
    tombstone: (creep) => findClosestUnclaimedResource(creep, FIND_TOMBSTONES, 100),
    ruin: (creep) => findClosestUnclaimedResource(creep, FIND_RUINS),
    container: (creep) => {
        const containers = creep.room.container
            .filter(c => c && c.store.getUsedCapacity() > Math.min(1000, creep.store.getFreeCapacity()));
        return creep.pos.findClosestByRange(containers);
    },
    Link: (creep) => {
        if (global.CreepNum?.[creep.room.name]?.['manage'] > 0) return null;
        if (!creep.room.storage || !creep.room.link) return null;
        const manageLink = creep.room.link.find(l => l.pos.inRangeTo(creep.room.storage, 2)) ?? null;
        return manageLink?.energy > 0 ? manageLink : null;
    },
    storageOrTerminal: (creep) => {
        if (!creep.room.CheckSpawnAndTower()) return null;
        if (creep.room.storage?.store.getUsedCapacity(RESOURCE_ENERGY) > 5000) return creep.room.storage;
        if (creep.room.terminal?.store.getUsedCapacity(RESOURCE_ENERGY) > 10000) return creep.room.terminal;
        return null;
    }
};

const findClosestUnclaimedResource = (creep, findConstant, minAmount = 0) => {
    const resources = creep.room.find(findConstant, {
        filter: r => r.store.getUsedCapacity() > minAmount
    });
    const closestResource = creep.pos.findClosestByRange(resources);
    if (!closestResource) return null;
    const otherTransporters = _.filter(Memory.creeps, c => 
        c.role === 'carrier' && c.cache?.targetId === closestResource.id
    );
    return otherTransporters.length === 0 ? closestResource : null;
};

const checkAndFillNearbyExtensions = (creep) => {
    const { pos, room, store, memory } = creep;
    
    const energyAvailable = store[RESOURCE_ENERGY];
    if (energyAvailable <= 50 || creep.fatigue > 0 || !room.storage || pos.getRangeTo(room.storage) > 10) {
        return false;
    }

    const lastPos = memory.lastCheckPos;
    const totalMove = lastPos ? Math.abs(lastPos.x - pos.x) + Math.abs(lastPos.y - pos.y) : 2;

    if (!memory.nearbyExtensions || totalMove > 1) {
        memory.nearbyExtensions = room.lookForAtArea(
            LOOK_STRUCTURES,
            Math.max(0, pos.y - 1), Math.max(0, pos.x - 1),
            Math.min(49, pos.y + 1), Math.min(49, pos.x + 1),
            true
        ).filter(item => 
            item.structure.structureType === STRUCTURE_EXTENSION && 
            item.structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        ).map(item => item.structure.id);
        memory.lastCheckPos = { x: pos.x, y: pos.y };
    }

    const extensionToFill = memory.nearbyExtensions.find(id => {
        const extension = Game.getObjectById(id);
        return extension && extension.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    });
    
    if (extensionToFill) {
        const result = creep.transfer(Game.getObjectById(extensionToFill), RESOURCE_ENERGY);
        if (result === OK) {
            memory.nearbyExtensions = memory.nearbyExtensions.filter(e => e !== extensionToFill);
            if (memory.nearbyExtensions && memory.nearbyExtensions.length === 0) {
                delete memory.nearbyExtensions;
            }
            return true;
        }
    }

    return false;
};

const harvest = (creep) => {
    const { pos, store, memory } = creep;

    // 收集掉落的资源
    const droppedResource = pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
        filter: r => r.resourceType !== RESOURCE_ENERGY || r.amount >= 200
    });
    if (droppedResource) {
        if (pos.inRangeTo(droppedResource, 1)) {
            creep.pickup(droppedResource);
        } else {
            creep.moveTo(droppedResource, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
        return;
    }

    // 从建筑收集资源
    if (!memory.cache.targetId) {
        const target = CarryEnergySource.tombstone(creep) || CarryEnergySource.ruin(creep) ||
                       CarryEnergySource.container(creep) || CarryEnergySource.Link(creep) ||
                       CarryEnergySource.storageOrTerminal(creep);
        if (target) {
            memory.cache.targetId = target.id;
            memory.cache.resourceType = Object.keys(target.store)[0];
        }
    }
    const target = Game.getObjectById(memory.cache.targetId);
    if (!target || target.store.getUsedCapacity() === 0) {
        delete memory.cache.targetId;
        return;
    }
    if (pos.inRangeTo(target, 1)) {
        const resourceType = Object.keys(target.store)[0];
        creep.withdraw(target, resourceType);
        if (store.getFreeCapacity() === 0 || target.store.getFreeCapacity() === 0) {
            delete memory.cache.targetId;
        }
    } else {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
};

const carry = (creep) => {
    const { memory, store, room, pos } = creep;

    let target = Game.getObjectById(memory.cache.targetId);

    if (!target || target.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        if (store.getUsedCapacity(RESOURCE_ENERGY) > 0 && room.CheckSpawnAndTower()) {
            const spawnExtensions = (room.spawn?.concat(room.extension) ?? [])
                                    .filter(extension => extension?.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            target = creep.pos.findClosestByRange(spawnExtensions) || 
                     creep.pos.findClosestByRange((room.tower || [])
                        .filter(tower => tower?.store.getFreeCapacity(RESOURCE_ENERGY) > 100));
            if(!target){
                const powerSpawn = room.powerSpawn || null;
                if(powerSpawn && powerSpawn.store.getFreeCapacity(RESOURCE_ENERGY) > 100){
                    target = powerSpawn;
                }
            }
        } else {
            target = room.storage || room.terminal;
        }

        if (target) {
            memory.cache.targetId = target.id;
            memory.cache.resourceType = RESOURCE_ENERGY;
        }
    }

    if (target) {
        if (pos.inRangeTo(target, 1)) {
            const isStorageOrTerminal = [STRUCTURE_STORAGE, STRUCTURE_TERMINAL].includes(target.structureType);
            const resourceType = isStorageOrTerminal ? Object.keys(store)[0] : RESOURCE_ENERGY;
            const result = creep.transfer(target, resourceType);
            if (result === OK) delete memory.cache.targetId;
        } else {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    }
};

const CarrierFunction = {
    source: (creep) => {
        if (!creep.moveHomeRoom()) return;
        if (checkAndFillNearbyExtensions(creep)) return;
        harvest(creep);
        return creep.store.getFreeCapacity() === 0;
    },
    target: (creep) => {
        if (!creep.moveHomeRoom()) return;
        if (checkAndFillNearbyExtensions(creep)) return;
        carry(creep);
        return creep.store.getUsedCapacity() === 0;
    },
};

export default CarrierFunction;
