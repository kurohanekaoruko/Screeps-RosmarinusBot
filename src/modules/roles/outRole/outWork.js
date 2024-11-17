const Scout = {
    target: function(creep) {
        if (!creep.memory.targetRoom) {return;}
        creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoom));
        return false;
    },
    source: function(creep) {
        return true;
    }
}

const OutHarvester = {
    target: function(creep) {
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

    handleNoContainer: function(creep) {
        // 建造容器前确保在采集点附近
        const source = Game.getObjectById(creep.memory.targetSourceId);
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
        if (creep.pos.inRangeTo(container, 1)) {
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
        if (creep.room.name != creep.memory.targetRoom) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }

        if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveToRoom(creep.room.name);
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

        let targetSource = Game.getObjectById(creep.memory.targetSourceId);
        if(!targetSource) return;
        // 如果离采集点过远，则移动过去
        if (creep.pos.inRangeTo(targetSource, 1)) {
            creep.harvest(targetSource);
        }
        else {
            creep.moveTo(targetSource);
        }

        return creep.store.getFreeCapacity() == 0;
    }
}

const Reserver = {
    target: function(creep) {
        if (creep.room.name != creep.memory.targetRoom) {
            creep.moveToRoom(creep.memory.targetRoom);
            return false;
        }
        if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveToRoom(creep.room.name);
            return false;
        }

        const controller = creep.room.controller;
        const ticksToEnd = controller.reservation ? controller.reservation.ticksToEnd : 0;
        if(!controller) return;
        if (creep.pos.inRangeTo(controller, 1)) {
            if (ticksToEnd >= 4950) return false;
            creep.reserveController(controller);
        }
        else {
            creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
        return false;
    },
    source: function(creep) {
        return true;
    }
}

const OutDefender = {
    target: function(creep) {
        const hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
        let targets = hostileCreeps;
        if(targets.length == 0) {
            const invaderCores = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => structure.structureType === STRUCTURE_INVADER_CORE
            });
            targets = invaderCores;
        }
              
        if (targets.length > 0) {
            var target = creep.pos.findClosestByRange(targets);
            if (creep.pos.inRangeTo(target, 3)) {
                creep.rangedAttack(target)
            }
            else {
                creep.moveTo(target);
            }
            if (creep.hits < creep.hitsMax) {
                creep.heal(creep);
            }
            return false;
        }

        // 没有敌人时，治疗房间内的受损单位
        if (targets.length == 0) {
            const damagedCreeps = creep.room.find(FIND_MY_CREEPS, {
                filter: (c) => c.hits < c.hitsMax
            });
            if (damagedCreeps.length > 0) {
                const closestDamagedCreep = creep.pos.findClosestByRange(damagedCreeps);
                const range = creep.pos.getRangeTo(closestDamagedCreep);
                
                if (range <= 1) {
                    creep.heal(closestDamagedCreep);
                } else if (range <= 3) {
                    creep.rangedHeal(closestDamagedCreep);
                    creep.moveTo(closestDamagedCreep);
                } else {
                    creep.moveTo(closestDamagedCreep);
                }
                return false;
            }
        }

        if (creep.room.name != creep.memory.targetRoom) {
            creep.moveToRoom(creep.memory.targetRoom);
            return false;
        }
        if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveToRoom(creep.room.name);
            return false;
        }

        return false;
    },
    source: function(creep) {
        return true;
    }
}

const OutInvader = {
    target: function(creep) {
        const invaderCores = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_INVADER_CORE
        });
        let targets = invaderCores;
        if (targets.length === 0) {
            const hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
            targets = hostileCreeps;
        }
        
        if (targets.length > 0) {
            var target = creep.pos.findClosestByRange(targets);
            if (creep.pos.inRangeTo(target, 1)) {
                if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
            else {
                creep.moveTo(target);
            }
            return false;
        }

        if (creep.room.name != creep.memory.targetRoom) {
            creep.moveToRoom(creep.memory.targetRoom);
            return false;
        }
        if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveToRoom(creep.room.name);
            return false;
        }

        return false;
    },
    source: function(creep) {
        return true;
    }
}

