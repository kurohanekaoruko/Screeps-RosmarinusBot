const upgrade = function (creep) {
    if (creep.pos.inRangeTo(creep.room.controller, 3)) {
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        const sign = Memory.sign?.[creep.room.name] ?? '';
        if(creep.room.controller && (creep.room.controller.sign?.text ?? '') != (sign ?? '')) {
            if (creep.pos.inRangeTo(creep.room.controller, 1)) {
                creep.signController(creep.room.controller, sign);
            }
            else {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } })
            }
        }
    }
    else {
        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
    }
    return
}

const Upgrader = {
    prepare: function (creep) {
        if(creep.room.level == 8) return true;
        return creep.boost(['XGH2O', 'GH2O', 'GH']);
    },

    target: function (creep) {   // 升级控制器
        if(!creep.memory.ready) return false;
        if(!creep.moveHomeRoom()) return;
        upgrade(creep);
        if (creep.store.getUsedCapacity() === 0) {
            creep.say('🔄');
            return true;
        } else { return false; }
    },
    
    source: function (creep) {   // 获取能量
        if(!creep.memory.ready) return false;
        if(!creep.moveHomeRoom()) return;

        const link = creep.room.link.find(l => l.pos.inRangeTo(creep.room.controller, 2)) || null;
        const container = creep.room.container.find(l => l.pos.inRangeTo(creep.room.controller, 2)) ?? null;

        if (link && link.store[RESOURCE_ENERGY] > 0) {
            creep.withdrawOrMoveTo(link, RESOURCE_ENERGY);
        }
        else if(container && container.store[RESOURCE_ENERGY] > 0) {
            creep.withdrawOrMoveTo(container, RESOURCE_ENERGY);
        }
        else if(!link) { creep.takeEnergy() }

        if (creep.store.getFreeCapacity() === 0) {
            creep.say('⚡');
            return true;
        } else { return false; }
    },
}

export default Upgrader;

