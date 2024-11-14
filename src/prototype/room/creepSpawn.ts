import { RoleData, RoleLevelData } from '@/constant/CreepConfig'

/**
 * 管理creep的孵化
 */
export default class CreepSpawn extends Room {
    // 获取当前房间的creep数量, 包括队列中的
    CreepNumGet() {
        // 初始化计数对象
        global.CreepNum[this.name] = {};
        global.QueueCreepNum[this.name] = {};

        const creeps = Object.values(Game.creeps);
        if(creeps.length == 0) return;

        // 统计存活的creep
        creeps.forEach(creep => {
            if (creep.room.name !== this.name || creep.ticksToLive < creep.body.length * 3) return;
            const role = creep.memory.role;
            global.CreepNum[this.name][role] = (global.CreepNum[this.name][role] || 0) + 1;
        });

        // 统计队列中的creep
        global.SpawnQueue[this.name].forEach(({memory: {role}}) => {
            global.QueueCreepNum[this.name][role] = (global.QueueCreepNum[this.name][role] || 0) + 1;
        });
    }

    // 定期检查Creep, 将数量不足的加入孵化队列
    CheckCreeps() {
        this.CreepNumGet();
        const lv = this.level;
        const roomName = this.name;

        const spawnQueue = {}

        for(const role in RoleData) {
            const currentNum = (global.CreepNum[roomName][role] || 0) + 
                               (global.QueueCreepNum[roomName][role] || 0);
            const num = RoleData[role]['adaption'] ? RoleLevelData[role][lv]['num'] : RoleData[role]['num'];
            const result = this.RoleSpawnCheck(role, currentNum, num)
            if (result) {
                const level = RoleData[role]['level'];
                if(!spawnQueue[level]) {
                    spawnQueue[level] = [];
                }
                spawnQueue[level].push({role, home: roomName});
            }
        }

        for(const level of Object.keys(spawnQueue).sort()) {
            const queue = spawnQueue[level];
            for(const q of queue) {
                this.SpawnQueueAdd('', [], q);
            }
        }
    }
    // 检查主要角色是否需要孵化
    RoleSpawnCheck(role: string, currentNum: number, num: number) {
        const roomLevel = this.level;

        const spawnConditions = {
            'harvester': () => {
                if(this.level <= 2) {
                    return currentNum < this.source.length * 2;
                }
                return currentNum < this.source.length
            },
            'upgrader': () => {
                if(global.CreepNum[this.name]['speedup-upgrad'] > 0) return false;
                if(roomLevel == 8) {
                    return currentNum < 1 && this.controller.ticksToDowngrade < 190000;
                }
                return currentNum < num;
            },
            'transport': () => currentNum < num && this.storage,
            'manage': () => currentNum < num && this.storage && this.terminal && this.link.find(l => l.pos.inRangeTo(this.storage, 2)),
            'carrier': () => {
                if (num === 0) {
                    return currentNum < 1 && this.mineral?.mineralAmount > 0;
                }
                if(roomLevel < 3) {
                    return currentNum < num;
                }
                return currentNum < num && this.container.length > 0;
            },
            'builder': () => {
                if (!this.checkMissionInPool('build')) return false;
                return currentNum < 2;
            },
            'repair': () => {
                let maxNum = 1;
                if (this.getMissionNumInPool('walls') > 50) maxNum = 2;
                if (roomLevel < 3 || currentNum >= maxNum) return false;
                return this.checkMissionInPool('repair') || this.checkMissionInPool('walls') || this.checkMissionInPool('build') ;
            },
            'miner': () => currentNum < 1 && roomLevel >= 6 && this.extractor && this.find(FIND_MINERALS)[0]?.mineralAmount > 0,
            'har-car': () => roomLevel < 3 && currentNum < 2 && (!this.container || this.container.length < 1),
            'speedup-upgrad': () => (currentNum < num) && Game.flags['upgrad-speedup-' + this.name]
        };

        return spawnConditions[role]?.() ?? false;
    }

    // 向孵化队列中添加任务
    SpawnQueueAdd(name: string, bodys: any, memory: any) {
        global.SpawnQueue[this.name].push({name, bodys, memory});
        global.QueueCreepNum[this.name][memory.role] = (global.QueueCreepNum[this.name][memory.role] || 0) + 1;
    }
    