const OutTransport = {
    harvest: function(creep) {
        if (creep.room.name != creep.memory.targetRoom) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }
        
        if (creep.memory.cache.targetId) {
            let target = Game.getObjectById(creep.memory.cache.targetId);
            if (!target) {
                delete creep.memory.cache.targetId;
                delete creep.memory.cache.targetType;
                return;
            }

            if (!creep.pos.inRangeTo(target, 1)) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            }

            const targetType = creep.memory.cache.targetType;
            if (targetType === 'dropped') {
                creep.pickup(target);
            } else if (targetType === 'container' || targetType === 'ruin' || targetType === 'tombstone') {
                const resourceType = Object.keys(target.store)[0];
                creep.withdraw(target, resourceType);
            }

            if ((targetType === 'dropped' && target.amount === 0) || 
                ((targetType === 'container' || targetType === 'ruin' || targetType === 'tombstone') && target.store.getUsedCapacity() === 0)) {
                delete creep.memory.cache.targetId;
                delete creep.memory.cache.targetType;
                return;
            }

            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                const nearbyCarrier = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
                    filter: c => c.memory.role === 'outer_carrier' && 
                                 !c.pos.inRangeTo(target, 1) &&
                                 c.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                })[0];
                if (nearbyCarrier) {
                    creep.transfer(nearbyCarrier, RESOURCE_ENERGY);
                    return;
                }
            }

            delete creep.memory.cache.targetId;
            delete creep.memory.cache.targetType;
        }
 
        const droppedResource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {filter: (resource) => resource.amount > 100});
        if (droppedResource) {
            creep.memory.cache.targetId = droppedResource.id;
            creep.memory.cache.targetType = 'dropped';
            creep.moveTo(droppedResource, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        const ruins = creep.room.find(FIND_RUINS, { filter: (ruin) => ruin && ruin.store.getUsedCapacity() > 0});
        if (ruins.length > 0) {
            const target = creep.pos.findClosestByRange(ruins);
            creep.memory.cache.targetId = target.id;
            creep.memory.cache.targetType = 'ruin';
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }
    
        let container;
        const containers = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_CONTAINER && structure.store.getUsedCapacity() > 0
        });
        if (containers.length > 0) {
            container = creep.pos.findClosestByRange(containers);
        }
        
        if (container) {
            creep.memory.cache.targetId = container.id;
            creep.memory.cache.targetType = 'container';
            creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // 查找墓碑，优先级最低
        const tombstones = creep.room.find(FIND_TOMBSTONES, {
            filter: (tombstone) => tombstone.store.getUsedCapacity() > 0
        });
        if (tombstones.length > 0) {
            const target = creep.pos.findClosestByRange(tombstones);
            creep.memory.cache.targetId = target.id;
            creep.memory.cache.targetType = 'tombstone';
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // 如果没有可以拿的资源，移动到最近的out-harvest身边
        const nearestHarvester = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: (c) => c.memory.role === 'out-harvest'
        });
        if (nearestHarvester) {
            creep.moveTo(nearestHarvester, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveToRoom(creep.room.name);
            return;
        }
    },

    checkAndFillNearbyExtensions: function(creep) {
        const { pos, room, store, memory } = creep;
        
        if (store[RESOURCE_ENERGY] <= 50 || creep.fatigue > 0 || !room.storage || pos.getRangeTo(room.storage) > 10) {
            return false;
        }
    
        const lastPos = memory.lastCheckPos;
        const totalMove = lastPos ? Math.abs(lastPos.x - pos.x) + Math.abs(lastPos.y - pos.y) : 2;
    
        if (!memory.nearbyExtensions || totalMove > 1) {
            memory.nearbyExtensions = room.lookForAtArea(
                LOOK_STRUCTURES,
                Math.max(0, pos.y - 1), Math.max(0, pos.x - 1),
                Math.min(49, pos.y + 1), Math.min(49, pos.x + 1),
                true
            ).filter(item => 
                item.structure.structureType === STRUCTURE_EXTENSION && 
                item.structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            ).map(item => item.structure.id);
            memory.lastCheckPos = { x: pos.x, y: pos.y };
        }
    
        const extensionToFill = memory.nearbyExtensions.find(id => {
            const extension = Game.getObjectById(id);
            return extension && extension.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        });
        
        if (extensionToFill) {
            const result = creep.transfer(Game.getObjectById(extensionToFill), RESOURCE_ENERGY);
            if (result === OK) {
                memory.nearbyExtensions = memory.nearbyExtensions.filter(e => e !== extensionToFill);
                if (memory.nearbyExtensions && memory.nearbyExtensions.length === 0) {
                    delete memory.nearbyExtensions;
                }
                return true;
            }
        }
    
        return false;
    },
    
    carry: function(creep) {
        if (creep.room.name != creep.memory.homeRoom) {
            creep.moveToRoom(creep.memory.homeRoom);
            return;
        }
        
        if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveToRoom(creep.room.name);
            return;
        }

        if(this.checkAndFillNearbyExtensions(creep)) return;
    
        if (creep.memory.cache.targetId) {
            let target = Game.getObjectById(creep.memory.cache.targetId);
            if (target) {
                if (creep.pos.inRangeTo(target, 1)) {
                    if (target.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                        creep.transfer(target, Object.keys(creep.store)[0]);
                    } else {
                        delete creep.memory.cache.targetId;
                    }
                } else {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }
            delete creep.memory.cache.targetId;
        }
    
        let target;

        if(!target) {
            const targets = [];
            if (creep.room.container && creep.room.container.length > 0) {
                let containers = creep.room.container
                                .filter(c => c && c.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                                                  c.pos.inRangeTo(creep.room.mineral, 2));
                if (containers.length > 0) {
                    targets.push(...containers);
                }
            }
            if (creep.room.storage) {
                targets.push(creep.room.storage);
            }
            target = creep.pos.findClosestByPath(targets);
        }
    
        if (target) {
            creep.memory.cache.targetId = target.id;
            if (creep.pos.inRangeTo(target, 1)) {
                if (target.store.getFreeCapacity() > 0) {
                    creep.transfer(target, Object.keys(creep.store)[0]);
                } else {
                    delete creep.memory.cache.targetId;
                }
            } else {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    },

    roadRepair: function(creep) {
        if(creep.memory.role !== 'out-car') return false;
        const roads = creep.pos.findInRange(FIND_STRUCTURES, 0, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax * 0.5;
            }
        });
        if (roads.length > 0) {
            const road = creep.pos.findClosestByRange(roads);
            const result = creep.repair(road)
            if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
                creep.moveToRoom(creep.room.name);
            }
            if(result == OK) return;
            if(result == ERR_NOT_IN_RANGE) { creep.moveTo(road); return; }
        }
        if (creep.room.name == creep.memory.targetRoom && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 200) {
            return true;
        }
        
    },
    
    target: function(creep) {
        if (this.roadRepair(creep)) return true;
        this.carry(creep);
        return creep.store.getUsedCapacity() === 0;
    },
    
    source: function(creep) {
        this.harvest(creep);
        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.served = false;
            return true;
        }
        return false;
    }
}

