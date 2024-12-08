const power_heal = {
    source: function(creep: Creep) {
        if (!creep.memory.notified) {
            creep.notifyWhenAttacked(false);
            creep.memory.notified = true;
        }

        if(!creep.memory.boosted) {
            const boostLevel = creep.memory['boostLevel'];
            let boostRes = null;
            if (boostLevel == 1) {
                boostRes = ['LO', 'GO'];
            }
            if (boostRes) {
                creep.memory.boosted = creep.goBoost(boostRes, true);
            } else {
                creep.memory.boosted = true;
            }
            return;
        }

        if(!creep.memory.bind) {
            const attackCreep = creep.room.find(FIND_MY_CREEPS,
                {filter: (c) => c.memory.role == 'power-attack' && !c.memory.bind &&
                                c.memory.targetRoom == creep.memory.targetRoom});
            if (attackCreep.length > 0) {
                creep.memory.bind = attackCreep[0].id;
                attackCreep[0].memory.bind = creep.id;
            }
            return;
        }
        
        if(creep.hits < creep.hitsMax) {
            creep.heal(creep);
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
            creep.suicide();
        }

        return false;
    },
    target: function(creep: Creep) {
        return true;
    }
}

export default power_heal;