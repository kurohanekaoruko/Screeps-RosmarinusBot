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
    if(creep.ticksToLive < 100 && creep.room.my) {
        creep.unboost();
        return;
    }

    let healed = false;

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

    // if (creep.pos.roomName === bindcreep.pos.roomName && 
    //     (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49)
    // ){
    //     const terrain = new Room.Terrain(creep.room.name);
    //     const targets =
    //     [[creep.pos.x - 1, creep.pos.y - 1], [creep.pos.x, creep.pos.y-1],
    //      [creep.pos.x + 1, creep.pos.y - 1], [creep.pos.x-1, creep.pos.y],
    //      [creep.pos.x+1, creep.pos.y], [creep.pos.x - 1, creep.pos.y + 1],
    //      [creep.pos.x, creep.pos.y + 1], [creep.pos.x + 1, creep.pos.y + 1]
    //     ].filter(pos => {
    //         if (pos[0] <= 0 || pos[0] >= 49 || pos[1] <= 0 || pos[1] >= 49) return false;
    //         if (terrain.get(pos[1], pos[0]) === TERRAIN_MASK_WALL) return false;
    //         if (creep.room.lookForAt(LOOK_CREEPS, pos[0], pos[1]).length > 0) return false;
    //         return true;
    //     })
    //     if (targets.length > 0) {
    //         creep.moveTo(targets[0][0], targets[0][1]);
    //     }
    // }

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
    return;
}

export default double_heal