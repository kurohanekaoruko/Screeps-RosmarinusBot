const UnitMiner = {
    source: function (creep) {
        const mineral = creep.room.mineral;
        if (!mineral) {
            return false;
        }

        // 检查矿物点是否有提取器
        if (!creep.room.extractor) {
            creep.say('无提取器');
            return false;
        }

        // 如果矿物未枯竭，则开始采集
        if (mineral.mineralAmount > 0) {
            if (creep.harvest(mineral) === ERR_NOT_IN_RANGE) {
                creep.moveTo(mineral, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            creep.say('矿物枯竭');
            creep.suicide();
            return false;
        }

        return creep.store.getFreeCapacity() === 0;
    },
    target: function (creep) {
        // 如果没有缓存存储目标，则寻找存储目标
        if (!creep.memory.cache.targetId) {
            const mineralContainer = creep.room.container.find(c => c.pos.inRangeTo(creep.room.mineral, 2)) || null;
            const target = (mineralContainer && mineralContainer.store.getFreeCapacity() > 0) ?
                            mineralContainer : 
                            creep.pos.findClosestByRange([creep.room.storage, creep.room.terminal])

            if (target) {
                creep.memory.cache.targetId = target.id;
            } else {
                creep.say('无存储目标');
                return false;
            }
        }

        const target = Game.getObjectById(creep.memory.cache.targetId);
        if (!target || target.store.getFreeCapacity() === 0) {
            delete creep.memory.cache.targetId;
            return false;
        }

        const resourceType = Object.keys(creep.store)[0];
        if (creep.transfer(target, resourceType) === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }

        return creep.store.getUsedCapacity() === 0;
    }
};

export default UnitMiner;
