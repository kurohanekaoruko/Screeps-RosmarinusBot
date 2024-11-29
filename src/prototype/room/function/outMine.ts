import { RoleLevelData, RoleData } from '@/constant/CreepConstant';


/** 外矿采集模块 */
export default class OutMine extends Room {
    outMine() {
        this.EnergyMine();
        this.LookHighWay();
        this.PowerMine();
        this.DepositMine();
    }

    EnergyMine() { // 能量矿
        if (Game.time % 10) return;
        const Mem = global.BotMem('outmine', this.name, 'energy');
        if (!Mem || !Mem.length) return;
        // 孵化任务数统计
        global.SpawnMissionNum[this.name] = this.getSpawnMissionAmount() || {};
        for (const roomName of Mem) {
            const targetRoom = Game.rooms[roomName];
            const lv = this.getEffectiveRoomLevel();

            if (!targetRoom) {
                outScoutSpawn(this, roomName);    // 侦查
                continue;    // 没有房间视野不生成
            }

            if(Game.time % 100 == 0 && targetRoom.memory['road']?.length > 0) {
                for(const road of targetRoom.memory['road']) {
                    const x = Math.floor(road / 100);
                    const y = road % 100;
                    const pos = new RoomPosition(x, y, roomName);
                    if (pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType == STRUCTURE_ROAD)) continue;
                    if (pos.lookFor(LOOK_CONSTRUCTION_SITES).length > 0) continue;
                    targetRoom.createConstructionSite(pos, STRUCTURE_ROAD);
                }
            }

            const sourceNum = targetRoom.source?.length ?? 0;
            if (sourceNum == 0) continue;

            const hostiles = targetRoom.find(FIND_HOSTILE_CREEPS, {
                filter: (creep) => (
                    creep.owner.username === 'Invader' ||
                    creep.owner.username === 'Source Keeper' ||
                    creep.getActiveBodyparts(ATTACK) > 0 ||
                    creep.getActiveBodyparts(RANGED_ATTACK) > 0
                )
            });

            if (outDefendSpawn(this, targetRoom, lv, hostiles)) continue;    // 防御

            if (hostiles.length > 0) continue;    // 有带攻击组件的敌人时不生成

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
        if (!outminePower && !outmineDeposit) return;
        // 间隔
        const lookInterval = 10;
        if (Game.time % lookInterval > 1) return;
        // 监控列表
        const lookList = global.BotMem('outmine', this.name, 'highway');
        if (lookList.length == 0) return;
        // 观察
        if (Game.time % lookInterval == 0) {
            if (!this.observer) return;
            // 观察编号
            const lookIndex = Math.floor(Game.time / lookInterval) % lookList.length;
            const roomName = lookList[lookIndex];
            if (!Game.rooms[roomName]) this.observer.observeRoom(roomName);
            return;
        }
        // 处理
        for(const roomName of lookList) {
            const room = Game.rooms[roomName];
            if (!room) continue;
            if (!this.memory['powerMine']) this.memory['powerMine'] = {};
            if (!this.memory['depositMine']) this.memory['depositMine'] = {};

            // power
            if (outminePower && !this.memory['powerMine'][roomName]) {
                let P_num = PowerBankCheck(room);
                if (P_num) {
                    this.memory['powerMine'][roomName] = P_num;
                    console.log(`在 ${roomName} 发现 PowerBank, 已加入开采队列。`);
                }
            } else if (outminePower && this.memory['powerMine'][roomName]) {
                const powerBank = room.powerBank?.[0] ?? room.find(FIND_STRUCTURES, {
                    filter: (structure) => structure.structureType === STRUCTURE_POWER_BANK
                })[0];
                if (!powerBank) delete this.memory['powerMine'][roomName];
            }

            // deposit
            if (outmineDeposit && !this.memory['depositMine'][roomName]) {
                let D_num = DepositCheck(room);
                if (D_num && D_num.length > 0) {
                    this.memory['depositMine'][roomName] = D_num;
                    console.log(`在 ${roomName} 发现 Deposit, 已加入开采队列。`);
                }
            } else if (outmineDeposit && this.memory['depositMine'][roomName]) {
                let D_num = DepositCheck(room);
                if (D_num && D_num.length > 0 && D_num.some((num) => num > 0)) {
                    this.memory['depositMine'][roomName] = D_num;
                } else {
                    delete this.memory['depositMine'][roomName];
                }
            }
        }
    }

