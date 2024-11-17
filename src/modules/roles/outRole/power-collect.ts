const power_attack = {
    source: function(creep: Creep) {
        if (creep.room.name != creep.memory.targetRoom) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }

        if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveToRoom(creep.room.name);
            return;
        }

        if(creep.hits < creep.hitsMax) {
            return false;
        }

        const target = creep.room.find(FIND_STRUCTURES,{filter: (s) => s.structureType == STRUCTURE_POWER_BANK});
        if (target.length > 0) {
            if (creep.pos.isNearTo(target[0])) {
                creep.attack(target[0]);
            } else {
                creep.moveTo(target[0]);
            }
        }
        else {
            if(Game.time % 10 === 0){
                creep.suicide();
                const bindCreep = Game.getObjectById(creep.memory.bind) as Creep;
                bindCreep?.suicide();
            } 
        }

        return false;

    },
    target: function(creep: Creep) {
        return true;
    }
}

const power_heal = {
    source: function(creep: Creep) {
        if (creep.room.name != creep.memory.targetRoom) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }

        if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveToRoom(creep.room.name);
            return;
        }
        
        if(creep.hits < creep.hitsMax) {
            creep.heal(creep);
            return false;
        }

        if(!creep.memory.bind) {
            const attackCreep = creep.room.find(FIND_MY_CREEPS,{filter: (c) => c.memory.role == 'power-attack' && !c.memory.bind});
            if (attackCreep.length === 0) return;
            creep.memory.bind = attackCreep[0].id;
            attackCreep[0].memory.bind = creep.id;
        }

        const target = Game.getObjectById(creep.memory.bind) as Creep;
        if (target) {
            if (creep.pos.isNearTo(target)) {
                creep.heal(target);
            } else {
                creep.moveTo(target);
            }
        }
        else{
            delete creep.memory.bind;
        }

        return false;
    },
    target: function(creep: Creep) {
        return true;
    }
}

const power_carry = {
    source: function(creep: Creep) {
        if (creep.room.name != creep.memory.targetRoom) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }

        if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveToRoom(creep.room.name);
            return;
        }

        const target = creep.room.find(FIND_STRUCTURES,{filter: (s) => s.structureType == STRUCTURE_POWER_BANK});
        if (target.length > 0) {
            if (!creep.pos.inRangeTo(target[0], 3)) {
                creep.moveTo(target[0]);
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
            return creep.store.getFreeCapacity(RESOURCE_POWER) === 0 || powerRuin.length === 0;
        }

        const power = creep.room.find(FIND_DROPPED_RESOURCES,{filter: (r) => r.resourceType == RESOURCE_POWER});
        if (power.length > 0) {
            if (creep.pos.isNearTo(power[0])) {
                creep.pickup(power[0]);
            } else {
                creep.moveTo(power[0]);
            }
            return creep.store.getFreeCapacity(RESOURCE_POWER) === 0 || power.length === 0;
        }

        if(target.length + powerRuin.length + power.length === 0) {
            creep.suicide();
            return false;
        }

        if(creep.store.getUsedCapacity(RESOURCE_POWER) === 0) {
            return false;
        }

        return creep.store.getFreeCapacity(RESOURCE_POWER) === 0 || power.length === 0;
    },
    target: function(creep: Creep) {
        if (creep.room.name != creep.memory.homeRoom) {
            creep.moveToRoom(creep.memory.homeRoom);
            return;
        }

        if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveToRoom(creep.room.name);
            return;
        }

        const storage = creep.room.storage;
        if (storage) {
            if (creep.pos.isNearTo(storage)) {
                creep.transfer(storage, RESOURCE_POWER);
            } else {
                creep.moveTo(storage);
            }
        }

        return creep.store.getUsedCapacity(RESOURCE_POWER) === 0;
    }
}

export {
    power_attack,
    power_heal,
    power_carry
}