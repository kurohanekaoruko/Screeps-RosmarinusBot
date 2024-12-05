import { RoleData, RoleLevelData } from '@/constant/CreepConstant';

/**
 * 一些基础的功能
 */
export default class BaseFunction extends Room {
    // 获取房间能量储备
    AllEnergy() {
        let Energy = 0;
        for(const s of this.mass_stores) {
            Energy += s.store[RESOURCE_ENERGY];
        }
        return Energy;
    }

    // 获取房间指定资源储备
    getResourceAmount(resource: ResourceConstant) {
        let amount = 0;
        for(const s of [this.storage, this.terminal]) {
            if(!s) continue;
            amount += s.store[resource];
        }
        return amount;
    }

    // 获取属于该房间的creep数量
    getCreepNum() {
        if (!global.CreepNum) global.CreepNum = {};
        global.CreepNum[this.name] = {};
        Object.values(Game.creeps).forEach((creep: Creep) => {
            if(!creep || creep.ticksToLive < creep.body.length * 3) return;
            const role = creep.memory.role;
            const home = creep.memory.home || creep.memory.homeRoom || creep.room.name;
            if(!role || !home || home != this.name) return;
            global.CreepNum[this.name][role] = (global.CreepNum[this.name][role] || 0) + 1;
            return;
        })
        return global.CreepNum[this.name];
    }

    // 获取当前房间的有效等级，根据可用能量判断
    getEffectiveRoomLevel() {
        let lv = this.level;
        const availableEnergy = this.energyCapacityAvailable;
        const CS_SE = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION];
        const EEC = EXTENSION_ENERGY_CAPACITY;
        const CS_SS = CONTROLLER_STRUCTURES[STRUCTURE_SPAWN];
        const SEC = SPAWN_ENERGY_CAPACITY;
        