    PowerMine() {
        if (Game.time % 10 != 1) return;
        const roomList = this.memory['powerMine'];
        if (!roomList || Object.keys(roomList).length == 0) return;

        // 孵化任务数统计
        global.SpawnMissionNum[this.name] = this.getSpawnMissionAmount() || {};
        
        for (const roomName in roomList) {
            const room = Game.rooms[roomName];

            const powerBank = room?.powerBank?.[0] ?? room?.find(FIND_STRUCTURES, {
                filter: (structure) => structure.structureType === STRUCTURE_POWER_BANK
            })[0];

            let pa: Creep[], ph: Creep[];
            let P_num = roomList[roomName];
            if (!powerBank || powerBank.hits > 300000) {
                pa = _.filter(Game.creeps, (creep) => creep.memory.role == 'power-attack' &&
                            creep.memory.targetRoom == roomName && (creep.spawning || creep.ticksToLive > 150));
                ph = _.filter(Game.creeps, (creep) => creep.memory.role == 'power-heal' &&
                                creep.memory.targetRoom == roomName && (creep.spawning || creep.ticksToLive > 150));
            } else {
                pa = _.filter(Game.creeps, (c) => c.memory.role == 'power-attack' && c.memory.targetRoom == roomName);
                ph = _.filter(Game.creeps, (c) => c.memory.role == 'power-heal' && c.memory.targetRoom == roomName);
                P_num = 1;
            }
            if (pa.length + (global.SpawnMissionNum[this.name]['power-attack']||0) < P_num) {
                const memory = { homeRoom: this.name, targetRoom: roomName } as CreepMemory;
                this.SpawnMissionAdd('PA', [], -1, 'power-attack', memory);
            }
            if (ph.length + (global.SpawnMissionNum[this.name]['power-heal']||0) < P_num) {
                const memory = { homeRoom: this.name, targetRoom: roomName } as CreepMemory;
                this.SpawnMissionAdd('PH', [], -1, 'power-heal', memory);
            }
            
            if (!room) continue;

            if (powerBank && powerBank.hits < powerBank.hitsMax / (P_num==1?4:2)) {
                const pc = _.filter(Game.creeps, (creep) => creep.memory.role == 'power-carry' &&
                                creep.memory.targetRoom == roomName && (creep.spawning || creep.ticksToLive > 150));
                if (pa.length < 1 && ph.length < 1) continue;
                const memory = { homeRoom: this.name, targetRoom: roomName };
                for (let i = pc.length + (global.SpawnMissionNum[this.name]['power-carry']||0);
                         i < (powerBank.power / 1250); i++) {
                    this.SpawnMissionAdd('PC', [], -1, 'power-carry', memory as any)
                }
            }
        }
    }

