const aclaimer  = function(creep: Creep) {
    if (creep.room.name != creep.memory.targetRoom || creep.pos.isRoomEdge()) {
        creep.moveToRoom(creep.memory.targetRoom);
        return;
    }

    const controller = creep.room.controller;

    if (controller.reservation && controller.reservation.username != creep.owner.username) {
        if (creep.pos.isNearTo(controller)) {
            creep.reserveController(controller);
        } else {
            creep.moveTo(controller);
        }
        return;
    }

    if (!controller || !controller.owner || controller.my) {
        const flags = creep.room.find(FIND_FLAGS) || [];
        const flag = flags.find(f => f.name.match(/aclaim/));
        if (flag) flag.remove();
        for (let i = creep.memory['claimNum']+1; i < 10; i++) {
            const flag = Game.flags[`${creep.memory.homeRoom}-aclaim-${i}`];
            if (flag) flag.remove();
            else break;
        }
        creep.suicide();
        return;
    }

    if ((controller.upgradeBlocked||0) > creep.ticksToLive) {
        creep.memory['claimNum'] = (creep.memory['claimNum']||0) + 1;
        const flag = Game.flags[`${creep.memory.homeRoom}-aclaim-${creep.memory['claimNum']}`];
        if (flag) {
            creep.memory.targetRoom = flag.pos.roomName;
        } else {
            creep.suicide();
        }
        return;
    }

    if (creep.pos.isNearTo(controller)) {
        creep.signController(controller, '🧹家政女仆Creep清扫中...');
        creep.attackController(controller);
    } else {
        creep.moveTo(controller);
    }
}

export default aclaimer