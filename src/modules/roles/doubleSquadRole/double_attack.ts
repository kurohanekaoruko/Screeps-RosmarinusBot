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
    },
    attack: function (creep: Creep) {
        // 索敌进攻
        const aFlag = Game.flags[creep.name + '-attack'];
        if(aFlag && creep.room.name !== aFlag.pos.roomName) {
            creep.memory.targetRoom = aFlag.pos.roomName;
            return true;
        }

        const area: [number, number, number, number] = 
                    aFlag ? [aFlag.pos.y - 3, aFlag.pos.x - 3, aFlag.pos.y + 3, aFlag.pos.x + 3] :
                            [creep.pos.y - 5, creep.pos.x - 5, creep.pos.y + 5, creep.pos.x + 5];
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

        if(creep.room.controller?.my) return false;
        const enemyStructures = creep.room
                                .lookForAtArea(LOOK_STRUCTURES, ...area, true)
                                .map(obj => obj.structure)
                                .filter(structure => 
                                    structure.structureType !== STRUCTURE_CONTAINER &&
                                    structure.structureType !== STRUCTURE_ROAD &&
                                    structure.structureType !== STRUCTURE_KEEPER_LAIR)
        if (enemyStructures.length > 0) {
            let targetStructure = creep.pos.findClosestByRange(enemyStructures);
            const rampart = targetStructure.pos.lookFor(LOOK_STRUCTURES).find(structure => structure.structureType === STRUCTURE_RAMPART);
            if(rampart) { targetStructure = rampart }
            if(creep.pos.inRangeTo(targetStructure, 1)) {
                creep.attack(targetStructure);
            } else {
                creep.double_move(targetStructure, '#ff0000');
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