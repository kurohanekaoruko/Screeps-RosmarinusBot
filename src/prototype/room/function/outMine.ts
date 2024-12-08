import { RoleLevelData, RoleData } from '@/constant/CreepConstant';
import { decompress } from '@/utils';

// 过道观察间隔
const LookInterval = 10;
// 沉积物最大冷却
const DepositMaxCooldown = 120;
// 最小power数量限制
const PowerMinAmount = 2000;


/** 外矿采集模块 */
export default class OutMine extends Room {
    outMine() {
        this.EnergyMine();
        this.LookHighWay();
        this.PowerMine();
        this.DepositMine();
    }

    EnergyMine() { // 能量矿
        if (Game.time % 10 != 1) return;
        const Mem = global.BotMem('outmine', this.name, 'energy');
        if (!Mem || !Mem.length) return;
        // 孵化任务数统计
        global.SpawnMissionNum[this.name] = this.getSpawnMissionAmount() || {};
        for (const roomName of Mem) {
            const targetRoom = Game.rooms[roomName];
            
            if (!targetRoom) {
                scoutSpawn(this, roomName);    // 侦查
                continue;    // 没有房间视野不生成
            }

            if(Game.time % 100 == 50 && targetRoom.memory['road']?.length > 0) {
                for(const road of targetRoom.memory['road']) {
                    const [x, y] = decompress(road);
                    const pos = new RoomPosition(x, y, roomName);
                    if (pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType == STRUCTURE_ROAD)) continue;
                    if (pos.lookFor(LOOK_CONSTRUCTION_SITES).length > 0) continue;
                    targetRoom.createConstructionSite(pos, STRUCTURE_ROAD);
                }
            }

            const sourceNum = targetRoom.source?.length || targetRoom.find(FIND_SOURCES).length || 0;
            if (sourceNum == 0) continue;

            const hostiles = targetRoom.find(FIND_HOSTILE_CREEPS, {
                filter: (creep) => (
                    (creep.owner.username === 'Invader' ||
                    creep.owner.username === 'Source Keeper' ||
                    creep.getActiveBodyparts(ATTACK) > 0 ||
                    creep.getActiveBodyparts(RANGED_ATTACK) > 0) &&
                    !Memory['whitelist']?.includes(creep.owner.username)
                )
            });

            const lv = this.getEffectiveRoomLevel();

            // 六级以上才防御外矿
            if (this.level >= 6 && outDefendSpawn(this, targetRoom, lv, hostiles)) continue;

            // 有带攻击组件的敌人时不孵化
            if (hostiles.length > 0) continue;

            const controller = targetRoom.controller;
            const myUserName = this.controller.owner.username;
            if (controller?.owner) continue;

            outReserverSpawn(this, targetRoom);    // 预定

            if (controller.reservation && controller.reservation.username !== myUserName) continue;

            outHarvesterSpawn(this, targetRoom, sourceNum);    // 采集  
            outCarrySpawn(this, targetRoom, sourceNum);    // 搬运
            outBuilderSpawn(this, targetRoom);    // 建造
        }
    }

    // 观察过道
    LookHighWay() {
        const outminePower = global.BotMem('rooms', this.name, 'outminePower');
        const outmineDeposit = global.BotMem('rooms', this.name, 'outmineDeposit');
        // 没开启自动挖就不找
        if (!outminePower && !outmineDeposit) return;

        if (Game.time % LookInterval > 1) return;
        // 监控列表
        let lookList = global.BotMem('outmine', this.name, 'highway');
        if (lookList.length == 0) return;
        // 观察
        if (Game.time % LookInterval == 0) {
            if (!this.observer) return;
            // 观察编号
            let lookIndex = Math.floor(Game.time / LookInterval) % lookList.length;
            const roomName = lookList[lookIndex];
            // 没有视野才看
            if (!Game.rooms[roomName])
                this.observer.observeRoom(roomName);
            return;
        }
        // 处理
        for(const roomName of lookList) {
            if (/^[EW]\d*[1-9][NS]\d*[1-9]$/.test(roomName)) continue;

            const room = Game.rooms[roomName];
            if (!room) continue;    // 没有视野不处理

            if (!this.memory['powerMine']) this.memory['powerMine'] = {};
            if (!this.memory['depositMine']) this.memory['depositMine'] = {};
            
            // power
            if (outminePower && !this.memory['powerMine'][roomName]) {
                let P_num = PowerBankCheck(room);
                if (P_num) {
                    this.memory['powerMine'][roomName] = {
                        creep: P_num,      // creep队伍数
                        max: 5,            // 最大孵化数量
                        count: 0,          // 已孵化数量
                        boostLevel: 0,     // 强化等级
                    }
                    console.log(`在 ${roomName} 发现 PowerBank, 已加入开采队列。`);
                    console.log(`将从 ${this.name} 派出总共 ${P_num} 数量的采集队。`);
                }
            } else if (outminePower && this.memory['powerMine'][roomName]) {
                const powerBank = room.powerBank?.[0] ?? room.find(FIND_STRUCTURES, {
                    filter: (structure) => structure.structureType === STRUCTURE_POWER_BANK
                })[0];
                if (!powerBank) {
                    delete this.memory['powerMine'][roomName];
                    console.log(`${roomName} 的 PowerBank 已耗尽, 已移出开采队列。`);
                }
            }

            // deposit
            if (outmineDeposit && !this.memory['depositMine'][roomName]) {
                let D_num = DepositCheck(room);
                if (D_num > 0) {
                    this.memory['depositMine'][roomName] = D_num;
                    console.log(`在 ${roomName} 发现 Deposit, 已加入开采队列。`);
                    console.log(`将从 ${this.name} 派出总共 ${D_num} 数量的采集队。`);
                }
            } else if (outmineDeposit && this.memory['depositMine'][roomName]) {
                let D_num = DepositCheck(room);
                if (D_num > 0) {
                    this.memory['depositMine'][roomName] = D_num;
                } else {
                    delete this.memory['depositMine'][roomName];
                    console.log(`${roomName} 的 Deposit 已耗尽, 已移出开采队列。`);
                }
            }
        }
    }

    PowerMine() {
        if (Game.time % LookInterval != 1) return;
        const powerMines = this.memory['powerMine'];
        if (!powerMines || Object.keys(powerMines).length == 0) return;

        // 孵化任务数统计
        global.SpawnMissionNum[this.name] = this.getSpawnMissionAmount() || {};
        
        for (const targetRoom in powerMines) {
            const room = Game.rooms[targetRoom];
            const powerBank = room?.powerBank?.[0] ?? room?.find(FIND_STRUCTURES, {
                filter: (structure) => structure.structureType === STRUCTURE_POWER_BANK
            })[0];
            
            // 统计以targetRoom为工作目标的所有role情况
            const CreepByTargetRoom = getCreepByTargetRoom(targetRoom);
            let pa = 0, ph = 0;
            let mineData = powerMines[targetRoom];
            // 数量未达到上限才考虑孵化
            if (mineData.count < mineData.max) {
                if (!powerBank || powerBank.hits > 300000) {
                    pa = (CreepByTargetRoom['power-attack'] || [])
                        .filter((c: any) => c.spawning || c.ticksToLive > 100).length;
                    ph = (CreepByTargetRoom['power-heal'] || [])
                        .filter((c: any) => c.spawning || c.ticksToLive > 100).length;
                } else {
                    pa = (CreepByTargetRoom['power-attack'] || []).length;
                    ph = (CreepByTargetRoom['power-heal'] || []).length;
                    mineData.creep = 1;
                }
                let panum = pa + (global.SpawnMissionNum[this.name]['power-attack']||0);
                let phnum = ph + (global.SpawnMissionNum[this.name]['power-heal']||0);
                // 不能超过设定的同时工作队伍数
                for (let i = Math.min(panum, phnum); i < mineData.creep; i++) {
                    if (panum < mineData.creep) { 
                        const memory = { homeRoom: this.name, targetRoom: targetRoom, boostLevel: mineData.boostLevel } as CreepMemory;
                        this.SpawnMissionAdd('PA', [], -1, 'power-attack', memory);
                        panum++;
                    }
                    if (phnum < mineData.creep) { 
                        const memory = { homeRoom: this.name, targetRoom: targetRoom, boostLevel: mineData.boostLevel } as CreepMemory;
                        this.SpawnMissionAdd('PH', [], -1, 'power-heal', memory);
                        phnum++;
                    }
                    mineData.count += 1;
                    if (mineData.count >= mineData.max) break;
                }
            }

            if (!room) continue;
            if (!powerBank) continue;
            const maxPc = powerBank.power / 1250;
            // 累积孵化数量到达指定值就不再孵化
            if (mineData.carry >= maxPc) continue;
            if (powerBank.hits < powerBank.hitsMax / (mineData.creep==1?4:2)) {
                const pc = (CreepByTargetRoom['power-carry'] || [])
                            .filter((c: any) => c.spawning || c.ticksToLive > 150).length;
                if (pa < 1 && ph < 1) continue;
                const memory = { homeRoom: this.name, targetRoom: targetRoom };
                const pcnum = pc + (global.SpawnMissionNum[this.name]['power-carry']||0);
                for (let i = pcnum; i < maxPc; i++) {
                    this.SpawnMissionAdd('PC', [], -1, 'power-carry', memory as any)
                    mineData.carry = (mineData.carry || 0) + 1
                }
            }
        }
    }

    DepositMine(){
        if (Game.time % LookInterval != 1) return;
        const roomList = this.memory['depositMine'];
        if (!roomList || Object.keys(roomList).length == 0) return;

        // 孵化任务数统计
        global.SpawnMissionNum[this.name] = this.getSpawnMissionAmount() || {};
        for (const targetRoom in roomList) {
            const D_num = roomList[targetRoom];
            if (!D_num || D_num <= 0) continue;
            // 统计以targetRoom为工作目标的所有role情况
            const CreepByTargetRoom = getCreepByTargetRoom(targetRoom);
            const dh = (CreepByTargetRoom['deposit-harvest'] || [])
                        .filter((c: any) => c.spawning || c.ticksToLive > 200).length;
            const dhnum = dh + (global.SpawnMissionNum[this.name]['deposit-harvest']||0)
            if(dhnum < D_num) {
                const memory = { homeRoom: this.name, targetRoom: targetRoom } as any;
                this.SpawnMissionAdd('DH', [], -1, 'deposit-harvest', memory);
            }
            const dt = (CreepByTargetRoom['deposit-transfer'] || [])
                        .filter((c: any) => c.spawning || c.ticksToLive > 150).length;
            const dtnum = dt + (global.SpawnMissionNum[this.name]['deposit-transfer']||0)
            if(dtnum < D_num / 2) {
                const memory = { homeRoom: this.name, targetRoom: targetRoom } as any;
                this.SpawnMissionAdd('DT', [], -1, 'deposit-transfer', memory);
            }
        }
    }
}

