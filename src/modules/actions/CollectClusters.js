import { RoleLevelData, RoleData } from '@/constant/CreepConfig';

// 资源采集集群
const CollectClusters = {
    tick: function () {
        if (Game.time % 10 != 0) return;
        const flags = Game.flags;

        for (const flagName in flags) {
            // 匹配flag: collect-房间名-数量
            const match = flagName.match(/^collect[-_#/ ]([EW]\d+[NS]\d+)[-_#/ ](\d+)(?:[-_#/ ].*)?$/);
            if (!match) continue;
            const [_, room, num] = match;

            const flag = flags[flagName];

            const homeRoomName = room;
            const carrierNum = num;
            const targetRoom = flag.pos.roomName;

            const isCenterRoom = /^[EW]\d*[456][NS]\d*[456]$/.test(targetRoom); // 中间房间
            const isNotHighway = /^[EW]\d*[1-9][NS]\d*[1-9]$/.test(targetRoom); // 非公路房间
            if(!isCenterRoom && isNotHighway) { // 一般房间
                OuterEnergyCollect(homeRoomName, targetRoom, carrierNum);   // 采集能量
            }
            else if(isCenterRoom) {    // 中间房间
                CenterRoomCollect(homeRoomName, targetRoom, carrierNum);
            }
            else if(!isNotHighway) {    // 公路房间
                OuterDepositCollect(homeRoomName, targetRoom);   // 采集资源
            }
        }
    }
}

const CenterRoomCollect = function (homeRoomName, targetRoomName, num) {
    const targetRoom = Game.rooms[targetRoomName];
    const homeRoom = Game.rooms[homeRoomName];
    const lv = homeRoom.getEffectiveRoomLevel();

    if(lv < 6) return;

    if (global.SpawnQueue[homeRoomName].length > 0) return; // 孵化队列有任务不生成

    const out_attack = Object.values(Game.creeps).filter((creep) => creep.memory.role == 'out-attack' && creep.memory.targetRoom == targetRoomName && 
                                (creep.spawning || creep.ticksToLive > 100));
    if(out_attack.length < num) {
        const bodys = DynamicBodys('out-attack', lv);
        const memory = { role: 'out-attack', type: 'main', homeRoom: homeRoomName, targetRoom: targetRoomName };
        homeRoom.SpawnQueueAdd('Outer_A', bodys, memory);
        return;
    }

    const out_harvest = Object.values(Game.creeps).filter((creep) => creep.memory.role == 'out-harvest' && creep.memory.targetRoom == targetRoomName);
    if(out_harvest.length < Math.min(num, 3)) {
        const bodys = DynamicBodys('out-harvest', lv);
        const memory = { role: 'out-harvest', type: 'main', homeRoom: homeRoomName, targetRoom: targetRoomName };
        homeRoom.SpawnQueueAdd('Outer_H', bodys, memory);
        return;
    }

    const out_carry = Object.values(Game.creeps).filter((creep) => creep.memory.role == 'out-carry' && creep.memory.targetRoom == targetRoomName);
    if(out_carry.length < num) {
        const bodys = DynamicBodys('out-carry', lv);
        const memory = { role: 'out-carry', type: 'main', homeRoom: homeRoomName, targetRoom: targetRoomName };
        homeRoom.SpawnQueueAdd('Outer_C', bodys, memory);
        return;
    }
}

const OuterDepositCollect = function (homeRoomName, targetRoomName) {
    const targetRoom = Game.rooms[targetRoomName];
    const homeRoom = Game.rooms[homeRoomName];
    const lv = homeRoom.getEffectiveRoomLevel();

    if(lv < 6) return;

    if (global.SpawnQueue[homeRoomName].length > 0) return; // 孵化队列有任务不生成

    const deposit_harvest = _.filter(Game.creeps, (creep) => creep.memory.role == 'deposit-harvest' &&
                                                            creep.memory.targetRoom == targetRoomName &&
                                                            (creep.spawning || creep.ticksToLive > 200));
    const deposit_transport = _.filter(Game.creeps, (creep) => creep.memory.role == 'deposit-transport' && 
                                                            creep.memory.targetRoom == targetRoomName &&
                                                            (creep.spawning || creep.ticksToLive > 200));

    if(deposit_harvest.length < 3) {
        const bodys = DynamicBodys('deposit-harvest', lv);
        const memory = { role: 'deposit-harvest', homeRoom: homeRoomName, targetRoom: targetRoomName };
        homeRoom.SpawnQueueAdd('Outer_DH', bodys, memory);
    }

    if(deposit_transport.length < 1) {
        const bodys = DynamicBodys('deposit-transport', lv);
        const memory = { role: 'deposit-transport', homeRoom: homeRoomName, targetRoom: targetRoomName };
        homeRoom.SpawnQueueAdd('Outer_DT', bodys, memory);
    }
}

const OuterEnergyCollect = function (homeRoomName, targetRoomName, carrierNum) {
    const targetRoom = Game.rooms[targetRoomName];
    const homeRoom = Game.rooms[homeRoomName];
    const lv = homeRoom.getEffectiveRoomLevel();

    if (global.SpawnQueue[homeRoomName]?.length > 0) return; // 孵化队列有任务不生成

    if (outScoutSpawn(homeRoom, homeRoomName, targetRoomName, targetRoom)) return;    // 侦查
    if (!targetRoom) return;    // 没有房间视野不生成

    const sourceNum = targetRoom.source?.length ?? 0;
    if (sourceNum == 0) return;

    const hostiles = targetRoom.find(FIND_HOSTILE_CREEPS, {
        filter: (creep) => (creep.owner.username === 'Invader' ||
            creep.owner.username === 'Source Keeper' ||
            creep.getActiveBodyparts(ATTACK) > 0 ||
            creep.getActiveBodyparts(RANGED_ATTACK) > 0)
    });

    if (outDefendSpawn(homeRoom, homeRoomName, targetRoomName, lv, targetRoom, hostiles)) return;    // 防御

    if (hostiles.length > 0) return;    // 有带攻击组件的敌人时不生成

    const controller = targetRoom.controller;
    const myUserName = homeRoom.controller.owner.username;
    if (controller && (controller.owner || (controller.reservation && controller.reservation.username !== myUserName))) return;

    if (outHarvesterSpawn(homeRoom, homeRoomName, targetRoomName, lv, sourceNum)) return;    // 采集  
    if (outCarrySpawn(homeRoom, homeRoomName, targetRoomName, lv, carrierNum, targetRoom)) return;    // 搬运
    if (outReserverSpawn(homeRoom, homeRoomName, targetRoomName, lv, targetRoom)) return;    // 预定
    if (outBuilderSpawn(homeRoom, homeRoomName, targetRoomName, lv, targetRoom)) return;    // 建造
}

const outScoutSpawn = function (homeRoom, homeRoomName, targetRoomName, targetRoom) {
    if (targetRoom) return false;

    const scouts = _.filter(Game.creeps, (creep) => creep.memory.role == 'out-scout' && creep.memory.targetRoom == targetRoomName);
    if (scouts.length > 0) return false;

    const bodys = [0,0,1,0,0,0,0,0];
    const memory = { role: 'out-scout', homeRoom: homeRoomName, targetRoom: targetRoomName };
    homeRoom.SpawnQueueAdd('Outer_S', bodys, memory);
    return true;
}

const outDefendSpawn = function (homeRoom, homeRoomName, targetRoomName, lv, targetRoom, hostiles) {
    const invaderCore = targetRoom.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_INVADER_CORE
    });

    if (invaderCore.length === 0 && hostiles.length === 0) return false;

    const outerDefenders = _.filter(Game.creeps, (creep) => creep.memory.role == 'out-defend' && creep.memory.targetRoom == targetRoomName);
    const outerInvaders = _.filter(Game.creeps, (creep) => creep.memory.role == 'out-invader' && creep.memory.targetRoom == targetRoomName);

    let bodys;
    let memory;
    let name;

    if(hostiles.length > 0) {
        if (outerDefenders.length >= 1) return false;
        bodys = DynamicBodys('out-defend', lv);
        memory = { role: 'out-defend', type: 'main', homeRoom: homeRoomName, targetRoom: targetRoomName };
        name = 'Outer_D';
    }
    if(invaderCore.length > 0) {
        if (outerInvaders.length >= 2) return false;
        bodys = DynamicBodys('out-invader', lv);
        memory = { role: 'out-invader', type: 'main', homeRoom: homeRoomName, targetRoom: targetRoomName };
        name = 'Outer_I';
    }

    if(!bodys || !memory || !name) return false;

    homeRoom.SpawnQueueAdd(name, bodys, memory);
    return true;
}

