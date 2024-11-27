const outDefend = {
    target: function(creep: Creep) {
        const hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS, {
            filter: (c) => !Memory['whitelist']?.includes(c.owner.username)
        });
        let targets = hostileCreeps as any;
        if(targets.length == 0) {
            const invaderCores = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => structure.structureType === STRUCTURE_INVADER_CORE
            });
            targets = invaderCores as any;
        }
              
        if (targets.length > 0) {
            let target = targets.find(c => c.getActiveBodyparts(HEAL) > 0);
            if(!target) {
                target = creep.pos.findClosestByRange(targets);
            }
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
    source: function(creep: Creep) {
        return true;
    }
}

export default outDefend;