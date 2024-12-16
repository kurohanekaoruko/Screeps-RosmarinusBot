const deposit_attack = {
    run: function (creep: Creep) {
        if (creep.room.name != creep.memory.targetRoom || creep.pos.isRoomEdge()) {
            let opt = {};
            if (creep.room.name != creep.memory.homeRoom) opt = { ignoreCreeps: false };
            creep.moveToRoom(creep.memory.targetRoom, opt);
            return;
        }
    
        let hostiles = creep.room.find(FIND_HOSTILE_CREEPS, {
            filter: (c) => !Memory['whitelist'].includes(c.owner.username) &&
            c.body.some(part => part.type == ATTACK || part.type == RANGED_ATTACK || part.type == HEAL || part.type == WORK) &&
            (c.pos.findInRange(FIND_MY_CREEPS, 3).length || c.pos.findInRange(FIND_DEPOSITS, 3).length)
        });
    
        if (hostiles.length) {
            let hostile = creep.pos.findClosestByRange(hostiles);
            if (creep.pos.isNearTo(hostile)) {
                creep.attack(hostile);
            } else {
                creep.moveTo(hostile, { reusePath: 0, ignoreCreeps: false });
            }
        } else if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
        } else {
            let healTarget = creep.pos.findClosestByRange(FIND_MY_CREEPS, {filter: (c) => c.hits < c.hitsMax});
            if (healTarget) {
                if (creep.pos.inRangeTo(healTarget, 1)) {
                    creep.heal(healTarget);
                } else {
                    creep.moveTo(healTarget, { reusePath: 0, ignoreCreeps: false });
                }
            } else {
                let deposit = creep.pos.findClosestByRange(FIND_DEPOSITS);
                if (deposit) {
                    if (creep.pos.inRangeTo(deposit, 5)) {
                        creep.harvest(deposit);
                    } else {
                        creep.moveTo(deposit, { range: 5, ignoreCreeps: false });
                    }
                }
            }
        }
    }
}

export default deposit_attack;