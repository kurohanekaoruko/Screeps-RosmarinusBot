export default class PowerCreepUsePower extends PowerCreep {
    Generate_OPS() {
        const powers = this.powers;
        if(!powers[PWR_GENERATE_OPS]) return false;
        if(powers[PWR_GENERATE_OPS].cooldown > 0) return false;
        this.usePower(PWR_GENERATE_OPS);
        return true;
    }
    Shield(pos: RoomPosition) {
        const powers = this.powers;
        if(PWR_SHIELD in powers && powers[PWR_SHIELD].cooldown <= 0) {
            if(this.pos.inRangeTo(pos, 0)) {
                this.usePower(PWR_SHIELD);
            } else {
                this.moveTo(pos);
            }
            return true;
        }
        return false;
    }
    Regen_Source() {
        const powers = this.powers;
        // 没有技能时不处理
        if(!powers[PWR_REGEN_SOURCE]) return false;
        // 冷却未结束时不处理
        if(powers[PWR_REGEN_SOURCE].cooldown > 0) return;
        const sources = this.room.source;
        if(!sources) return false;
        const source = sources.find(s => !s.effects || !s.effects.some(e => e.effect == PWR_REGEN_SOURCE && e.ticksRemaining > 0));
        if(!source) return false;
        if(this.pos.inRangeTo(source, 3)) {
            this.usePower(PWR_REGEN_SOURCE, source);
        } else {
            this.moveTo(source);
        }
        return true;
    }
    Operate_Factory() {
        // 没有技能时不处理
        if(!this.powers[PWR_OPERATE_FACTORY]) return false;
        // 没有factory时不处理
        const factory = this.room.factory;
        if(!factory) return false;
        // 没有任务时不处理
        const memory = Memory['StructControlData'][this.room.name];
        if(!memory || !memory.factoryProduct) return false;
        // ops不足时不处理
        if(this.store[RESOURCE_OPS] < 100) return false;
        // factory等级不匹配时不处理
        if(!factory.level && (!memory.factoryLevel || memory.factoryLevel <= 0))
            return false;
        if(COMMODITIES[memory.factoryProduct].level != (factory.level || memory.factoryLevel))
            return false;
        // 资源不充足时不处理
        const components = COMMODITIES[memory.factoryProduct]?.components;
        for(const resource in components) {
            if(factory.store[resource] < components[resource]) return false;
        }
        // 已有效果未结束时不处理
        if(factory.effects && factory.effects.some(e => e.effect == PWR_OPERATE_FACTORY && e.ticksRemaining > 0)) return false;
        // 有技能且未冷却时才使用
        if(this.powers[PWR_OPERATE_FACTORY].cooldown > 0) return false;
        if(factory.level && factory.level !== this.powers[PWR_OPERATE_FACTORY].level) return false;
        if(!factory.level && memory.factoryLevel != this.powers[PWR_OPERATE_FACTORY].level) return false;

        if (this.pos.inRangeTo(factory, 3)) {
            this.usePower(PWR_OPERATE_FACTORY, factory);
        } else {
            this.moveTo(factory);
        }
        
        return true;
    }
    Operate_Spawn() {
        const powers = this.powers;
        // 没有技能时不处理
        if(!powers[PWR_OPERATE_SPAWN]) return false;

        if(!this.room.spawn) return false;
        if(this.store[RESOURCE_OPS] < 100) return false;
        const roles = ['power-attack', 'power-heal', 'power-carry', 'power-defend','deposit-harvest', 'deposit-transfer']
        if (!Game.flags[this.name+'-upspawn'] &&
            ((Object.keys(this.room.memory['powerMine']||{}).length == 0 &&
            Object.keys(this.room.memory['depositMine']||{}).length == 0) ||
            this.room.getSpawnMissionTotalByRoles(roles) < 3)) return false;
        if(powers[PWR_OPERATE_SPAWN].cooldown > 0) return false;
        const spawns = this.room.spawn;
        if(!spawns) return false;
        const spawn = spawns.find(s => !s.effects || 
            !s.effects.some(e => e.effect == PWR_OPERATE_SPAWN && e.ticksRemaining > 0));
        if(!spawn) return false;
        if(this.pos.inRangeTo(spawn, 3)) {
            this.usePower(PWR_OPERATE_SPAWN, spawn);
        } else {
            this.moveTo(spawn);
        }
        return true;
    }
    Operate_Power() {
        const powers = this.powers;
        if(!powers[PWR_OPERATE_POWER]) return false;

        const powerSpawn = this.room.powerSpawn;
        if(!powerSpawn) return false;
        const mem = Memory['StructControlData'][this.room.name];
        if(!mem || !mem.powerSpawn) return false;
        if(this.store[RESOURCE_OPS] < 200) return false;
        if(this.room.storage.store[RESOURCE_POWER] < 5000) return false;
        if(powerSpawn.effects && powerSpawn.effects.some(e => e.effect == PWR_OPERATE_POWER && e.ticksRemaining > 0)) return false;

        if(powers[PWR_OPERATE_POWER].cooldown > 0) return;
        if(!powerSpawn) return false;
        if (this.pos.inRangeTo(powerSpawn, 3)) {
            this.usePower(PWR_OPERATE_POWER, powerSpawn);
        } else {
            this.moveTo(powerSpawn);
        }
        return true;
    }
    Operate_Storage() {
        const powers = this.powers;
        if(!powers[PWR_OPERATE_STORAGE]) return false;

        const storage = this.room.storage;
        if(!storage) return false;
        if(this.store[RESOURCE_OPS] < 100) return false;
        if(storage.store.getFreeCapacity() > 1000) return false;
        if(storage.effects && storage.effects.some(e => e.effect == PWR_OPERATE_STORAGE && e.ticksRemaining > 0)) return false;
        
        if(powers[PWR_OPERATE_STORAGE].cooldown > 0) return false;
        if (this.pos.inRangeTo(storage, 3)) {
            this.usePower(PWR_OPERATE_STORAGE, storage);
        } else {
            this.moveTo(storage);
        }
        return true;
    }
    Operate_LAB() {
        const powers = this.powers;
        if(!powers[PWR_OPERATE_LAB]) return false;
        if(!this.room.lab) return false;
        if(this.store[RESOURCE_OPS] < 10) return false;
        if(powers[PWR_OPERATE_LAB].cooldown > 0) return false;

        const botmem =  Memory['StructControlData'][this.room.name];
        if (!botmem || !botmem.lab) return;
        if (!botmem.labA || !botmem.labB) return;
        let labA = Game.getObjectById(botmem.labA) as StructureLab;
        let labB = Game.getObjectById(botmem.labB) as StructureLab;
        if (!labA || !labB) return;
        const labAtype = botmem.labAtype;
        const labBtype = botmem.labBtype;
        if (labA.store[labAtype] < 1000 || labB.store[labBtype] < 1000) {
            return;
        }
        
        if (!labAtype || !labBtype) return;
        const lab = this.room.lab.find(l => {
            if(l.id == botmem.labA || l.id == botmem.labB) return false;
            if(botmem['boostRes'][l.id]) return false;
            if(botmem['boostTypes'][l.id]) return false;
            return !l.effects || l.effects.every(e => e.effect != PWR_OPERATE_LAB)
        });
        if(!lab) return false;
        if (this.pos.inRangeTo(lab, 3)) {
            this.usePower(PWR_OPERATE_LAB, lab);
        } else {
            this.moveTo(lab);
        }
        return true;
    }
    Operate_Extension() {
        const powers = this.powers;
        if(!powers[PWR_OPERATE_EXTENSION]) return false;
        
        if(!this.room.storage) return false;
        if(this.store[RESOURCE_OPS] < 2) return false;
        if(this.room.energyAvailable > this.room.energyCapacityAvailable / 2) return false;
        
        if(powers[PWR_OPERATE_EXTENSION].cooldown > 0) return false;
        const target = this.room.storage;
        if(!target || target.store.energy < 10000) return false;
        if (this.pos.inRangeTo(target, 3)) {
            this.usePower(PWR_OPERATE_EXTENSION, target);
        } else {
            this.moveTo(target);
        }
        return true;
    }
    Operate_Tower() {
        const powers = this.powers;
        if(!powers[PWR_OPERATE_TOWER]) return false;
        if(!this.room.memory.defend) return false;
        if(this.store[RESOURCE_OPS] < 10) return false;
        if(powers[PWR_OPERATE_TOWER].cooldown > 0) return false;

        const towers = this.room.tower;
        if(!towers) return false;
        const tower = towers.find(t => !t.effects ||
            !t.effects.some(e => e.effect == PWR_OPERATE_TOWER && e.ticksRemaining > 0)
        );
        if(!tower) return false;
    
        if(this.pos.inRangeTo(tower, 3)) {
            this.usePower(PWR_OPERATE_TOWER, tower);
        } else {
            this.moveTo(tower);
        }
        return true;
    }
}