        while (lv > 1 && availableEnergy < CS_SE[lv] * EEC[lv] + SEC * CS_SS[lv]) {
            lv--;
        }
        return lv;
    }

    // 检查spawn和tower是否需要补充能量
    CheckSpawnAndTower(){
        const towers = (this.tower || [])
                .filter(tower => tower && tower.store.getFreeCapacity(RESOURCE_ENERGY) > 100);
        if (this.energyAvailable === this.energyCapacityAvailable && towers.length === 0) {
            return false;
        }
        return true;
    }

    // 绑定最少且最近的能量源
    closestSource(creep: Creep) {
        // 初始化最少Creep绑定计数
        let minCreepCount = Infinity;
        let leastCrowdedSources = [];

        if(!this.memory.sourcePosCount) this.memory.sourcePosCount = {}
        let terrain = null;
        // 找到绑定最少的，有位置的采集点
        this.source.forEach((source: Source) => {
            let creepCount = this.find(FIND_MY_CREEPS, {
                filter: c => 
                    c.memory.role === creep.memory.role &&
                    c.memory.targetSourceId === source.id &&
                    c.ticksToLive > 100
            }).length;
            // 该采集点的最大位置
            let maxPosCount: number;
            if (this.memory.sourcePosCount[source.id]) {
                maxPosCount = this.memory.sourcePosCount[source.id];
            } else {
                if (!terrain) terrain = this.getTerrain();
                let pos = source.pos;
                maxPosCount = 
                [[pos.x - 1, pos.y], [pos.x + 1, pos.y], [pos.x, pos.y - 1], [pos.x, pos.y + 1],
                [pos.x - 1, pos.y - 1], [pos.x + 1, pos.y + 1], [pos.x - 1, pos.y + 1], [pos.x + 1, pos.y - 1]]
                .filter((p) => p[0] > 0 && p[0] < 49 && p[1] > 0 && p[1] < 49 &&
                    terrain.get(p[0], p[1]) !== TERRAIN_MASK_WALL
                ).length
                this.memory.sourcePosCount[source.id] = maxPosCount;
            }
            // 绑定满的忽略
            if (creepCount >= maxPosCount) return;
            // 记录绑定数最小的采集点
            if (creepCount < minCreepCount) {
                minCreepCount = creepCount;
                leastCrowdedSources = [source];
            } else if (creepCount === minCreepCount) {
                leastCrowdedSources.push(source);
            }
        });
    
        // 若有多个结果, 则选取最近的
        let closestSource = null;
        if (leastCrowdedSources.length == 1) {
            closestSource = leastCrowdedSources[0];
        } else if (leastCrowdedSources.length > 1) {
            closestSource = creep.pos.findClosestByRange(leastCrowdedSources);
        }
    
        return closestSource;
    }

    /* 动态生成体型 */
    DynamicBodys(role: string) {
        const lv = this.getEffectiveRoomLevel();
        let body: number[];
        if (RoleData[role]['adaption']) {
            body = RoleLevelData[role][lv].bodypart
        } else {
            body = RoleData[role].ability;
        }

        if (lv == 8) {
            if (role == 'harvester' && this.source.some(s => (s.effects||[]).some(e => e.effect == PWR_REGEN_SOURCE))) {
                body = RoleLevelData[role][lv].upbodypart;
            }
        }
        return body;
    }

    /* 生成指定体型 */
    GenerateBodys(bodypart: number[], role='') {
        const [work, carry, move, attack, range_attack, heal, claim, tough] = bodypart;

        var body_list = []
        // 生成优先级，越往前越优先
        if (tough) body_list = AddList(body_list, tough, TOUGH)
        switch (role) {
        case 'power-attack':
            if (move) body_list = AddList(body_list, move - 2, MOVE)
            if (attack) body_list = AddList(body_list, attack, ATTACK)
            if (move) body_list = AddList(body_list, 2, MOVE)
            break;
        case 'out-defend':
            if (move) body_list = AddList(body_list, move - 2, MOVE)
            if (attack) body_list = AddList(body_list, attack, ATTACK)
            if (range_attack) body_list = AddList(body_list, range_attack, RANGED_ATTACK)
            if (heal) body_list = AddList(body_list, heal - 1, HEAL)
            if (move) body_list = AddList(body_list, 2, MOVE)
            if (heal) body_list = AddList(body_list, 1, HEAL)
            break;
        default:
            if (work) body_list = AddList(body_list, work, WORK)
            if (attack) body_list = AddList(body_list, attack, ATTACK)
            if (range_attack) body_list = AddList(body_list, range_attack, RANGED_ATTACK)
            if (carry) body_list = AddList(body_list, carry, CARRY)
            if (claim) body_list = AddList(body_list, claim, CLAIM)
            if (move) body_list = AddList(body_list, move, MOVE)
            if (heal) body_list = AddList(body_list, heal, HEAL)
            break;
        }
    
        return body_list
    }

    /* 计算孵化所需能量 */
    CalculateEnergy(abilityList: any[]) {
        var num = 0
        for (var part of abilityList) {
        if (part == WORK) num += 100
        if (part == CARRY) num += 50
        if (part == MOVE) num += 50
        if (part == ATTACK) num += 80
        if (part == RANGED_ATTACK) num += 150
        if (part == HEAL) num += 250
        if (part == CLAIM) num += 600
        if (part == TOUGH) num += 10
        }
        return num
    }

    /** 计算角色的孵化所需能量 */
    CalculateRoleEnergy(role: string) {
        const lv = this.getEffectiveRoomLevel();
        const bodypart = RoleData[role]['adaption'] ? RoleLevelData[role][lv].bodypart : RoleData[role].ability;
        let energy = 0;
        energy += bodypart[0] * 100;
        energy += bodypart[1] * 50;
        energy += bodypart[2] * 50;
        energy += bodypart[3] * 80;
        energy += bodypart[4] * 150;
        energy += bodypart[5] * 250;
        energy += bodypart[6] * 600;
        energy += bodypart[7] * 10;
        return energy;
    }

}

function AddList(list: any[], num: number, type: any) {
    for (let i = 0; i < num; i++) {
        list.push(type)
    }
    return list
}