// 侦查
const scoutSpawn = function (homeRoom: Room, targetRoomName: string) {
    const CreepByTargetRoom = getCreepByTargetRoom(targetRoomName);
    const scouts = (CreepByTargetRoom['out-scout'] || []).length;
    const spawnNum = global.SpawnMissionNum[homeRoom.name]['out-scout'] || 0;
    if (scouts + spawnNum > 0) return false;

    const memory = { homeRoom: homeRoom.name, targetRoom: targetRoomName } as CreepMemory;
    homeRoom.SpawnMissionAdd('OS', [0,0,1,0,0,0,0,0], RoleData['out-scout'].level, 'out-scout', memory);
    return true;
}

// 防御
const outDefendSpawn = function (homeRoom: Room, targetRoom: Room, lv: number, hostiles: Creep[]) {
    const invaderCore = targetRoom.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_INVADER_CORE
    });

    if (invaderCore.length === 0 && hostiles.length === 0) return false;

    const CreepByTargetRoom = getCreepByTargetRoom(targetRoom.name);
    const outerDefenders = (CreepByTargetRoom['out-defend'] || []).length;
    const outerInvaders = (CreepByTargetRoom['out-invader'] || []).length;

    let role: string;
    let bodys: number[];
    let memory: any;
    let name: string;
    let level: number;

    if(hostiles.length > 0) {
        const spawnNum = global.SpawnMissionNum[homeRoom.name]['out-defend'] || 0;
        if (outerDefenders + spawnNum >= 1) return false;
        role = 'out-defend';
        bodys = DynamicBodys(role, lv);
        memory = { homeRoom: homeRoom.name, targetRoom: targetRoom.name };
        name = 'OD';
        level = RoleData[role].level;
        if(!bodys || !memory || !level) return false;
        homeRoom.SpawnMissionAdd(name, bodys, level, role, memory);
        return true;
    }
    if(invaderCore.length > 0) {
        const spawnNum = global.SpawnMissionNum[homeRoom.name]['out-invader'] || 0;
        if (outerInvaders + spawnNum >= 2) return false;
        role = 'out-invader';
        bodys = DynamicBodys(role, lv);
        memory = { homeRoom: homeRoom.name, targetRoom: targetRoom.name };
        name = 'OI';
        level = RoleData[role].level;
        if(!bodys || !memory || !level) return false;
        homeRoom.SpawnMissionAdd(name, bodys, level, role, memory);
        return true;
    }
    
    return false;
}

