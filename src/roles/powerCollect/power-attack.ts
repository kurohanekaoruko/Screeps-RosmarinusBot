const power_attack = {
    source: function(creep: Creep) {
        if (creep.room.name != creep.memory.targetRoom || creep.pos.isRoomEdge()) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }

        if(creep.memory.bind && !Game.getObjectById(creep.memory.bind)) {
            delete creep.memory.bind;
        }

        if(creep.hits < creep.hitsMax) {
            return false;
        }

        const powerBank = creep.room.powerBank?.[0] ?? creep.room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_POWER_BANK
        })[0];
        if (powerBank) {
            if (creep.pos.isNearTo(powerBank)) {
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
                if (Memory.rooms[creep.memory.homeRoom]?.['powerMine']?.[creep.memory.targetRoom])
                    delete Memory.rooms[creep.memory.homeRoom]['powerMine'][creep.memory.targetRoom];
            } 
        }

        return false;

    },
    target: function(creep: Creep) {
        return true;
    }
}

export default power_attack;