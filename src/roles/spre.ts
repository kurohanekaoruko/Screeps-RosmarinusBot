import { compress } from '@/utils';

const RepairWork = function (creep: Creep) {
    let target = Game.getObjectById(creep.memory.cache.targetId) as StructureRampart | StructureWall | null;

    if (!target || target.hits > 100e6 || target.hits == target.hitsMax) {
        const memory = global.BotMem('layout', creep.room.name);
        const rampartMem = memory['rampart'] || [];
        const wallMem = memory['wall'] || [];
        // 附近三格
        let ramwalls = creep.pos.findInRange(FIND_STRUCTURES, 3, {
            filter: structure => {
                if (structure.structureType !== STRUCTURE_RAMPART &&
                    structure.structureType !== STRUCTURE_WALL) return false;
                if (structure.structureType == STRUCTURE_RAMPART && 
                    !rampartMem.includes(compress(structure.pos.x,structure.pos.y))) return false;
                if (structure.structureType == STRUCTURE_WALL &&
                    !wallMem.includes(compress(structure.pos.x,structure.pos.y))) return false;
                return structure.hits < Math.min(100e6, structure.hitsMax);
            }
        })
        // 没有就找房间内全部
        if (ramwalls.length == 0) {
            ramwalls = creep.room.find(FIND_STRUCTURES, {
                filter: structure => {
                    if (structure.structureType !== STRUCTURE_RAMPART &&
                        structure.structureType !== STRUCTURE_WALL) return false;
                    if (structure.structureType == STRUCTURE_RAMPART && 
                        !rampartMem.includes(compress(structure.pos.x,structure.pos.y))) return false;
                    if (structure.structureType == STRUCTURE_WALL &&
                        !wallMem.includes(compress(structure.pos.x,structure.pos.y))) return false;
                    return structure.hits < Math.min(100e6, structure.hitsMax);
                }
            })
        }

        let target = ramwalls.reduce((a, b) => a.hits < b.hits ? a : b);
        if (target) creep.memory.cache.targetId = target.id;
    }

    if (target) creep.repairOrMoveTo(target);

    return;
}

const WithdrawLink = function (creep: Creep) {
    let linktarget = Game.getObjectById(creep.memory.cache.linkId) || undefined;
    if (!linktarget) {
        const center = global.BotMem('rooms', creep.room.name)['center'];
        const sources = creep.room.source || [];
        const links = creep.room.link.filter(link => 
            link.store[RESOURCE_ENERGY] > 0 &&
            (!center || !link.pos.isNearTo(center.x, center.y)) &&
            (!sources[0] || !link.pos.inRangeTo(sources[0], 2)) &&
            (!sources[1] || !link.pos.inRangeTo(sources[1], 2)));
        if (links.length > 0) {
            linktarget = creep.pos.findClosestByRange(links);
        }
        if (linktarget) creep.memory.cache.linkId = linktarget.id;
    }

    if (linktarget) {
        creep.withdrawOrMoveTo(linktarget);
        return true;
    }

    return false;
}

const UnitRepair = {
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
            RepairWork(creep);
            return true;
        } else {
            if(WithdrawLink(creep)) return false;
            creep.withdrawEnergy();
            return false;
        }
    }
}

export default UnitRepair;