// 采集
const outHarvesterSpawn = function (homeRoom: Room, targetRoom: Room, sourceNum: number) {
    const CreepByTargetRoom = getCreepByTargetRoom(targetRoom.name);
    const outerHarvesters = (CreepByTargetRoom['out-harvest'] || []).length;
    const spawnNum = global.SpawnMissionNum[homeRoom.name]['out-harvest'] || 0;
    if (outerHarvesters + spawnNum >= sourceNum) return false; 

    const memory = { homeRoom: homeRoom.name, targetRoom: targetRoom.name } as CreepMemory;
    homeRoom.SpawnMissionAdd('OH', [], -1, 'out-harvest', memory);
    return true;
}

// 搬运
const outCarrySpawn = function (homeRoom: Room, targetRoom: Room, num: number) {
    const CreepByTargetRoom = getCreepByTargetRoom(targetRoom.name);
    const outerCarry = (CreepByTargetRoom['out-carry'] || [])
                        .filter((c: any) => c.homeRoom == homeRoom.name).length;
    const outerCar = (CreepByTargetRoom['out-car'] || [])
                        .filter((c: any) => c.homeRoom == homeRoom.name).length;
    
    const spawnCarryNum = global.SpawnMissionNum[homeRoom.name]['out-carry'] || 0;
    const spawnCarNum = global.SpawnMissionNum[homeRoom.name]['out-car'] || 0;

    if (outerCar + spawnCarNum == 0) {
        const role = 'out-car';
        const memory = { homeRoom: homeRoom.name, targetRoom: targetRoom.name } as CreepMemory;
        homeRoom.SpawnMissionAdd('OC', [], -1, role, memory);
        return true;
    }

    if (outerCarry + spawnCarryNum < 1) {
        const role = 'out-carry';
        const memory = { homeRoom: homeRoom.name, targetRoom: targetRoom.name } as CreepMemory;
        homeRoom.SpawnMissionAdd('OC', [], -1, role, memory);
        return true;
    }
    
    return false;
}

