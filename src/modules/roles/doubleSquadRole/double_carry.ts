const getheal = function (creep: Creep) {
    if(Game.time % 10 !== 0) return;
    const healCreeps = creep.room.find(FIND_MY_CREEPS, {
        filter: (c) => c.memory.role === 'double-heal' &&
                c.memory.squad === 'carry' && !c.memory.bind
    });
    if(healCreeps.length < 1) return;
    const healcreep = healCreeps[0];
    // 双向绑定
    creep.memory.bind = healcreep.id;
    healcreep.memory.bind = creep.id;
}

/** 双人小队 搬运小队 */
const double_carry = function (creep: Creep) {
    if (!creep.memory.notified) {
        creep.notifyWhenAttacked(false);
        creep.memory.notified = true;
    }
    if (!creep.memory.boosted) {
        const boosts = ['XGHO2', 'GHO2', 'GO','XZHO2', 'ZHO2', 'ZO'];
        creep.memory.boosted = creep.boost(boosts);
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

    // 移动到指定位置
    const moveflag = Game.flags[creep.name + '-move'];
    if(moveflag && !creep.pos.inRangeTo(moveflag.pos, 0)) {
        if(creep.room.name !== moveflag.pos.roomName) {
            creep.memory.targetRoom = moveflag.pos.roomName;
        }
        creep.double_move(moveflag.pos, '#ffffff')
        return;
    }

    // 移动到指定房间,并放置资源
    const wFlag = Game.flags[creep.name + '-withdraw'];
    if(wFlag && creep.room.name !== wFlag.pos.roomName) {
        creep.double_move(new RoomPosition(25, 25, wFlag.pos.roomName), '#ffffff')
        return;
    }

    if(wFlag && creep.room.name === wFlag.pos.roomName && creep.store.getUsedCapacity() > 0) {
        const storage = creep.room.storage;
        if(storage) {
            if(creep.pos.inRangeTo(storage.pos, 1)) {
                creep.transfer(storage, RESOURCE_ENERGY);
            }
            else {
                creep.double_move(storage, '#ffffff');
            }
        }
        return;
    }
    
    // 移动到目标房间
    if(creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) {
        creep.double_move(new RoomPosition(25, 25, creep.memory.targetRoom), '#ffffff')
    }
    else if(creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
        creep.moveTo(new RoomPosition(25, 25, creep.room.name))
    }

    // 如果房间不同，让heal过来
    if(creep.room.name != bindcreep.room.name) {
        bindcreep.moveTo(creep.pos)
    }

    // 未到达房间不行动
    if(creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) return;

    // 拾取掉落资源
    const cFlag = Game.flags[creep.name + '-carry'];
    if(cFlag && creep.room.name !== cFlag.pos.roomName) {
        creep.memory.targetRoom = cFlag.pos.roomName;
        return;
    }

    if(!cFlag) return;

    const area: [number, number, number, number] = [cFlag.pos.y - 3, cFlag.pos.x - 3, cFlag.pos.y + 3, cFlag.pos.x + 3];
    const droppeds = creep.room
                    .lookForAtArea(LOOK_RESOURCES, ...area, true)
                    .map((r) => r.resource)
                    .filter((r) => r.amount > 0);
    if(droppeds.length > 0) {
        const dropped = creep.pos.findClosestByRange(droppeds);
        if(creep.pos.inRangeTo(dropped.pos, 1)) {
            creep.pickup(dropped);
        }
        else {
            creep.double_move(dropped, '#ffffff');
        }
        return;
    }

    const containers = creep.room
                    .lookForAtArea(LOOK_STRUCTURES, ...area, true)
                    .map((r) => r.structure)
                    .filter((r: StructureContainer) => r.structureType === STRUCTURE_CONTAINER && r.store.getUsedCapacity() > 0);
    if(containers.length > 0) {
        const container = creep.pos.findClosestByRange(containers);
        if(creep.pos.inRangeTo(container.pos, 1)) {
            creep.withdraw(container, RESOURCE_ENERGY);
        }
        else {
            creep.double_move(container, '#ffffff');
        }
    }

    const ruins = creep.room
                    .lookForAtArea(LOOK_RUINS, ...area, true)
                    .map((r) => r.ruin)
                    .filter((r) => r.store.getUsedCapacity() > 0);
    if(ruins.length > 0) {
        const ruin = creep.pos.findClosestByRange(ruins);
        if(creep.pos.inRangeTo(ruin.pos, 1)) {
            creep.withdraw(ruin, RESOURCE_ENERGY);
        }
        else {
            creep.double_move(ruin, '#ffffff');
        }
    }
    
}

export default double_carry;