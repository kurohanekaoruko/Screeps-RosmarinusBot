const lclaimer  = function(creep: Creep) {
    // 如果有治疗组件并且受伤，那么治疗
    if (creep.getActiveBodyparts(HEAL) > 0 && creep.hits < creep.hitsMax) {
        creep.heal(creep);
    }

    const moveflag = Game.flags[creep.name + '-move'];
    if(moveflag) {
        creep.moveTo(moveflag.pos, { visualizePathStyle: { stroke: '#00ff00' }});
        return true;
    }

    const claimflag = Game.flags[creep.name + '-claim'];
    if(claimflag) {
        if (creep.room.name !== claimflag.pos.roomName) {
            creep.moveTo(claimflag.pos, { visualizePathStyle: { stroke: '#ff0000' }});
            return true;
        } else {
            if (creep.room.controller?.my) return;

            if (creep.pos.inRange(creep.room.controller.pos, 1)) {
                creep.claimController(creep.room.controller);

            } else {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' }});
            }
        }
    }

}

export default lclaimer