// 预定
const outReserverSpawn = function (homeRoom: Room, targetRoom: Room) {
    if (!targetRoom.controller || targetRoom.controller.my) return false;
    if(Game.rooms[homeRoom.name].controller.level < 4) return false;

    if (targetRoom.controller.reservation &&
        targetRoom.controller.reservation.username == homeRoom.controller.owner.username &&
        targetRoom.controller.reservation.ticksToEnd > 1000) return false;

    const CreepByTargetRoom = getCreepByTargetRoom(targetRoom.name);
    const outerReservers = (CreepByTargetRoom['out-claim'] || []).length;

    const spawnNum = global.SpawnMissionNum[homeRoom.name]['out-claim'] || 0;
    if (outerReservers + spawnNum >= 1) return false;
    console.log('预定', outerReservers + spawnNum);

    const memory = { homeRoom: homeRoom.name, targetRoom: targetRoom.name } as CreepMemory;
    homeRoom.SpawnMissionAdd('OCL', [], -1, 'out-claim', memory);
    return true;
}

// 建造
const outBuilderSpawn = function (homeRoom: Room, targetRoom: Room) {
    const constructionSite = targetRoom.find(FIND_CONSTRUCTION_SITES, {
        filter: (site) => site.structureType === STRUCTURE_ROAD
    });
    if (constructionSite.length === 0) return false;

    const CreepByTargetRoom = getCreepByTargetRoom(targetRoom.name);
    const outerBuilder = (CreepByTargetRoom['out-build'] || []).length;

    const spawnNum = global.SpawnMissionNum[homeRoom.name]['out-build'] || 0;
    if (outerBuilder + spawnNum >= 1) return false;
    
    const memory = { homeRoom: homeRoom.name, targetRoom: targetRoom.name } as CreepMemory;
    homeRoom.SpawnMissionAdd('OB', [], -1, 'out-build', memory);
    return true;
}