    // 根据队列孵化Creep
    SpawnCreeps() {
        if (global.SpawnQueue[this.name].length === 0) return;
        if (!this.spawn) return;

        const lv = this.getEffectiveRoomLevel();  // 获取当前房间的等级，如果房间扩展不足，则返回较低的等级

        this.spawn.forEach(spawn => {
            if (!spawn || spawn.spawning) return;
            // 获取孵化队列中的第一个任务
            const creepInfo = global.SpawnQueue[this.name][0];
            if (!creepInfo || !creepInfo.memory.role) {
                global.SpawnQueue[this.name].shift(); return;
            }
            // 生成creep名称
            const { role } = creepInfo.memory;
            const number = (Game.time*16+Math.floor(Math.random()*16)).toString(16).slice(-4).toUpperCase();
            const name = `${creepInfo.name||RoleData[role].code}#${number}`;
            // 如果没给bodys，则根据role和lv生成bodys
            if(!creepInfo.bodys || creepInfo.bodys.length === 0) {
                // 从配置表里获取bodypart
                let bodypart = RoleData[role]['adaption'] ? RoleLevelData[role][lv].bodypart : RoleData[role].ability;
                if(RoleData[role]['adaption'] && RoleLevelData[role][lv].upbodypart && this.controller?.isPowerEnabled) {
                    bodypart = RoleLevelData[role][lv].upbodypart;
                }
                // 如果没有，删除任务
                if(!bodypart || bodypart.length === 0) {global.SpawnQueue[this.name].shift(); return;};
                creepInfo.bodys = bodypart
            }
            // 将bodys转化为creep需要的格式
            const bodys = this.GenerateBodys(creepInfo.bodys);
            // bodys不存在，删除任务
            if (!bodys || bodys.length === 0) { global.SpawnQueue[this.name].shift(); return; };
            // 孵化creep
            if (spawn.spawnCreep(bodys, name, { memory: creepInfo.memory }) !== OK) return;
            // 删除任务
            global.SpawnQueue[this.name].shift();
            global.CreepNum[this.name][role] = (global.CreepNum[this.name][role] || 0) + 1;
            global.QueueCreepNum[this.name][role] = Math.max((global.QueueCreepNum[this.name][role] || 1) - 1, 0);
        });
    }

    // 停机检查
    ShutdownInspection() {
        if (this.level < 2) return false;

        const allEnergy = this.AllEnergy();

        const transportNum = (global.CreepNum[this.name]['transport'] || 0)
        const carrier = (global.CreepNum[this.name]['carrier'] || 0);
        const harvesterNum = (global.CreepNum[this.name]['harvester'] || 0);

        // 关键role数量为零且不足以孵化，那么紧急孵化
        if(allEnergy < this.energyCapacityAvailable * 10 || this.level < 4) {
            if((harvesterNum < 1 && this.energyAvailable < this.CalculateRoleEnergy('harvester')) ||
                (carrier < 1 && this.energyAvailable < this.CalculateRoleEnergy('carrier'))) {
                if (this.spawnEmergencyCreep('har-car')) return true;
            }
        } else {
            if(transportNum < 1 && this.energyAvailable < this.CalculateRoleEnergy('transport')) {
                if (this.spawnEmergencyCreep('transport')) return true;
            }
        }

        return false;
    }

    // 紧急孵化Creep
    spawnEmergencyCreep(role: string) {
        const currentRoleCount = global.CreepNum[this.name][role] || 0;
        if (currentRoleCount >= 2) {
            return false;
        }

        const spawn = this.spawn.find(spawn => !spawn.spawning);
        if (!spawn) return false;

        const body = this.GenerateBodys(RoleData[role]['ability']);
        if (!body) return false;

        const number = (Game.time*16+Math.floor(Math.random()*16)).toString(16).slice(-4).toUpperCase();
        const result = spawn.spawnCreep(body, `${RoleData[role].code}#${number}`, {
            memory: {role, home: this.name} as CreepMemory});

        if (result === OK) {
            global.CreepNum[this.name][role] = (global.CreepNum[this.name][role] || 0) + 1;
            console.log(`紧急孵化 ${role} 在房间 ${this.name}`);
            return true;
        }
        return false;
    }
}