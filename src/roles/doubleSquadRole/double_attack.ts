const getheal = function (creep: Creep) {
    if(Game.time % 10 !== 0) return;
    const healCreeps = creep.room.find(FIND_MY_CREEPS, {
        filter: (c) => c.memory.role === 'double-heal' && 
                c.memory.squad === 'attack' && !c.memory.bind
    });
    if(healCreeps.length < 1) return;
    const healcreep = healCreeps[0];
    // 双向绑定
    creep.memory.bind = healcreep.id;
    healcreep.memory.bind = creep.id;
}

const double_attack_action = {
    move: function (creep: Creep) {
        const name = creep.name.match(/#(\w+)/)?.[1] ?? creep.name;
        const moveflag = Game.flags[name + '-move'];
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
        // 躲边界
        else if(creep.pos.isRoomEdge()) {
            creep.moveTo(new RoomPosition(25, 25, creep.room.name), {
                maxRooms: 1,
                ignoreCreeps: false
            })
        }
        // 躲边界
        else if(creep.room.name == bindcreep.room.name && bindcreep.pos.isRoomEdge()) {
            creep.moveTo(new RoomPosition(25, 25, creep.room.name), {
                maxRooms: 1,
                ignoreCreeps: false
            })
        }

        // 如果房间不同，让heal过来
        if(creep.room.name != bindcreep.room.name) {
            bindcreep.moveTo(creep.pos)
        }

        // 未到达房间不继续行动
        if(creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) return true;

        return false
    },
    attack: function (creep: Creep) {
        // 索敌进攻
        const name = creep.name.match(/#(\w+)/)?.[1] ?? creep.name;
        const aFlag = Game.flags[name + '-attack'];
        if(aFlag && creep.room.name !== aFlag.pos.roomName) {
            creep.memory.targetRoom = aFlag.pos.roomName;
            return true;
        }

        const area: [number, number, number, number] = 
                    aFlag ? [Math.max(aFlag.pos.y - 3, 0), Math.max(aFlag.pos.x - 3, 0),
                             Math.min(aFlag.pos.y + 3, 49), Math.min(aFlag.pos.x + 3, 49)] :
                            [Math.max(creep.pos.y - 5, 0), Math.max(creep.pos.x - 5, 0),
                             Math.min(creep.pos.y + 5, 49), Math.min(creep.pos.x + 5, 49)];
        const enemies = creep.room
                        .lookForAtArea(LOOK_CREEPS, ...area, true)
                        .map(obj => obj.creep)
                        .filter(creep => !creep.my)
        if (enemies.length > 0) {
            const targetEnemy = creep.pos.findClosestByRange(enemies);
            if(creep.pos.inRangeTo(targetEnemy, 1)) {
                creep.attack(targetEnemy); // 优先攻击敌人
            } else {
                creep.double_move(targetEnemy, '#ff0000');
            }
            return true;
        }

        return false
    }
}

/** 双人小队 进攻小队 */
const double_attack = function (creep: Creep) {
    if (!creep.memory.notified) {
        creep.notifyWhenAttacked(false);
        creep.memory.notified = true;
    }
    if (!creep.memory.boosted) {
        const boosts = ['XGHO2', 'GHO2', 'GO', 'XUH2O', 'UH2O', 'UH', 'XZHO2', 'ZHO2', 'ZO'];
        creep.memory.boosted = creep.boost(boosts);
        return
    }

    // 绑定heal
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

    if(double_attack_action.move(creep)) return;

    if(double_attack_action.moveToRoom(creep, bindcreep)) return;
    
    if(double_attack_action.attack(creep)) return;
}

export default double_attack