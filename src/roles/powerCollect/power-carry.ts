const power_carry = {
    source: function(creep: Creep) {
        if (creep.room.name != creep.memory.targetRoom || creep.pos.isRoomEdge()) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }

        const powerBank = creep.room.powerBank?.[0] ?? creep.room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_POWER_BANK
        })[0];
        if (powerBank) {
            if (!creep.pos.inRangeTo(powerBank, 3)) {
                creep.moveTo(powerBank, {range: 3, ignoreCreeps: false});
                return false;
            }
        }
        
        const powerRuin = creep.room.find(FIND_RUINS,{filter: (r) => r.store.getUsedCapacity(RESOURCE_POWER) > 0});
        if (powerRuin.length > 0) {
            if (creep.pos.isNearTo(powerRuin[0])) {
                creep.withdraw(powerRuin[0], RESOURCE_POWER);
            } else {
                creep.moveTo(powerRuin[0]);
            }
            return creep.store.getFreeCapacity(RESOURCE_POWER) === 0;
        }

        const power = creep.room.find(FIND_DROPPED_RESOURCES,{filter: (r) => r.resourceType == RESOURCE_POWER});
        if (power.length > 0) {
            if (creep.pos.isNearTo(power[0])) {
                creep.pickup(power[0]);
            } else {
                creep.moveTo(power[0]);
            }
            return creep.store.getFreeCapacity(RESOURCE_POWER) === 0;
        }

        if (!powerBank && powerRuin.length == 0 && power.length == 0) {
            creep.room.find(FIND_MY_CREEPS, {filter: (c) => c.memory.role == 'power-carry' &&
                c.memory.targetRoom == creep.room.name}).forEach((c) => {c.memory['suicide'] = true});;
            if (creep.store.getUsedCapacity(RESOURCE_POWER) === 0) {
                creep.suicide();
                return false;
            }
            if (creep.store.getUsedCapacity(RESOURCE_POWER) > 0) {
                return true;
            }
        }

        return creep.store.getFreeCapacity(RESOURCE_POWER) === 0;
    },
    target: function(creep: Creep) {
        if (creep.room.name != creep.memory.homeRoom || creep.pos.isRoomEdge()) {
            creep.moveToRoom(creep.memory.homeRoom);
            return;
        }

        const storage = creep.room.storage;
        if (storage) {
            if (creep.pos.isNearTo(storage)) {
                creep.transfer(storage, RESOURCE_POWER);
                if (creep.memory['suicide']) {
                    creep.suicide();
                }
            } else {
                creep.moveTo(storage);
            }
        }

        return creep.store.getUsedCapacity(RESOURCE_POWER) === 0;
    }
}

export default power_carry;