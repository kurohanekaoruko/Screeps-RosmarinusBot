const outCarryMove = function(creep: Creep, target: any, options: any) {
    if (creep.room.name === target.pos.roomName) {
        options['maxRooms'] = 1;
    }
    options['range'] = 1;
    creep.moveTo(target, options)
}

const outCarry = {
    harvest: function(creep: Creep) {
        if (creep.room.name != creep.memory.targetRoom || creep.pos.isRoomEdge()) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }
        
        if (creep.memory.cache.targetId) {
            let target = Game.getObjectById(creep.memory.cache.targetId) as any;
            if (!target) {
                delete creep.memory.cache.targetId;
                delete creep.memory.cache.targetType;
                return;
            }

            if (!creep.pos.inRangeTo(target, 1)) {
                outCarryMove(creep, target, { visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            }

            const targetType = creep.memory.cache.targetType;
            if (targetType === 'dropped') {
                creep.pickup(target);
            } else if (targetType === 'container' || targetType === 'ruin' || targetType === 'tombstone') {
                const resourceType = Object.keys(target.store)[0] as ResourceConstant;
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
            outCarryMove(creep, droppedResource, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        const ruins = creep.room.find(FIND_RUINS, { filter: (ruin) => ruin && ruin.store.getUsedCapacity() > 0});
        if (ruins.length > 0) {
            const target = creep.pos.findClosestByRange(ruins);
            creep.memory.cache.targetId = target.id;
            creep.memory.cache.targetType = 'ruin';
            outCarryMove(creep, target, { visualizePathStyle: { stroke: '#ffaa00' } });
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
            outCarryMove(creep, container, { visualizePathStyle: { stroke: '#ffaa00' } });
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
            outCarryMove(creep, target, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // 如果没有可以拿的资源，移动到最近的out-harvest身边
        const nearestHarvester = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (c) => c.memory.role === 'out-harvest'
        });
        if (nearestHarvester) {
            if(!creep.pos.inRangeTo(nearestHarvester, 2) || nearestHarvester.store[RESOURCE_ENERGY] > 0) {
                outCarryMove(creep, nearestHarvester, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }

        if (creep.pos.x <= 1) {
            creep.move(RIGHT);
        } else if (creep.pos.x >= 48) {
            creep.move(LEFT);
        } else if (creep.pos.y <= 1) {
            creep.move(BOTTOM);
        } else if (creep.pos.y >= 48) {
            creep.move(TOP);
        }
    },

    checkAndFillNearbyExtensions: function(creep: any) {
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
            const extension = Game.getObjectById(id) as StructureExtension;
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
    
    carry: function(creep: any) {
        if (creep.room.name != creep.memory.homeRoom) {
            creep.moveToRoom(creep.memory.homeRoom);
            return;
        }
        
        if (creep.pos.isRoomEdge()) {
            creep.moveToRoom(creep.room.name);
            return;
        }

        this.checkAndFillNearbyExtensions(creep)
    
        if (creep.memory.cache.targetId) {
            let target = Game.getObjectById(creep.memory.cache.targetId) as StructureContainer | StructureStorage;
            if (target) {
                if (creep.pos.inRangeTo(target, 1)) {
                    if (target.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                        creep.transfer(target, Object.keys(creep.store)[0]);
                    } else {
                        delete creep.memory.cache.targetId;
                    }
                } else {
                    outCarryMove(creep, target, { visualizePathStyle: { stroke: '#ffaa00' } });
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
                                                  !c.pos.inRangeTo(creep.room.mineral, 2));
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
                outCarryMove(creep, target, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    },

    roadRepair: function(creep) {
        if(creep.memory.role !== 'out-car') return false;
        const roads = creep.pos.findInRange(FIND_STRUCTURES, 3, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax * 0.8;
            }
        });
        if (roads.length > 0) {
            const road = creep.pos.findClosestByRange(roads);
            const result = creep.repair(road)
            if (creep.pos.isRoomEdge()) {
                creep.moveToRoom(creep.room.name);
            }
            if(result == OK) return true;
            if(result == ERR_NOT_IN_RANGE) { creep.moveTo(road); return true; }
        }
        const roadSite = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 3, {
            filter: (site) => {
                return site.structureType == STRUCTURE_ROAD;
            }
        })
        if (roadSite.length > 0) {
            const site = creep.pos.findClosestByRange(roadSite);
            const result = creep.build(site)
            if (creep.pos.isRoomEdge()) {
                creep.moveToRoom(creep.room.name);
            }
            if(result == OK) return true;
            if(result == ERR_NOT_IN_RANGE) { creep.moveTo(site); return true; }
        }
        return false;
    },

    createSite: function(creep: any) {
        if (creep.memory.role !== 'out-car') return;
        if (creep.room.name !== creep.memory.homeRoom &&
            creep.room.name !== creep.memory.targetRoom &&
            creep.fatigue > 0) {
            creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
        }
        if (creep.room.name !== creep.memory.targetRoom) return;
        if (!creep.pos.isRoomEdge()) return;
        if (creep.room.memory.road && creep.room.memory.road.length > 0) return;
        creep.room.memory.road = [];
        const pos = [creep.pos];
        const sourcePos = creep.room.find(FIND_SOURCES);
        for (const source of sourcePos) {
            pos.push(source.pos);
        }
        for (let i = 0; i < pos.length; i++) {
            for (let j = i; j < pos.length; j++) {
                if (i == j) continue;
                const path = creep.room.findPath(pos[i], pos[j], {
                    ignoreCreeps: true,
                    ignoreRoads: true,
                    maxRooms: 1,
                    range: 1,
                });
                for (const p of path) {
                    creep.room.createConstructionSite(p.x, p.y, STRUCTURE_ROAD);
                    const xy = p.x*100 + p.y;
                    if (creep.room.memory.road.includes(xy)) continue;
                    creep.room.memory.road.push(xy);
                }
            }
        }
    },
    
    target: function(creep: Creep) {
        if (this.roadRepair(creep)) return;
        if (creep.store.getUsedCapacity() < creep.store.getCapacity() / 2) return true;
        this.carry(creep);
        return creep.store.getUsedCapacity() === 0;
    },
    
    source: function(creep: Creep) {
        this.harvest(creep);
        this.createSite(creep);
        return creep.store.getFreeCapacity() === 0;
    }
}

export default outCarry;