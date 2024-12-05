const power_attack = {
    source: function(creep: Creep) {
        if (!creep.memory.notified) {
            creep.notifyWhenAttacked(false);
            creep.memory.notified = true;
        }
        if (creep.room.name != creep.memory.targetRoom || creep.pos.isRoomEdge()) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }

        if(!creep.memory.boosted) {
            const boostLevel = creep.memory['boostLevel'];
            let boostRes = null;
            if (boostLevel == 'T1') {
                boostRes = ['UH', 'GO'];
            }
            if (boostRes) {
                const result = creep.goBoost(boostRes);
                if (result == 0) creep.memory.boosted = true;
            } else {
                creep.memory.boosted = true;
            }
            return;
        }

        if (creep.memory.bind && (!Game.getObjectById(creep.memory.bind) ||
            Game.getObjectById(creep.memory.bind)['memory']['bind'] != creep.id ||
            Game.getObjectById(creep.memory.bind)['memory']['targetRoom'] != creep.memory.targetRoom
        )) {
            delete creep.memory.bind;
        }

        const powerBank = creep.room.powerBank?.[0] ?? creep.room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_POWER_BANK
        })[0];
        if (powerBank) {
            if (!creep.room.powerBank) creep.room.update();
            if (creep.pos.isNearTo(powerBank)) {
                if(creep.hits == creep.hitsMax)
                    creep.attack(powerBank);
            } else {
                creep.moveTo(powerBank);
            }
        }
        else {
            if(Game.time % 5 === 0){
                creep.suicide();
                const bindCreep = Game.getObjectById(creep.memory.bind) as Creep;
                bindCreep?.suicide();
                if (Memory.rooms[creep.memory.homeRoom]?.['powerMine']?.[creep.memory.targetRoom]) {
                    delete Memory.rooms[creep.memory.homeRoom]['powerMine'][creep.memory.targetRoom];
                    console.log(`${creep.memory.targetRoom} 的 PowerBank 已耗尽, 已移出开采队列。`);
                }
            } 
        }

        return false;

    },
    target: function(creep: Creep) {
        return true;
    }
}

export default power_attack;