const outHarvesterSpawn = function (homeRoom, homeRoomName, targetRoomName, lv, sourceNum) {
    const outerHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'out-harvest' && creep.memory.targetRoom == targetRoomName);

    if (outerHarvesters.length >= sourceNum) return false; 

    const bodys = DynamicBodys('out-harvest', lv);
    const memory = { role: 'out-harvest', type: 'main', homeRoom: homeRoomName, targetRoom: targetRoomName };

    homeRoom.SpawnQueueAdd('Outer_H', bodys, memory);
    return true;
}

const outCarrySpawn = function (homeRoom, homeRoomName, targetRoomName, lv, carrierNum, targetRoom) {
    const outerCarriers = _.filter(Game.creeps, (creep) => (creep.memory.role == 'out-carry') &&
        creep.memory.targetRoom == targetRoomName && creep.memory.homeRoom == homeRoomName);
    const outerCar = _.filter(Game.creeps, (creep) => (creep.memory.role == 'out-car') &&
    creep.memory.targetRoom == targetRoomName && creep.memory.homeRoom == homeRoomName);

    if (outerCarriers.length + outerCar.length >= carrierNum) return false;

    let role = 'out-carry';
    if(outerCar.length == 0) {
        const roads = targetRoom.find(FIND_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_ROAD
        });
        role = roads.length > 0 ? 'out-car' : 'out-carry';
    }

    const bodys = DynamicBodys(role, lv);
    const memory = { role: role, type: 'main', homeRoom: homeRoomName, targetRoom: targetRoomName };

    homeRoom.SpawnQueueAdd('Outer_C', bodys, memory);
    return true;
}

