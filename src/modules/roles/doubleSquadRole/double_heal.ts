/** 双人小队 heal */
const double_heal = function (creep: Creep) {
    if (!creep.memory.notified) {
        creep.notifyWhenAttacked(false);
        creep.memory.notified = true;
    }
    if(!creep.memory.boosted) {
        const boost = ['XGHO2', 'GHO2', 'GO', 'XLHO2', 'LHO2', 'LO', 'XZHO2', 'ZHO2', 'ZO'];
        creep.memory.boosted = creep.boost(boost);
        return
    }

    if(creep.hits < creep.hitsMax) {
        creep.heal(creep);
    }

    if(!creep.memory.bind) {
        const moveflag = Game.flags[creep.name + '-move'];
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

    if(bindcreep.hits < bindcreep.hitsMax) {
        if (creep.pos.isNearTo(bindcreep)) {
            creep.heal(bindcreep);
        } else if (creep.pos.inRangeTo(bindcreep, 3)) {
            creep.rangedHeal(bindcreep);
            creep.moveTo(bindcreep, { visualizePathStyle: { stroke: '#00ff00' } });
        } else {
            creep.moveTo(bindcreep, { visualizePathStyle: { stroke: '#00ff00' } });
        }
    }

    const area = [creep.pos.y - 3, creep.pos.x - 3, creep.pos.y + 3, creep.pos.x + 3] as [number, number, number, number];
    const enemies = creep.room
                    .lookForAtArea(LOOK_CREEPS, ...area, true)
                    .map(obj => obj.creep)
                    .filter((creep) => creep.my === false);

    if (enemies.length > 0) {
        const closestEnemy = creep.pos.findClosestByRange(enemies) as Creep;
        if (creep.pos.inRangeTo(closestEnemy, 3)) {
            creep.rangedAttack(closestEnemy);
        }
    }
}

export default double_heal