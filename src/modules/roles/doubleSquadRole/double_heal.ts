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

    let healed = false;

    if(creep.hits < creep.hitsMax) {
        creep.heal(creep);
        healed = true;
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

    if(bindcreep.hits < bindcreep.hitsMax && !healed) {
        if (creep.pos.isNearTo(bindcreep)) {
            creep.heal(bindcreep);
            healed = true;
            return;
        } else if (creep.pos.inRangeTo(bindcreep, 3)) {
            creep.rangedHeal(bindcreep);
            healed = true;
            return;
        }
    }

    if (creep.pos.roomName === bindcreep.pos.roomName){
        let poss = [];
        if(creep.pos.x === 0 || creep.pos.x === 49) {
            if(bindcreep.pos.y - 1 > 0) poss.push(new RoomPosition(bindcreep.pos.x, creep.pos.y - 1, bindcreep.pos.roomName));
            if(bindcreep.pos.y + 1 < 49) poss.push(new RoomPosition(bindcreep.pos.x, creep.pos.y + 1, bindcreep.pos.roomName));
        }
        if(creep.pos.y === 0 || creep.pos.y === 49) {
            if(bindcreep.pos.x - 1 > 0) poss.push(new RoomPosition(bindcreep.pos.x - 1, bindcreep.pos.y, bindcreep.pos.roomName));
            if(bindcreep.pos.x + 1 < 49) poss.push(new RoomPosition(bindcreep.pos.x + 1, bindcreep.pos.y, bindcreep.pos.roomName));
        }
        if(poss.length > 0) {
            const terrain = new Room.Terrain(creep.room.name);
            const pos = poss.find(pos => pos.lookFor(LOOK_CREEPS).length === 0 &&
                pos.lookFor(LOOK_STRUCTURES).length === 0 && terrain.get(pos.x, pos.y) !== TERRAIN_MASK_WALL);
            if(pos) {
                creep.moveTo(pos, { visualizePathStyle: { stroke: '#00ff00' } });
            }
        }
    }

    const area = [creep.pos.y - 4, creep.pos.x - 4, creep.pos.y + 4, creep.pos.x + 4] as [number, number, number, number];
    const enemies = creep.room
                    .lookForAtArea(LOOK_CREEPS, ...area, true)
                    .map(obj => obj.creep)
                    .filter((creep) => !creep.my);
    if (enemies.length > 0 && !healed) {
        if (creep.pos.isNearTo(bindcreep)) {
            creep.heal(bindcreep);
        } else if (creep.pos.inRangeTo(bindcreep, 3)) {
            creep.rangedHeal(bindcreep);
        }
    }
    return;
}

export default double_heal