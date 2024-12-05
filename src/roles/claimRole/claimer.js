const claimer = {
    target: function(creep) {
        // 如果没有目标房间
        if (!creep.memory.target) {
            creep.say("🚨 无目标");
            return;
        }

        // 如果不在目标房间，向目标房间移动
        if (creep.room.name !== creep.memory.target) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.target), { 
                visualizePathStyle: { stroke: '#ffaaaa' }
            });
        } else {
            // 尝试占领控制器
            if (creep.room.controller?.my === false) {
                if (creep.pos.inRangeTo(creep.room.controller, 1)) {
                    const result = creep.claimController(creep.room.controller);
                    if(Memory.sign?.[creep.room.name]) creep.signController(creep.room.controller, Memory.sign[creep.room.name]);
                    if(result === OK ) { creep.room.init(); }
                    if(result !== OK) { creep.reserveController(creep.room.controller); }
                }
                else {
                    creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' }});
                }
            }
        }
        return false;
    },
    source: function(creep) {
        return true;
    }
};

export default claimer;
