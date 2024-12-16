const outHarvest = {
    target: function(creep: Creep) {
        // 尝试将能量传递给附近的运输单位
        if (this.transferToNearbyCarrier(creep)) return creep.store.getUsedCapacity() == 0;

        // 查找附近的容器
        let targetContainer = creep.pos.findInRange(FIND_STRUCTURES, 2, {
            filter: (structure) => structure.structureType == STRUCTURE_CONTAINER
        })[0];
        
        if (!targetContainer) {
            // 没有容器时的处理
            this.handleNoContainer(creep);
        } else {
            // 有容器时的处理
            this.handleWithContainer(creep, targetContainer);
        }

        return creep.store.getUsedCapacity() == 0;
    },

    handleNoContainer: function(creep: Creep) {
        // 建造容器前确保在采集点附近
        const source = Game.getObjectById(creep.memory.targetSourceId) as Source;
        if (!creep.pos.inRangeTo(source, 1)) {
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // 建造容器
        this.buildContainer(creep);
    },

    handleWithContainer: function(creep, container) {
        // 修理容器
        if (container.hits < container.hitsMax * 0.8) {
            this.repairContainer(creep, container);
            return;
        }

        // 向容器传输能量
        if (creep.pos.isEqualTo(container)) {
            let result = creep.transfer(container, RESOURCE_ENERGY);
            if (result == ERR_FULL) {
                this.handleFullContainer(creep, container);
            }
        } else {
            creep.moveTo(container, { reusePath: 50, visualizePathStyle: { stroke: '#ffaa00' } });
        }
    },

    // 尝试将能量传递给附近的运输单位
    transferToNearbyCarrier: function(creep) {
        const nearbyCarrier = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
            filter: (c) => ((c.memory.role === 'out-carry' || c.memory.role === 'out-car') &&
                    c.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
        })[0];

        if (nearbyCarrier){
            if (creep.transfer(nearbyCarrier, RESOURCE_ENERGY) === OK) return true;
        }

        return false;
    },

    // 建造容器
    buildContainer: function(creep) {
        let constructionSite = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, {
            filter: (site) => site.structureType === STRUCTURE_CONTAINER && site.my
        })[0];

        if (!constructionSite) {
            creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
        } else if (creep.pos.inRangeTo(constructionSite, 2)) {
            creep.build(constructionSite);
        } else {
            creep.moveTo(constructionSite, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    },

    // 修理容器
    repairContainer: function(creep, container) {
        if (creep.pos.inRangeTo(container, 3)) {
            if (creep.repair(container) == ERR_NOT_IN_RANGE) {
                creep.moveTo(container, { reusePath: 50, visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            creep.moveTo(container);
        }
    },

    // 满载时的处理
    handleFullContainer: function(creep, container) {
        if (container.hits < container.hitsMax) {
            creep.repair(container);
        } else {
            if (!this.transferToNearbyCarrier(creep)) {
                creep.drop(RESOURCE_ENERGY);
            }
        }
    },

    source: function(creep) {
        if (creep.room.name != creep.memory.targetRoom || creep.pos.isRoomEdge()) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }

        if (creep.pos.x <= 1) {
            creep.move(RIGHT);
            return;
        } else if (creep.pos.x >= 48) {
            creep.move(LEFT);
            return;
        } else if (creep.pos.y <= 1) {
            creep.move(BOTTOM);
            return;
        } else if (creep.pos.y >= 48) {
            creep.move(TOP);
            return;
        }

        // 如果还没有绑定采集点，则绑定一个
        if (!creep.memory.targetSourceId) {
            // 从绑定数量最少的采集点中寻找离Creep最近的
            let closestSource = creep.room.closestSource(creep);
            if (closestSource) {
                creep.memory.targetSourceId = closestSource.id;
            }
            else {
                creep.say('No source');
                return;
            }
        }

        let targetSource = Game.getObjectById(creep.memory.targetSourceId) as Source;
        if(!targetSource) return;
        // 如果离采集点过远，则移动过去
        if (creep.pos.inRangeTo(targetSource, 1)) {
            creep.harvest(targetSource);
        }
        else {
            if(targetSource.pos.findInRange(FIND_HOSTILE_CREEPS, 3).length > 0) return;
            creep.moveTo(targetSource);
        }

        return creep.store.getFreeCapacity() == 0;
    }
}

export default outHarvest;