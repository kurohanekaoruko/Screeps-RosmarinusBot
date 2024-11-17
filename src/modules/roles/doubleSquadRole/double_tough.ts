const getheal = function (creep: Creep) {
    if(Game.time % 10 !== 0) return;
    const healCreeps = creep.room.find(FIND_MY_CREEPS, {
        filter: (c) => c.memory.role === 'double-heal' &&
                c.memory.squad === 'tough' && !c.memory.bind
    });
    if(healCreeps.length < 1) return;
    const healcreep = healCreeps[0];
    // 双向绑定
    creep.memory.bind = healcreep.id;
    healcreep.memory.bind = creep.id;
}

const double_tough_action = {
    move: function (creep: Creep) {
        const moveflag = Game.flags[creep.name + '-move'];
        if(moveflag && !creep.pos.inRangeTo(moveflag.pos, 0)) {
            if(creep.room.name !== moveflag.pos.roomName) {
                creep.memory.targetRoom = moveflag.pos.roomName;
            }
            creep.double_move(moveflag.pos, '#ff0000')
            return true;
        }
        return false
    },
    moveToRoom: function (creep: Creep, bindcreep: Creep) {
        // 移动到目标房间
        if(creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) {
            creep.double_move(new RoomPosition(25, 25, creep.memory.targetRoom), '#ff0000')
        }
        else if(creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveTo(new RoomPosition(25, 25, creep.room.name))
        }

        // 如果房间不同，让heal过来
        if(creep.room.name != bindcreep.room.name) {
            bindcreep.moveTo(creep.pos)
        }

        // 未到达房间不继续行动
        if(creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) return true;

        return false
    }
}

/** 双人小队 tough */
const double_tough = function (creep: Creep) {
    if (!creep.memory.notified) {
        creep.notifyWhenAttacked(false);
        creep.memory.notified = true;
    }
    if(!creep.memory.boosted) {
        const boost = ['XGHO2', 'GHO2', 'GO', 'XLHO2', 'XZHO2', 'ZHO2', 'ZO'];
        creep.memory.boosted = creep.boost(boost);
        return
    }

    if(!creep.memory.bind) {
        getheal(creep)
        return;
    }

    // 获取绑定的另一个creep
    const bindcreep = Game.getObjectById(creep.memory.bind) as Creep;
    if(!bindcreep) {
        delete creep.memory.bind;
        return;
    }

    if(double_tough_action.move(creep)) return;

    if(double_tough_action.moveToRoom(creep, bindcreep)) return;
}

export default double_tough