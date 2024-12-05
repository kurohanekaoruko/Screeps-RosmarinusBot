const RepairWork = function (creep: Creep) {
    let target = Game.getObjectById(creep.memory.cache.targetId) as StructureRampart | StructureWall | undefined;

    if (!creep.memory.cache.targetId || !target || target.hits >= target.hitsMax) {
        const memory = global.BotMem('layout', creep.room.name);
        const rampartMem = memory['rampart'] || [];
        const wallMem = memory['wall'] || [];
        const rampart = creep.room[STRUCTURE_RAMPART] || [];
        const constructedWall = creep.room[STRUCTURE_WALL] || [];
        const targets = [...rampart, ...constructedWall]
            .filter(structure => {
                if (structure.structureType == STRUCTURE_RAMPART && 
                    !rampartMem.includes(structure.pos.x*100+structure.pos.y)) return false;
                if (structure.structureType == STRUCTURE_WALL &&
                    !wallMem.includes(structure.pos.x*100+structure.pos.y)) return false;
                if (structure.hits < structure.hitsMax) return true;
                return false;
            })
        if (targets.length > 0) {
            target = targets.reduce((structure, next) => structure.hits < next.hits - 1e5 ? structure : next, targets[0]) as StructureRampart | StructureWall;
            creep.memory.cache.targetId = target.id;
        }
    }

    if (target) {
        creep.repairOrMoveTo(target);
    }

    return;
}

const UnitRepair = {
    prepare: function (creep: Creep) {
        return creep.boost(['XLH2O', 'LH2O', 'LH']);
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
            creep.withdrawEnergy();
            return false;
        }
    }
}

export default UnitRepair;