    DepositMine(){
        if (Game.time % 10 != 1) return;
        const roomList = this.memory['depositMine'];
        if (!roomList || Object.keys(roomList).length == 0) return;

        

        // 孵化任务数统计
        global.SpawnMissionNum[this.name] = this.getSpawnMissionAmount() || {};

        for (const roomName in roomList) {
            const room = Game.rooms[roomName];
            if (room) {
                const deposits = room.deposit ?? room.find(FIND_DEPOSITS);
                if (!deposits || deposits.length == 0 || !deposits.some((d) => d.lastCooldown < 120)) {
                    delete this.memory['depositMine'][roomName];
                    break;
                }
                for (let i = 0; i < deposits.length; i++) {
                    if (deposits[i].lastCooldown < 120) continue;
                    this.memory['depositMine'][roomName][i] = 0;
                    continue;
                }
            }
            const D_num = roomList[roomName];
            for (let i = 0; i < D_num.length; i++) {
                if (D_num[i] <= 0) continue;
                const dh = _.filter(Game.creeps, (c: any) => c.memory.role == 'deposit-harvest' &&
                            c.memory.depositIndex == i && c.memory.targetRoom == roomName &&
                            (c.spawning || c.ticksToLive > 200));
                if(dh.length + (global.SpawnMissionNum[this.name]['deposit-harvest']||0) < D_num[i]) {
                    const memory = { homeRoom: this.name, targetRoom: roomName, depositIndex: i} as any;
                    this.SpawnMissionAdd('DH', [], -1, 'deposit-harvest', memory);
                }
                const dt = _.filter(Game.creeps, (c) => c.memory.role == 'deposit-transport' && 
                            c.memory.targetRoom == roomName && (c.spawning || c.ticksToLive > 200));
                if(dt.length + (global.SpawnMissionNum[this.name]['deposit-transport']||0) < 2) {
                    const memory = { homeRoom: this.name, targetRoom: roomName } as any;
                    this.SpawnMissionAdd('DT', [], -1, 'deposit-transport', memory);
                }
            }
        }
    }
}

// 侦查
const outScoutSpawn = function (homeRoom: Room, targetRoomName: string) {
    const scouts = _.filter(Game.creeps, (creep) => creep.memory.role == 'out-scout' &&
                            creep.memory.targetRoom == targetRoomName);
    const spawnNum = global.SpawnMissionNum[homeRoom.name]['out-scout'] || 0;
    if (scouts.length + spawnNum > 0) return false;

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

    const outerDefenders = _.filter(Game.creeps, (creep) =>
                            creep.memory.role == 'out-defend' &&
                            creep.memory.targetRoom == targetRoom.name);
    const outerInvaders = _.filter(Game.creeps, (creep) => 
                            creep.memory.role == 'out-invader' &&
                            creep.memory.targetRoom == targetRoom.name);

    let role: string;
    let bodys: number[];
    let memory: any;
    let name: string;
    let level: number;

    if(hostiles.length > 0) {
        const spawnNum = global.SpawnMissionNum[homeRoom.name]['out-defend'] || 0;
        if (outerDefenders.length + spawnNum >= 1) return false;
        role = 'out-defend';
        bodys = DynamicBodys(role, lv);
        memory = { homeRoom: homeRoom.name, targetRoom: targetRoom.name };
        name = 'OD';
        level = RoleData[role].level;
    }
    if(invaderCore.length > 0) {
        const spawnNum = global.SpawnMissionNum[homeRoom.name]['out-invader'] || 0;
        if (outerInvaders.length + spawnNum >= 2) return false;
        role = 'out-invader';
        bodys = DynamicBodys(role, lv);
        memory = { homeRoom: homeRoom.name, targetRoom: targetRoom.name };
        name = 'OI';
        level = RoleData[role].level;
    }

    if(!bodys || !memory || !name) return false;
    homeRoom.SpawnMissionAdd(name, bodys, level, role, memory);
    return true;
}

// 采集
const outHarvesterSpawn = function (homeRoom: Room, targetRoom: Room, sourceNum: number) {
    const outerHarvesters = _.filter(Game.creeps, (creep) => 
            creep.memory.role == 'out-harvest' && creep.memory.targetRoom == targetRoom.name);
    const spawnNum = global.SpawnMissionNum[homeRoom.name]['out-harvest'] || 0;
    if (outerHarvesters.length + spawnNum >= sourceNum) return false; 

    const memory = { homeRoom: homeRoom.name, targetRoom: targetRoom.name } as CreepMemory;
    homeRoom.SpawnMissionAdd('OH', [], -1, 'out-harvest', memory);
    return true;
}

