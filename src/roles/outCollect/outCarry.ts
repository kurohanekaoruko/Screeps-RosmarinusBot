import { compress } from '@/utils';

const outCarryMove = function(creep: Creep, target: any, options: any) {
    if (creep.room.name === target.pos.roomName) {
        options['maxRooms'] = 1;
    }
    options['range'] = 1;
    options['avoid'] = creep['avoidCache'];
    creep.moveTo(target, options)
}

const outCarry = {
    withdraw: function(creep: Creep) {
        if (creep.room.name != creep.memory.targetRoom || creep.pos.isRoomEdge()) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }

        const npcs = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 1, {
            filter: (c) => c.owner.username === 'Source Keeper'
        });
        const avoidArray = [];
        for (const npc of npcs) {
            for(let i = -3; i <= 3; i++) {
                for(let j = -3; j <= 3; j++) {
                    avoidArray.push(new RoomPosition(npc.pos.x + i, npc.pos.y + j, npc.pos.roomName));
                }
            }
        }
        creep['avoidCache'] = avoidArray;
        
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

            delete creep.memory.cache.targetId;
            delete creep.memory.cache.targetType;
        }

        let container: StructureContainer;
        const containers = creep.room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_CONTAINER &&
                    s.store.getUsedCapacity() > 500 &&
                    Object.values(Memory.creeps).every((m) => 
                        (m.role != 'out-carry' && m.role != 'out-car') ||  m.cache?.targetId !== s.id)
        }) as StructureContainer[];
        // 先找mineral旁边的container
        if (creep.room.mineral) {
            const mineralContainer = containers.find((container) =>
                container.pos.inRangeTo(creep.room.mineral, 2));
            if (mineralContainer) {
                container = mineralContainer;
                creep.memory.cache.targetId = container.id;
                creep.memory.cache.targetType = 'container';
                outCarryMove(creep, container, { visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            }
        }
        // 再找掉落资源
        const droppedResources = creep.room.find(FIND_DROPPED_RESOURCES, 
            {filter: (resource) => resource.amount > 500});
        if (droppedResources && droppedResources.length > 0) {
            const droppedResource = droppedResources.reduce((a, b) => {
                if (a.resourceType !== RESOURCE_ENERGY && b.resourceType === RESOURCE_ENERGY) return a;
                if (b.resourceType !== RESOURCE_ENERGY && a.resourceType === RESOURCE_ENERGY) return b;
                return a.amount < b.amount ? b : a
            });
            creep.memory.cache.targetId = droppedResource.id;
            creep.memory.cache.targetType = 'dropped';
            outCarryMove(creep, droppedResource, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }
        // 再找能量container
        container = creep.pos.findClosestByRange(containers||[]);
        if (container) {
            creep.memory.cache.targetId = container.id;
            creep.memory.cache.targetType = 'container';
            outCarryMove(creep, container, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // 最后查找墓碑，优先级最低
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

        // 检查有没有这两种建筑
        if (creep.room.storage || creep.room.terminal) {
            const storage = creep.room.storage || creep.room.terminal;
            if (storage.store[RESOURCE_ENERGY] > 0) {
                creep.memory.cache.targetId = storage.id;
                creep.memory.cache.targetType = 'container';
                outCarryMove(creep, storage, { visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            }
        }

        // 如果没有可以拿的资源，移动到最近的out-harvest身边，或者out-miner身边
        // 优先miner
        const nearestMiner = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (c) => c.memory.role === 'out-miner'
        });
        if (nearestMiner) {
            if(!creep.pos.inRangeTo(nearestMiner, 1) || nearestMiner.store.getUsedCapacity() > 0) {
                outCarryMove(creep, nearestMiner, { visualizePathStyle: { stroke: '#ffaa00' }, ignoreCreeps: false });
            }
            return;
        }
        const nearestHarvester = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (c) => c.memory.role === 'out-harvest'
        });
        if (nearestHarvester) {
            if(!creep.pos.inRangeTo(nearestHarvester, 2) || nearestHarvester.store[RESOURCE_ENERGY] > 0) {
                outCarryMove(creep, nearestHarvester, { visualizePathStyle: { stroke: '#ffaa00' }, ignoreCreeps: false });
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
        if(creep.store[RESOURCE_ENERGY] == 0) return false;
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
        if (creep.room.name != creep.memory.homeRoom || creep.pos.isRoomEdge()) {
            creep.moveToRoom(creep.memory.homeRoom);
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
                        !c.pos.inRangeTo(creep.room.mineral, 2) && !c.pos.inRangeTo(creep.room.controller, 2));
                if (containers.length > 0) {
                    targets.push(...containers);
                }
            }
            if (creep.room.storage) {
                targets.push(creep.room.storage);
            }
            if (creep.room.terminal) {
                targets.push(creep.room.terminal);
            }
            target = creep.pos.findClosestByRange(targets);
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

    buildRepair: function(creep) {
        if(creep.room.name == creep.memory.homeRoom) return false;
        if(creep.memory.role !== 'out-car') return false;
        if(creep.store[RESOURCE_ENERGY] == 0) return false;
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
        const roadSite = creep.room.find(FIND_CONSTRUCTION_SITES)
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
        if (creep.room.name !== creep.memory.targetRoom) return;
        if (!creep.pos.isRoomEdge()) return;
        if (creep.room.memory.road && creep.room.memory.road.length > 0) return;
        creep.room.memory.road = [];
        const AllPath = [];
        const pos = [];
        const sourcePos = creep.room.find(FIND_SOURCES);
        for (const source of sourcePos) {
            pos.push(source.pos);}
        const mineralPos = creep.room.find(FIND_MINERALS)[0];
        if (mineralPos) pos.push(mineralPos.pos);
        const closestPos = creep.pos.findClosestByRange(pos);
        const path = creep.room.findPath(creep.pos, closestPos, {
            ignoreCreeps: true,
            ignoreRoads: true,
            maxRooms: 1,
            range: 1,
        });
        AllPath.push(...path);
        for (let i = 0; i < pos.length; i++) {
            for (let j = i+1; j < pos.length; j++) {
                AllPath.push(...(creep.room.findPath(pos[i], pos[j], {
                    ignoreCreeps: true,
                    ignoreRoads: true,
                    maxRooms: 1,
                    range: 1,
                })));
            }
        }
        for (const p of AllPath) {
            const xy = compress(p.x, p.y);
            if (creep.room.memory.road.includes(xy)) continue;
            creep.room.createConstructionSite(p.x, p.y, STRUCTURE_ROAD);
            creep.room.memory.road.push(xy);
        }
    },
    
    target: function(creep: Creep) {
        if (this.buildRepair(creep)) return;
        if (creep.room.name == creep.memory.targetRoom &&
            creep.store.getUsedCapacity() < creep.store.getCapacity() / 2) return true;
        this.carry(creep);
        if (creep.room.name !== creep.memory.homeRoom &&
            creep.room.name !== creep.memory.targetRoom &&
            creep.fatigue > 0) {
            creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
        }
        return creep.store.getUsedCapacity() === 0;
    },
    
    source: function(creep: Creep) {
        if (creep.hits < (creep.memory.cache['hits']||creep.hits) &&
            creep.store.getUsedCapacity() > 0) return true;
        creep.memory.cache['hits'] = creep.hits;
        this.withdraw(creep);
        this.createSite(creep);
        return creep.store.getFreeCapacity() === 0;
    }
}

export default outCarry;