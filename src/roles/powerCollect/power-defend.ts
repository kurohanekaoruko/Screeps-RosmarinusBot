const power_defend = {
    source: function(creep: Creep) {
        if (!creep.memory.notified) {
            creep.notifyWhenAttacked(false);
            creep.memory.notified = true;
        }
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
                creep.heal(healTarget);
            } else if (myCreeps.length > 0){
                creep.rangedHeal(myCreeps[0]);
            } else {
                creep.heal(creep);
            }
        }

        const hostileCreeps = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 5, {
            filter: (c) => 
                c.body.some(p => p.type == HEAL || p.type == ATTACK || p.type == RANGED_ATTACK ||
                            p.type == WORK || p.type == CARRY)
        });
        if (hostileCreeps.length > 0) {
            const healer = hostileCreeps.find(c => c.body.some(p => p.type == HEAL));
            const attacker = hostileCreeps.find(c => c.body.some(p => p.type == ATTACK));
            const target = healer || attacker;
            if(target && !creep.pos.inRangeTo(target, 3)) {
                creep.moveTo(target);
            }
            const range3hostiles = hostileCreeps.filter(c => creep.pos.inRangeTo(c, 3));
            const range3healer = range3hostiles.find(c => c.body.some(p => p.type == HEAL));
            const range3attacker = range3hostiles.find(c => c.body.some(p => p.type == ATTACK));
            const range3target = range3healer || range3attacker || range3hostiles[0];
            if (range3hostiles.length >= 3) {
                creep.rangedMassAttack();
            } else if (range3hostiles.filter(c => creep.pos.inRangeTo(c, 2)).length >= 2) {
                creep.rangedMassAttack();
            } else if (range3hostiles.filter(c => creep.pos.inRangeTo(c, 1)).length >= 1) {
                creep.rangedMassAttack();
            } else if (range3target) {
                creep.rangedAttack(range3target);
            }
            return false;
        }

        const powerBank = creep.room.powerBank?.[0] ?? creep.room.find(FIND_STRUCTURES, 
            {filter: (s) => s.structureType == STRUCTURE_POWER_BANK})[0];
        if (powerBank) {
            if (creep.pos.inRangeTo(powerBank, 3)) {
                creep.rangedAttack(powerBank);
            } else {
                creep.moveTo(powerBank, {range: 3, ignoreCreeps: false});
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