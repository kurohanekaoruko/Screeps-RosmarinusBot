const power_heal = {
    source: function(creep: Creep) {
        if (creep.room.name != creep.memory.targetRoom || creep.pos.isRoomEdge()) {
            creep.moveToRoom(creep.memory.targetRoom);
            if(creep.hits < creep.hitsMax) creep.heal(creep);
            return;
        }
        
        if(creep.hits < creep.hitsMax) {
            creep.heal(creep);
            if(creep.room.find(FIND_HOSTILE_CREEPS, {
                filter: (c) => c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0})) {
                if (Memory.rooms[creep.memory.homeRoom]?.['powerMine']?.[creep.memory.targetRoom]) {
                    delete Memory.rooms[creep.memory.homeRoom]['powerMine'][creep.memory.targetRoom];
                    console.log(`房间 ${creep.memory.homeRoom} 的 ${creep.memory.targetRoom} 开采已取消。`);
                }
            }
            return false;
        }

        if(!creep.memory.bind) {
            const attackCreep = creep.room.find(FIND_MY_CREEPS,
                {filter: (c) => c.memory.role == 'power-attack' && !c.memory.bind &&
                                c.memory.targetRoom == creep.memory.targetRoom});
            if (attackCreep.length === 0) return;
            creep.memory.bind = attackCreep[0].id;
            attackCreep[0].memory.bind = creep.id;
        }

        if(!creep.memory.bind) {
            const powerBank = creep.room.powerBank?.[0] || creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_POWER_BANK
            })[0];
            if (!powerBank) return;
            if (!creep.pos.inRangeTo(powerBank, 2)) creep.moveTo(powerBank);
            const target = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
                filter: (c) => c.memory.role == 'power-attack' 
            })[0];
            if (target) {
                creep.heal(target);
            }
            return false;
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

export default power_heal;