const power_attack = {
    source: function(creep: Creep) {
        if (!creep.memory.notified) {
            creep.notifyWhenAttacked(false);
            creep.memory.notified = true;
        }

        if(!creep.memory.boosted) {
            const boostLevel = creep.memory['boostLevel'];
            if (boostLevel == 1) {
                creep.memory.boosted = creep.goBoost(['UH', 'GO'], true);
                if (creep.memory.boosted) {
                    creep.room.SubmitBoostTask('GO', 150);
                    creep.room.SubmitBoostTask('UH', 600);
                }
            } else {
                creep.memory.boosted = true;
            }
            return;
        }

        if (!creep.memory.bind && creep.room.name == creep.memory.targetRoom) {
            let hostiles = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 8) || [];
            if (hostiles.length == 0) return;
            const healHostiles = hostiles.filter((c: any) => c.body.some((p: any) => p.type == HEAL));
            if (healHostiles.length > 0) {
                const hostile = creep.pos.findClosestByRange(healHostiles);
                if (creep.pos.isNearTo(hostile)) creep.attack(hostile);
                creep.moveTo(hostile);
                return;
            } 
            const attackHostiles = hostiles.filter((c: any) => c.body.some((p: any) => p.type == ATTACK || p.type == RANGED_ATTACK));
            if (attackHostiles.length > 0) {
                const hostile = creep.pos.findClosestByRange(attackHostiles);
                if (creep.pos.isNearTo(hostile)) creep.attack(hostile);
                creep.moveTo(hostile);
                return;
            }
        }
        if (!creep.memory.bind) return; // 等待绑定
        

        const bindcreep = Game.getObjectById(creep.memory.bind) as Creep;
        if (!bindcreep) {
            delete creep.memory.bind;
        }

        // 移动到目标房间.未到达房间不继续行动
        if (creep.doubleMoveToRoom(creep.memory.targetRoom, '#ff0000')) return;

        // 找powerBank
        const powerBank = creep.room.powerBank?.[0] ?? creep.room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_POWER_BANK
        })[0];
        if (!powerBank) {
            if(Game.time % 5 === 0){
                creep.suicide();
                const bindCreep = Game.getObjectById(creep.memory.bind) as Creep;
                bindCreep?.suicide();
                if (Memory.rooms[creep.memory.homeRoom]?.['powerMine']?.[creep.memory.targetRoom]) {
                    delete Memory.rooms[creep.memory.homeRoom]['powerMine'][creep.memory.targetRoom];
                    console.log(`${creep.memory.targetRoom} 的 PowerBank 已耗尽, 已移出开采队列。`);
                }
            }
            return;
        }

        // 索敌
        if (Game.time % 10 == 0 || !creep.memory['hostile']) {
            let hostiles = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 8, {
                filter: (c) => c.pos.inRangeTo(powerBank.pos, 6)    
            }) || [];

            const healHostiles = hostiles.filter((c: any) => c.body.some((p: any) => p.type == HEAL));
            const attackHostiles = hostiles.filter((c: any) => c.body.some((p: any) => p.type == ATTACK || p.type == RANGED_ATTACK));
            
            let hostile = null;
            if (healHostiles.length > 0) {
                hostile = creep.pos.findClosestByRange(healHostiles);
            } else if (attackHostiles.length > 0) {
                hostile = creep.pos.findClosestByRange(attackHostiles);
            }
            if (hostile) creep.memory['hostile'] = hostile.id;
        }

        // 攻击 Creep
        if (creep.memory['hostile']) {
            const hostile = Game.getObjectById(creep.memory['hostile']) as Creep;
            if (hostile && hostile.pos.inRangeTo(powerBank.pos, 6)) {
                if (creep.pos.isNearTo(hostile)) creep.attack(hostile);
                creep.doubleMove(hostile.pos, '#ff0000', false);
                return;
            } else {
                delete creep.memory['hostile'];
            }
        }
        
        // 攻击 powerBank
        if (!creep.room.powerBank) creep.room.update();
        
        if (creep.pos.isNearTo(powerBank)) {
            if(creep.hits == creep.hitsMax)
                creep.attack(powerBank);
        } else {
            creep.doubleMove(powerBank.pos);
        }

        return false;

    },
    target: function(creep: Creep) {
        return true;
    }
}

export default power_attack;