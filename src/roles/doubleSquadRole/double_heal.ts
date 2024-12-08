/** 双人小队 heal */
const double_heal = function (creep: Creep) {
    if (!creep.memory.notified) {
        creep.notifyWhenAttacked(false);
        creep.memory.notified = true;
    }
    if(!creep.memory.boosted) {
        const boost = ['XGHO2', 'GHO2', 'GO', 'XLHO2', 'LHO2', 'LO', 'XZHO2', 'ZHO2', 'ZO'];
        creep.memory.boosted = creep.goBoost(boost);
        return
    }
    if(creep.ticksToLive < 100 && creep.room.my) {
        creep.unboost();
        return;
    }

    let healed = false;

    if(!creep.memory.bind) {
        const squadCreeps = creep.room.find(FIND_MY_CREEPS,
            {filter: (c) => c.memory.squad == creep.memory.squad && !c.memory.bind});
        if(squadCreeps.length) {
            const squadCreep = creep.pos.findClosestByRange(squadCreeps);
            creep.memory.bind = squadCreep.id;
            squadCreep.memory.bind = creep.id;
        }
    }

    if(creep.hits < creep.hitsMax) {
        creep.heal(creep);
        healed = true;
    }

    if(!creep.memory.bind) {
        const name = creep.name.match(/#(\w+)/)?.[1] ?? creep.name;
        const moveflag = Game.flags[name + '-move'];
        if(!moveflag || creep.pos.inRangeTo(moveflag.pos, 0)) return;
        if(creep.room.name !== moveflag.pos.roomName) { creep.memory.targetRoom = moveflag.pos.roomName }
        creep.moveTo(moveflag, { visualizePathStyle: { stroke: '#00ff00' } });
        return;
    };

    const bindcreep = Game.getObjectById(creep.memory.bind) as Creep;

    if(!bindcreep) {
        delete creep.memory.bind;
        return;
    }

    if(bindcreep && !healed) {
        if (creep.pos.isNearTo(bindcreep)) {
            creep.heal(bindcreep);
            healed = true;
        } else if (creep.pos.inRangeTo(bindcreep, 3)) {
            creep.rangedHeal(bindcreep);
            healed = true;
        }
    }

    if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
        const area = [Math.max(creep.pos.y - 4, 0), Math.max(creep.pos.x - 4, 0),
                    Math.min(creep.pos.y + 4, 49), Math.min(creep.pos.x + 4, 49)] as [number, number, number, number];
        const enemies = creep.room
                        .lookForAtArea(LOOK_CREEPS, ...area, true)
                        .map(obj => obj.creep)
                        .filter((creep) => !creep.my);
        if (enemies.length > 0) {
            const target = enemies[0];
            if (creep.pos.inRangeTo(target, 3)) {
                creep.rangedAttack(target);
            }
        }
    }
    return;
}

export default double_heal