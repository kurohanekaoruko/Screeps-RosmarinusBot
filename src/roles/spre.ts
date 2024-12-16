import { compress } from '@/utils';

const RepairWork = function (creep: Creep) {
    let target = Game.getObjectById(creep.memory.cache.targetId) as StructureRampart | StructureWall | null;

    if (!target || target.hits == target.hitsMax) {
        const memory = Memory['LayoutData'][creep.room.name];
        const wallMem = memory['wall'] || [];
        let rampartMem = memory['rampart'] || [];
        let structRampart = [];
        for (let s of ['spawn', 'tower', 'storage', 'terminal', 'factory', 'lab', 'nuker', 'powerSpawn']) {
            structRampart.push(...(memory[s] || []));
        }
        rampartMem = [...new Set(rampartMem.concat(structRampart))];

        // 全部
        let allRamWalls = creep.room.find(FIND_STRUCTURES, {
            filter: structure => {
                if (structure.structureType !== STRUCTURE_RAMPART &&
                    structure.structureType !== STRUCTURE_WALL) return false;
                if (structure.structureType == STRUCTURE_RAMPART && 
                    !rampartMem.includes(compress(structure.pos.x,structure.pos.y))) return false;
                if (structure.structureType == STRUCTURE_WALL &&
                    !wallMem.includes(compress(structure.pos.x,structure.pos.y))) return false;
                return structure.hits < structure.hitsMax;
            }
        })
        
        // 附近
        let inRangeRamWalls = []
        if (creep.memory['linkId']) {
            const link = Game.getObjectById(creep.memory['linkId']) as StructureLink;
            inRangeRamWalls = allRamWalls.filter(structure => structure.pos.inRangeTo(link.pos, 4));
        } else {
            inRangeRamWalls = allRamWalls.filter(structure => structure.pos.inRangeTo(creep.pos, 3));
        }

        const minHits = 20e6;
        const maxHits = 300e6;
        let target = null;
        for (let i = 1; i <= maxHits/minHits; i++) {
            let ramwalls = inRangeRamWalls.filter(structure => structure.hits < Math.min(i * minHits, structure.hitsMax));
            if (ramwalls.length > 0) {
                target = ramwalls.reduce((a, b) => a.hits < b.hits ? a : b);
                break;
            }
        }
        
        if (target) creep.memory.cache.targetId = target.id;
    }

    if (target) creep.repairOrMoveTo(target);

    return;
}

const WithdrawLink = function (creep: Creep) {
    let linktarget = Game.getObjectById(creep.memory['linkId']) as any || undefined;
    if (!linktarget) {
        const center = Memory['RoomControlData'][creep.room.name].center;
        const centerPos = new RoomPosition(center.x, center.y, creep.room.name);
        const sources = creep.room.source;
        const links = creep.room.link.filter(link => 
            link.store[RESOURCE_ENERGY] > 0 &&
            (!center || !link.pos.isNearTo(centerPos)) &&
            (!sources || !link.pos.inRangeTo(sources[0].pos, 2)) &&
            (!sources || !link.pos.inRangeTo(sources[1].pos, 2)));
        if (links.length > 0) {
            let minBind = Infinity;
            for (let link of links) {
                const bindNum = creep.room.find(FIND_MY_CREEPS, {filter: creep => creep.memory['linkId'] == link.id}).length;
                if (bindNum == 0) {
                    linktarget = link;
                    break;
                } else if (bindNum < minBind) {
                    linktarget = link;
                    minBind = bindNum;
                }
            }
        }
        if (linktarget) creep.memory['linkId'] = linktarget.id;
    }

    if (linktarget) {
        creep.withdrawOrMoveTo(linktarget);
        return true;
    }

    return false;
}

const SpeedupRepair = {
    prepare: function (creep: Creep) {
        return creep.goBoost(['XLH2O', 'LH2O', 'LH']);
    },
    target: function (creep: Creep) {   // 维修
        if(!creep.memory.ready) return false;
        if(!creep.moveHomeRoom()) return;
        if(creep.store.getUsedCapacity() === 0) {
            creep.say('🔄');
            return true;
        } else {
            RepairWork(creep);
            return false;
        }
    },
    source: function (creep: Creep) {   // 获取能量
        if(!creep.memory.ready) return false;
        if(!creep.moveHomeRoom()) return;
        if(creep.ticksToLive < 30 && creep.body.some(part => part.boost)) {
            if(creep.unboost()) creep.suicide();
            return false;
        }
        if(creep.store.getFreeCapacity() === 0) {
            creep.say('🚧');
            return true;
        } else {
            if(WithdrawLink(creep)) return false;
            creep.withdrawEnergy();
            return false;
        }
    }
}

export default SpeedupRepair;