// 搬运
const outCarrySpawn = function (homeRoom: Room, targetRoom: Room, num: number) {
    const outerCarry = _.filter(Game.creeps, (creep) => (creep.memory.role == 'out-carry') &&
        creep.memory.targetRoom == targetRoom.name && creep.memory.homeRoom == homeRoom.name);
    const outerCar = _.filter(Game.creeps, (creep) => (creep.memory.role == 'out-car') &&
        creep.memory.targetRoom == targetRoom.name && creep.memory.homeRoom == homeRoom.name);
    
    const spawnCarryNum = global.SpawnMissionNum[homeRoom.name]['out-carry'] || 0;
    const spawnCarNum = global.SpawnMissionNum[homeRoom.name]['out-car'] || 0;

    if (outerCar.length + spawnCarNum == 0) {
        const role = 'out-car';
        const memory = { homeRoom: homeRoom.name, targetRoom: targetRoom.name } as CreepMemory;
        homeRoom.SpawnMissionAdd('OC', [], -1, role, memory);
        return true;
    }

    if (outerCarry.length + spawnCarryNum < num) {
        const role = 'out-carry';
        const memory = { homeRoom: homeRoom.name, targetRoom: targetRoom.name } as CreepMemory;
        homeRoom.SpawnMissionAdd('OC', [], -1, role, memory);
        return true;
    }
    
    return false;
}

// 预定
const outReserverSpawn = function (homeRoom: Room, targetRoom: Room) {
    if (!targetRoom.controller) return false;
    if(Game.rooms[homeRoom.name].controller.level < 4) return false;

    if (targetRoom.controller.reservation &&
        targetRoom.controller.reservation.username == homeRoom.controller.owner.username &&
        targetRoom.controller.reservation.ticksToEnd > 1000) return false;

    const outerReservers = _.filter(Game.creeps, (creep) => creep.memory.role == 'out-claim' &&
                                    creep.memory.targetRoom == targetRoom.name);
    const spawnNum = global.SpawnMissionNum[homeRoom.name]['out-claim'] || 0;
    if (outerReservers.length + spawnNum >= 1) return false;

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

    const outerBuilder = _.filter(Game.creeps, (creep) => creep.memory.role == 'out-build' &&
                                    creep.memory.targetRoom == targetRoom.name);
    const spawnNum = global.SpawnMissionNum[homeRoom.name]['out-build'] || 0;
    if (outerBuilder.length + spawnNum >= 1) return false;
    
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
    const powerBank = room.powerBank?.[0] ?? room.find(FIND_STRUCTURES, {
        filter: (s) => (s.hits >= s.hitsMax && s.structureType === STRUCTURE_POWER_BANK)
    })[0] as StructurePowerBank;

    if (!powerBank || powerBank.power < 1000) return 0;
    if (powerBank.hits < powerBank.hitsMax) return 0;

    const pos = powerBank.pos;
    const terrain = new Room.Terrain(room.name);
    let num = 0;
    [
        [pos.x-1, pos.y-1], [pos.x, pos.y-1], [pos.x+1, pos.y-1],
        [pos.x-1, pos.y], [pos.x+1, pos.y],
        [pos.x-1, pos.y+1], [pos.x, pos.y+1], [pos.x+1, pos.y+1],
    ].forEach((p) => {
        if (terrain.get(p[0], p[1]) != TERRAIN_MASK_WALL) num++;
    })

    if (!num) return 0;

    num = Math.min(num, 3);

    if (powerBank.ticksToDecay > (2e6 / (600 * num) + 500)) return num;
    else return 0;
}

const DepositCheck = function (room: Room) {
    const hostiles = room.find(FIND_HOSTILE_CREEPS, {
        filter: (creep) => creep.getActiveBodyparts(ATTACK) > 0 ||
                           creep.getActiveBodyparts(RANGED_ATTACK) > 0
    });
    if (hostiles.length > 0) return null;

    const deposits = room.deposit ?? room.find(FIND_DEPOSITS);

    if (!deposits || deposits.length === 0) return null;

    let D_num = [];

    for (const deposit of deposits) {
        if (deposit.lastCooldown > 100) {
            D_num.push(0);
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
            D_num.push(0);
            continue;
        }

        D_num.push(num);
    }

    return D_num;
}