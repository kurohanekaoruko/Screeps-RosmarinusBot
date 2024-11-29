const power_defend = {
    source: function(creep: Creep) {
        if (creep.room.name != creep.memory.targetRoom || creep.pos.isRoomEdge()) {
            creep.moveToRoom(creep.memory.targetRoom);
            if(creep.hits < creep.hitsMax) creep.heal(creep);
            return;
        }

        if (creep.hits < creep.hitsMax) creep.heal(creep);
        else {
            const myCreeps = creep.room.find(FIND_MY_CREEPS, 
                {filter: (c) => c.hits < c.hitsMax && creep.pos.inRangeTo(c, 3)});
            const healTarget = myCreeps.find(c => creep.pos.inRangeTo(c, 1));
            if (healTarget) {
                creep.heal(healTarget[0]);
            } else if (myCreeps.length > 0){
                creep.rangedHeal(myCreeps[0]);
            } else {
                creep.heal(creep);
            }
        }

        const hostileCreeps = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 5, {
            filter: (c) => !Memory['whitelist'].includes(c.owner.username) &&
                (c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0)
        });
        if (hostileCreeps.length > 0) {
            if(!creep.pos.inRangeTo(hostileCreeps[0], 2)) {
                creep.moveTo(hostileCreeps[0]);
            }
            const range3hostiles = hostileCreeps.filter(c => creep.pos.inRangeTo(c, 3));
            if (range3hostiles.length >= 3) {
                creep.rangedMassAttack();
            } else if (range3hostiles.length > 0) {
                creep.rangedAttack(hostileCreeps[0]);
            }
            return false;
        }

        const powerBank = creep.room.powerBank?.[0] ?? creep.room.find(FIND_STRUCTURES, 
            {filter: (s) => s.structureType == STRUCTURE_POWER_BANK})[0];
        if (powerBank) {
            if (creep.pos.inRangeTo(powerBank, 3)) {
                creep.rangedAttack(powerBank);
            } else {
                creep.moveTo(powerBank);
            }
            return false;
        }

        return false;
    },
    target: function(creep: Creep) {
        return true;
    }
}

export default power_defend;