const DynamicBodys = function (role: string, lv: number): number[] {
    const bodypart = RoleData[role].adaption ?
                     RoleLevelData[role][lv].bodypart :
                     RoleData[role].ability;
    return bodypart;
}

const PowerBankCheck = function (room: Room) {
    const powerBank = room.find(FIND_STRUCTURES, {
        filter: (s) => (s.hits >= s.hitsMax && s.structureType === STRUCTURE_POWER_BANK)
    })[0] as StructurePowerBank;

    if (!powerBank || powerBank.power < PowerMinAmount) return 0;
    if (powerBank.hits < powerBank.hitsMax) return 0;

    const pos = powerBank.pos;
    const terrain = new Room.Terrain(room.name);
    let num = 0;
    [
        [pos.x-1, pos.y-1], [pos.x, pos.y-1], [pos.x+1, pos.y-1],
        [pos.x-1, pos.y], [pos.x+1, pos.y],
        [pos.x-1, pos.y+1], [pos.x, pos.y+1], [pos.x+1, pos.y+1],
    ].forEach((p) => {
        if (p[0] <= 1 || p[0] >= 48 || p[1] <= 1 || p[1] >= 48) return;
        if (terrain.get(p[0], p[1]) != TERRAIN_MASK_WALL) num++;
    })

    if (!num) return 0;

    num = Math.min(num, 3);

    if (powerBank.ticksToDecay > (2e6 / (600 * num) + 500)) return num;
    else return 0;
}

const DepositCheck = function (room: Room) {
    if (!room) return 0;

    const deposits = room.find(FIND_DEPOSITS);

    if (!deposits || deposits.length === 0) return 0;

    let D_num = 0;

    for (const deposit of deposits) {
        if (deposit.lastCooldown >= DepositMaxCooldown) {
            continue;
        }
        const pos = deposit.pos;
        const terrain = new Room.Terrain(room.name);

        let num = 0;
        [
            [pos.x-1, pos.y-1], [pos.x, pos.y-1], [pos.x+1, pos.y-1],
            [pos.x-1, pos.y], [pos.x+1, pos.y],
            [pos.x-1, pos.y+1], [pos.x, pos.y+1], [pos.x+1, pos.y+1],
        ].forEach((p) => {
            if (terrain.get(p[0], p[1]) != TERRAIN_MASK_WALL) num++;
        })
        if (num == 0) {
            continue;
        }
        if (!room.memory) room.memory = {} as any;
        if (!room.memory['depositMine']) room.memory['depositMine'] = {};
        room.memory['depositMine'][deposit.id] = num;

        D_num += Math.min(num, 3);
    }

    for (const id in (room.memory['depositMine']||{})) {
        if (Game.getObjectById(id)) continue;
        delete room.memory['depositMine'][id];
    }

    return D_num;
}

// 获取到指定房间工作creep数量, 根据role分组
const getCreepByTargetRoom = function (targetRoom: string) {
    if (global.CreepByTargetRoom &&
        global.CreepByTargetRoom.time === Game.time) {
        // 如果当前tick已经统计过，则直接返回
        return global.CreepByTargetRoom[targetRoom] || {};
    } else {
        // 如果当前tick没有统计过，则重新统计
        global.CreepByTargetRoom = { time: Game.time };
        for (const name in Game.creeps) {
            const creep = Game.creeps[name];
            const role = creep.memory.role;
            const targetRoom = creep.memory.targetRoom;
            if (!role || !targetRoom) continue;
            if (!global.CreepByTargetRoom[targetRoom]) {
                global.CreepByTargetRoom[targetRoom] = {};
            }
            if (!global.CreepByTargetRoom[targetRoom][role]) {
                global.CreepByTargetRoom[targetRoom][role] = [];
            }
            global.CreepByTargetRoom[targetRoom][role].push({
                ticksToLive: creep.ticksToLive,
                spawning: creep.spawning,
                homeRoom: creep.memory.homeRoom,
            });
        }
        return global.CreepByTargetRoom[targetRoom] || {};
    }
}