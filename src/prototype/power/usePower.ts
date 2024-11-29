export default class PowerCreepUsePower extends PowerCreep {
    Generate_OPS() {
        const powers = this.powers;
        if(PWR_GENERATE_OPS in powers && powers[PWR_GENERATE_OPS].cooldown <= 0) {
            this.usePower(PWR_GENERATE_OPS);
            return true;
        }
        return false;
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
        if(PWR_REGEN_SOURCE in powers && powers[PWR_REGEN_SOURCE].cooldown <= 0) {
            const sources = this.room.find(FIND_SOURCES);
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
        return false;
    }
    Operate_Factory() {
        // 没有factory时不处理
        const factory = this.room.factory;
        if(!factory) return false;
        // 没有任务时不处理
        const memory =  global.BotMem('structures', this.room.name);
        if(!memory.factoryTask) return false;
        // ops不足时不处理
        if(this.store[RESOURCE_OPS] < 100) return false;
        // factory等级不匹配时不处理
        if(COMMODITIES[memory.factoryTask].level != 
            (factory.level ? factory.level : memory.factoryLevel))
            return false;
        // 资源不充足时不处理
        for(const resource in COMMODITIES[memory.factoryTask].components) {
            if(this.room.storage[resource] < 3000) return false;
        }
        // 已有效果未结束时不处理
        if(factory.effects && factory.effects.some(e => e.effect == PWR_OPERATE_FACTORY && e.ticksRemaining > 0)) return false;
        // 有技能且未冷却时使用
        if(this.powers[PWR_OPERATE_FACTORY]?.cooldown <= 0) {
            if(!factory) return false;
            if(factory.level && factory.level !== this.powers[PWR_OPERATE_FACTORY].level) return false;
            if(!factory.level && 
                memory.factoryLevel != this.powers[PWR_OPERATE_FACTORY].level)
                return false;

            if (this.pos.inRangeTo(factory, 3)) {
                this.usePower(PWR_OPERATE_FACTORY, factory);
            } else {
                this.moveTo(factory);
            }
            
            return true;
        }
        return false;
    }
    Operate_Spawn() {
        if(!this.room.spawn) return false;
        if(this.store[RESOURCE_OPS] < 100) return false;
        const roles = ['deposit-harvest', 'deposit-transport']
        if (Object.keys(this.room.memory['powerMine']).length == 0 &&
            this.room.getSpawnMissionTotalByRoles(roles) < 3) return false;
        const powers = this.powers;
        if (PWR_OPERATE_SPAWN in powers && powers[PWR_OPERATE_SPAWN].cooldown <= 0){
            const spawns = this.room.spawn;
            if(!spawns) return false;
            const spawn = spawns.find(s => !s.effects || !s.effects.some(e => e.effect == PWR_OPERATE_SPAWN && e.ticksRemaining > 0));
            if(!spawn) return false;
            if(this.pos.inRangeTo(spawn, 3)) {
                this.usePower(PWR_OPERATE_SPAWN, spawn);
            } else {
                this.moveTo(spawn);
            }
            return true;
        }
        return false;
    }
    Operate_Power() {
        if(!this.room.powerSpawn) return false;
        if(!global.BotMem('structures', this.room.name).powerSpawn) return false;
        if(this.store[RESOURCE_OPS] < 200) return false;
        if(this.room.storage.store[RESOURCE_POWER] < 5000) return false;
        const powers = this.powers;
        if(PWR_OPERATE_POWER in powers && powers[PWR_OPERATE_POWER].cooldown <= 0) {
            const powerSpawn = this.room.powerSpawn;
            if(!powerSpawn) return false;
            if(powerSpawn.effects && powerSpawn.effects.some(e => e.effect == PWR_OPERATE_POWER && e.ticksRemaining > 0)) return false;
            if (this.pos.inRangeTo(powerSpawn, 3)) {
                this.usePower(PWR_OPERATE_POWER, powerSpawn);
            } else {
                this.moveTo(powerSpawn);
            }
            return true;
        }
        return false;
    }
    Operate_Extension() {
        if(!this.room.storage) return false;
        if(this.store[RESOURCE_OPS] < 2) return false;
        if(this.room.energyAvailable > this.room.energyCapacityAvailable / 2) return false;
        const powers = this.powers;
        if(PWR_OPERATE_EXTENSION in powers && powers[PWR_OPERATE_EXTENSION].cooldown <= 0) {
            const target = this.room.storage;
            if(!target || target.store.energy < 10000) return false;
            if (this.pos.inRangeTo(target, 3)) {
                this.usePower(PWR_OPERATE_EXTENSION, target);
            } else {
                this.moveTo(target);
            }
            return true;
        }
        return false;
    }
}
