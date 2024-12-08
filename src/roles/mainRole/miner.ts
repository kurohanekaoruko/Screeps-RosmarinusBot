const UnitMiner = {
    source: function (creep: Creep) {
        const mineral = creep.room.mineral;
        if (!mineral) {
            return false;
        }

        // 检查矿物点是否有提取器
        if (!creep.room.extractor) {
            creep.say('无提取器');
            return false;
        }

        // 移动到矿物存储桶
        const mineralContainer = creep.room.container.find(c => c.pos.inRangeTo(creep.room.mineral, 2)) || null;
        if (mineralContainer && !creep.pos.isEqualTo(mineralContainer)) {
            creep.moveTo(mineralContainer, { visualizePathStyle: { stroke: '#ffaa00' } });
        } else {
            // 如果矿物未枯竭，则开始采集
            if (mineral.mineralAmount > 0) {
                if (creep.pos.isNearTo(mineral)) {
                    creep.harvest(mineral);
                } else {
                    creep.moveTo(mineral, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            } else {
                creep.say('矿物枯竭');
                creep.suicide();
                return false;
            }
        }

        return creep.store.getFreeCapacity() === 0;
    },
    target: function (creep: Creep) {
        // 如果没有缓存存储目标，则寻找存储目标
        if (!creep.memory.cache.targetId) {
            const mineralContainer = creep.room.container.find(c => c.pos.inRangeTo(creep.room.mineral, 2)) || null;
            if(!mineralContainer &&
                creep.pos.inRange(creep.room.mineral.pos, 1) &&
                creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 2)
                .filter(cs => cs.structureType === STRUCTURE_CONTAINER).length === 0) {
                creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
                return false;
            }
            const target = (mineralContainer && mineralContainer.store.getFreeCapacity() > 0) ?
                            mineralContainer : 
                            creep.pos.findClosestByRange([creep.room.storage, creep.room.terminal])

            if (target) {
                creep.memory.cache.targetId = target.id;
            } else {
                creep.drop(Object.keys(creep.store)[0] as ResourceConstant);
                return false;
            }
        }

        const target = Game.getObjectById(creep.memory.cache.targetId) as StructureContainer | StructureStorage | StructureTerminal;
        if (!target || target.store.getFreeCapacity() === 0) {
            delete creep.memory.cache.targetId;
            return false;
        }

        const resourceType = Object.keys(creep.store)[0] as ResourceConstant;
        if (creep.transfer(target, resourceType) === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }

        return creep.store.getUsedCapacity() === 0;
    }
};

export default UnitMiner;