const outReserverSpawn = function (homeRoom, homeRoomName, targetRoomName, lv, targetRoom) {
    if (!targetRoom.controller) return false;
    if(Game.rooms[homeRoomName].controller.level < 4) return false;

    const outerReservers = _.filter(Game.creeps, (creep) => creep.memory.role == 'out-claim' && creep.memory.targetRoom == targetRoomName);
    if (outerReservers.length >= 1) return false;

    const bodys = DynamicBodys('out-claim', lv);
    const memory = { role: 'out-claim', type: 'main', homeRoom: homeRoomName, targetRoom: targetRoomName };

    homeRoom.SpawnQueueAdd('Outer_RE', bodys, memory);
    return true;
}

const outBuilderSpawn = function (homeRoom, homeRoomName, targetRoomName, lv, targetRoom) {
    const outerBuilder = _.filter(Game.creeps, (creep) => creep.memory.role == 'out-build' && creep.memory.targetRoom == targetRoomName);

    if (outerBuilder.length >= 1) return false;
    const constructionSite = targetRoom.find(FIND_CONSTRUCTION_SITES, {
        filter: (site) => site.structureType === STRUCTURE_ROAD
    });
    
    if (constructionSite.length === 0) return false;

    const bodys = DynamicBodys('builder', lv);
    const memory = { role: 'out-build', type: 'main', homeRoom: homeRoomName, targetRoom: targetRoomName };

    homeRoom.SpawnQueueAdd('Outer_B', bodys, memory);
    return true;
}

const DynamicBodys = function (role, lv) {
    const bodypart = RoleData[role].adaption ? RoleLevelData[role][lv].bodypart : RoleData[role].ability;
    return bodypart;
}


export { CollectClusters }