const OutBuilder = {
    harvest: function(creep) {
        if (creep.room.name != creep.memory.targetRoom) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }
        if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveToRoom(creep.room.name);
            return;
        }

        if (creep.memory.cache.harvestTarget) {
            let target = Game.getObjectById(creep.memory.cache.harvestTarget);
            if (target) {
                if (creep.pos.inRangeTo(target, 1)) {
                    creep.withdraw(target, RESOURCE_ENERGY);
                    if(!target || target.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                        creep.memory.cache.harvestTarget = null;
                        return;
                    }
                    creep.memory.cache.harvestTarget = null;
                } else {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }
            else {
                creep.memory.cache.harvestTarget = null;
            }
        }
    
        // 查找容器
        let container = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_CONTAINER && structure.store.getUsedCapacity() > structure.store.getCapacity() * 0.5;
            }
        });
        if (container.length == 0) {
            container = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_CONTAINER && structure.store.getUsedCapacity() > 0;
                }
            });
        }
        if (container.length > 0) {
            container = creep.pos.findClosestByRange(container);
            creep.memory.cache.harvestTarget = container.id;
            if (creep.pos.inRangeTo(container, 1)) {
                creep.withdraw(container, RESOURCE_ENERGY);
            }
            else {
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' }})
            };
            return;
        }
    },
    build: function(creep) {
        if (creep.room.name != creep.memory.targetRoom) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }
        if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveToRoom(creep.room.name);
            return;
        }

        if (creep.memory.cache.targetId) {
            const target = Game.getObjectById(creep.memory.cache.targetId);
            if (target) {
                if (creep.pos.inRangeTo(target, 3)) {
                    creep.build(target);
                }
                else {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            }
            else {
                creep.memory.cache.targetId = null;
            }
            return;
        }
        
        const targetRoom = Game.rooms[creep.memory.targetRoom];
        const constructionSite = targetRoom.find(FIND_CONSTRUCTION_SITES, {
            filter: (site) => site.structureType === STRUCTURE_ROAD
        });
        if (constructionSite.length > 0) {
            const target = creep.pos.findClosestByRange(constructionSite);
            creep.memory.cache.targetId = target.id;
            if (creep.pos.inRangeTo(target, 3)) {
                creep.build(target);
            }
            else {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }
    },
    target: function(creep) {
        this.build(creep);
        if (creep.store.getUsedCapacity() == 0) {
            creep.say('🔄');
            return true;
        } else { return false; }
    },
    source: function(creep) {
        this.harvest(creep);
        if (creep.store.getFreeCapacity() == 0) {
            creep.say('🚧');
            return true;
        } else { return false; }
    }
}

const OutAttack = {
    source: function(creep) {
        if(creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }

        if (creep.room.name != creep.memory.targetRoom) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }

        // 闲置
        if(creep.memory.idle && creep.memory.idle > Game.time) {
            // 治疗己方单位
            const nearestHarvester = creep.pos.findInRange(FIND_MY_CREEPS, 8, {
                filter: c => c.memory.role === 'out-harvest' || c.memory.role === 'out-carry' || c.memory.role === 'out-miner'
            })[0];
            if(nearestHarvester && nearestHarvester.hits < nearestHarvester.hitsMax) {
                if (creep.pos.inRangeTo(nearestHarvester, 1)) {
                    creep.heal(nearestHarvester);
                } else if (creep.pos.inRangeTo(nearestHarvester, 3)) {
                    creep.rangedHeal(nearestHarvester);
                } else {
                    creep.moveTo(nearestHarvester, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return false;
            }
            return false;
        }

        // 如果没有缓存绑定的Lair，则查找并绑定
        if (!creep.memory.bindLairId) {
            const unbindLairs = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType === STRUCTURE_KEEPER_LAIR &&
                        !_.some(Game.creeps, (c) => c.memory.role === 'out-attack' && c.memory.bindLairId === structure.id);
                }
            });

            if (unbindLairs.length > 0) {
                const nearestLair = creep.pos.findClosestByPath(unbindLairs);
                if (nearestLair) {
                    creep.memory.bindLairId = nearestLair.id;
                }
            }
        }

        // 如果已绑定Lair，则移动到其附近
        if (creep.memory.bindLairId) {
            const bindLair = Game.getObjectById(creep.memory.bindLairId);
            if (!bindLair) {
                // 如果绑定的Lair不存在，清除绑定
                delete creep.memory.bindLairId;
                return false;
            }
            
            if(creep.pos.inRangeTo(bindLair, 1)) {
                if (!bindLair.ticksToSpawn || bindLair.ticksToSpawn <= 5) {
                    return true;
                }
                creep.memory.idle = Game.time + bindLair.ticksToSpawn;
                return false;
            }
            else {
                creep.moveTo(bindLair, { visualizePathStyle: { stroke: '#ffaa00' } });
                return false;
            }
        }

        return true;
    },
    target: function(creep) {
        if(creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }

        if (creep.room.name != creep.memory.targetRoom) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }

        // 检查自身附近是否有敌人
        const nearbyEnemies = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 8);
        if (nearbyEnemies.length > 0) {
            if(creep.attack(nearbyEnemies[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(nearbyEnemies[0], { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return false;
        }

        // 查找最近的out-harvest
        const nearestHarvester = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: c => c.memory.role === 'out-harvest'
        });

        if (nearestHarvester) {
            // 检查out-harvest附近是否有敌人
            const enemiesNearHarvester = nearestHarvester.pos.findInRange(FIND_HOSTILE_CREEPS, 5);
            if (enemiesNearHarvester.length > 0) {
                if(creep.attack(enemiesNearHarvester[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(enemiesNearHarvester[0], { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return false;
            }
        }

        // 如果没有敌人，返回true
        return true;
    }
}

export { Scout, OutHarvester, OutTransport, OutBuilder, Reserver, OutDefender, OutInvader, OutAttack };
