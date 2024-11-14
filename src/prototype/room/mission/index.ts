/**
 * 任务模块
 */
export default class Mission extends Room {    
    MissionUpdate() {
        if(Game.time % 50 === 0) this.UpdateBuildRepairMission();  // 更新建造与维修任务
        if(Game.time % 100 === 1) this.UpdateWallRepairMission();  // 更新刷墙任务
        if(Game.time % 50 === 2) this.BuildRepairMissionCheck();  // 检查任务是否有效

        if(Game.time % 10 === 0) this.UpdateTransportMission();  // 更新运输任务
        if(Game.time % 10 === 1) this.TransportMissionCheck();  // 检查运输任务是否有效
        if(Game.time % 50 === 2) this.CheckTerminalResAmount();  // 检查终端资源预留数量，不足则补充
        // if(Game.time % 50 === 3) this.UpdatePowerUseMission();  // 更新power使用任务
    }

    // 检查终端资源
    CheckTerminalResAmount() {
        if (!this.storage || !this.terminal) return false;

        const SOURCE_ENERGY_THRESHOLD = 15000;
        const SOURCE_RESOURCE_THRESHOLD = 6000;
        const TARGET_ENERGY_THRESHOLD = 10000;
        const TARGET_RESOURCE_THRESHOLD = 4000;

        // 检查终端自动转入
        for (const resourceType in this.storage.store) {
            if(this.memory.AUTO_S2T === false) break;
            // 当storage资源足够，且终端资源不足时，将storage资源补充到终端
            const storageThreshold = resourceType === RESOURCE_ENERGY ? SOURCE_ENERGY_THRESHOLD : SOURCE_RESOURCE_THRESHOLD;
            const terminalThreshold = resourceType === RESOURCE_ENERGY ? TARGET_ENERGY_THRESHOLD : TARGET_RESOURCE_THRESHOLD;
            
            if (this.storage.store[resourceType] <= storageThreshold || this.terminal.store[resourceType] >= terminalThreshold) continue;
    
            const amountToTransfer = Math.min(
                this.storage.store[resourceType] - storageThreshold,
                terminalThreshold - this.terminal.store[resourceType]
            );

            this.ManageMissionAdd('s', 't', resourceType, amountToTransfer);
        }

        // 检查终端自动转出
        for (const resourceType in this.terminal.store) {
            if(this.memory.AUTO_T2S === false) break;
            // 当终端资源过多，且storage有空间时，将终端多余资源转入storage
            const threshold = resourceType === RESOURCE_ENERGY ? SOURCE_ENERGY_THRESHOLD : SOURCE_RESOURCE_THRESHOLD;

            if(this.terminal.store[resourceType] <= threshold) continue;

            const amountToTransfer = this.terminal.store[resourceType] - threshold;

            if(this.storage.store.getFreeCapacity(resourceType as ResourceConstant) < amountToTransfer) continue;

            this.ManageMissionAdd('t', 's', resourceType, amountToTransfer);
        }
    }

    // 发布建造维修任务
    UpdateBuildRepairMission() {
        // 查找所有受损的结构
        const allStructures = this.find(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax
        });

        const NORMAL_STRUCTURE_THRESHOLD = 0.8;     // 普通修复建筑耐久度阈值
        const URGENT_STRUCTURE_THRESHOLD = 0.1;     // 紧急修复建筑耐久度阈值
        const NORMAL_WALL_THRESHOLD = 0.001;        // 普通修复墙耐久度阈值
        const URGENT_WALL_HITS = 2000;               // 紧急修复墙耐久度
        

        // 维修优先级：紧急维修-建筑 > 紧急维修-墙 > 常规维修-建筑 > 常规维修-墙
        for (const structure of allStructures) {
            const { hitsMax, structureType, hits, id, pos } = structure;
            const posInfo = `${pos.x}/${pos.y}/${pos.roomName}`
            if (structureType !== STRUCTURE_WALL && structureType !== STRUCTURE_RAMPART) {
                // 处理建筑
                if (hits < hitsMax * URGENT_STRUCTURE_THRESHOLD) {  // 紧急维修
                    const data = {target: id, hits: hitsMax * URGENT_STRUCTURE_THRESHOLD};
                    this.BuildRepairMissionAdd('repair', posInfo, 1, data)
                    continue;
                }
                if (hits < hitsMax * NORMAL_STRUCTURE_THRESHOLD) {  // 常规维修
                    const data = {target: id, hits: hitsMax * NORMAL_STRUCTURE_THRESHOLD};
                    this.BuildRepairMissionAdd('repair', posInfo, 3, data)
                    continue;
                }
            } else {
                // 处理墙和城墙
                if (hits < URGENT_WALL_HITS) {          // 紧急维修
                    const data = {target: id, hits: URGENT_WALL_HITS};
                    this.BuildRepairMissionAdd('repair', posInfo, 2, data)
                    continue;
                }
                if (hits < hitsMax * NORMAL_WALL_THRESHOLD) {   // 常规维修
                    const data = {target: id, hits: hitsMax * NORMAL_WALL_THRESHOLD};
                    this.BuildRepairMissionAdd('repair', posInfo, 4, data)
                    continue;
                }
            }
        }

        // 建造任务
        const constructionSites = this.find(FIND_CONSTRUCTION_SITES);
        for(const site of constructionSites) {
            const posInfo = `${site.pos.x}/${site.pos.y}/${site.pos.roomName}`
            const level = Math.floor((1 - site.progress / site.progressTotal) * 4);
            const data = {target: site.id};
            this.BuildRepairMissionAdd('build', posInfo, level, data)
        }
    }

    // 刷墙任务
    UpdateWallRepairMission() {
        const WALL_HITS_MAX_THRESHOLD = 1;        // 墙最大耐久度阈值
        // 查找所有受损的结构
        const walls = this.find(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax &&
            (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART)
        });
        for(const structure of walls) {
            const { hitsMax, hits, id, pos } = structure;
            const posInfo = `${pos.x}/${pos.y}/${pos.roomName}`
            if(hits < hitsMax * WALL_HITS_MAX_THRESHOLD * 0.9) {  // 刷墙
                const level = Math.floor(hits / hitsMax * 100); // 优先级
                const data = {target: id, hits: hitsMax * WALL_HITS_MAX_THRESHOLD};
                this.BuildRepairMissionAdd('walls', posInfo, level, data)
                continue;
            }
        }
    }

    // 检查建造与维修的任务池，去除无效任务
    BuildRepairMissionCheck() {
        const checkFunc = (task: task) => {
            const data = task.data as BuildRepairTask;
            const target = Game.getObjectById(data.target);
            if(!target) return false;   // 目标不存在的任务无效

            // 修复任务，如果目标建筑耐久度大于等于任务设定，则任务已完成
            if(['repair', 'walls'].includes(task.type) && (target as Structure).hits >= data.hits) return false;
            
            return true;
        }

        this.checkMissionPool('build', checkFunc);
        this.checkMissionPool('repair', checkFunc);
        this.checkMissionPool('walls', checkFunc);
    }

    // 更新运输任务
    UpdateTransportMission() {
        const storage = this.storage;
        if(!storage) return;

        this.UpdateEnergyMission();
        this.UpdatePowerMission();
        this.UpdateLabMission();
        this.UpdateLabBoostMission();
        this.UpdateNukerMission();
    }

    UpdateEnergyMission() {
        const storage = this.storage;
        let energy = storage.store[RESOURCE_ENERGY];
        if(energy < 3000) return;

        // 检查spawn和扩展是否需要填充能量
        if(this.spawn) {
            const spawnsAndExtensions = (this.spawn?.concat(this.extension as any) ?? [])
                .filter((s: StructureSpawn | StructureExtension) => s && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            spawnsAndExtensions.forEach((s: StructureSpawn | StructureExtension) => {
                if(energy < s.store.getFreeCapacity(RESOURCE_ENERGY)) return;
                energy -= s.store.getFreeCapacity(RESOURCE_ENERGY);
                const taskdata = {
                    source: storage.id,
                    target: s.id,
                    resourceType: RESOURCE_ENERGY,
                    amount: s.store.getFreeCapacity(RESOURCE_ENERGY),
                }
                const posInfo = `${s.pos.x}/${s.pos.y}/${s.pos.roomName}`
                this.TransportMissionAdd(posInfo, 0, taskdata)
            })
        }

        // 检查tower是否需要填充能量
        if(this.level >= 3 && this.tower) {
            const towers = (this.tower || [])
                .filter((t: StructureTower) => t && t.store.getFreeCapacity(RESOURCE_ENERGY) > 200);
            towers.forEach((t: StructureTower) => {
                if(energy < t.store.getFreeCapacity(RESOURCE_ENERGY)) return;
                energy -= t.store.getFreeCapacity(RESOURCE_ENERGY);
                const taskdata = {
                    source: storage.id,
                    target: t.id,
                    resourceType: RESOURCE_ENERGY,
                    amount: t.store.getFreeCapacity(RESOURCE_ENERGY),
                }
                const posInfo = `${t.pos.x}/${t.pos.y}/${t.pos.roomName}`;
                this.TransportMissionAdd(posInfo, 0, taskdata)
            })
        }

        // 检查powerSpawn是否需要填充能量
        if(Game.time % 20 === 0 && this.level == 8 && this.powerSpawn) {
            const powerSpawn = this.powerSpawn;
            const amount = powerSpawn.store.getFreeCapacity(RESOURCE_ENERGY);
            if(powerSpawn && powerSpawn.store.getFreeCapacity(RESOURCE_ENERGY) > 400 && energy >= amount) {
                energy -= amount;
                const taskdata = {
                    source: storage.id,
                    target: powerSpawn.id,
                    resourceType: RESOURCE_ENERGY,
                    amount: amount,
                }
                const posInfo = `${powerSpawn.pos.x}/${powerSpawn.pos.y}/${powerSpawn.pos.roomName}`;
                this.TransportMissionAdd(posInfo, 0, taskdata)
            }
        }

        // 检查lab是否需要填充能量
        if(Game.time % 20 === 0 && this.level >= 6 && this.lab) {
            const labs = this.lab
                .filter((l: StructureLab) => l && l.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            labs.forEach((l: StructureLab) => {
                if(energy < l.store.getFreeCapacity(RESOURCE_ENERGY)) return;
                energy -= l.store.getFreeCapacity(RESOURCE_ENERGY);
                const taskdata = {
                    source: storage.id,
                    target: l.id,
                    resourceType: RESOURCE_ENERGY,
                    amount: l.store.getFreeCapacity(RESOURCE_ENERGY),
                }
                const posInfo = `${l.pos.x}/${l.pos.y}/${l.pos.roomName}`;
                this.TransportMissionAdd(posInfo, 1, taskdata)
            })
        }

        // 检查nuker是否需要填充能量
        if(Game.time % 20 === 0 && this.level == 8 && this.nuker) {
            const nuker = this.nuker;
            const amount = Math.min(nuker.store.getFreeCapacity(RESOURCE_ENERGY), 3000);
            if(nuker && amount > 0 && energy >= amount) {
                energy -= amount;
                const taskdata = {
                    source: storage.id,
                    target: nuker.id,
                    resourceType: RESOURCE_ENERGY,
                    amount: amount,
                }
                const posInfo = `${nuker.pos.x}/${nuker.pos.y}/${nuker.pos.roomName}`;
                this.TransportMissionAdd(posInfo, 3, taskdata)
            }
        }

        return OK;
    }

    // 检查powerSpawn是否需要填充power
    UpdatePowerMission() {
        if(this.level < 8 || !this.powerSpawn) return;
        const storage = this.storage;
        const terminal = this.terminal;
        if(!storage && !terminal) return;
        if(storage.store[RESOURCE_POWER] < 1000 && terminal.store[RESOURCE_POWER] < 1000) return;

        const powerSpawn = this.powerSpawn;
        if(!powerSpawn) return;
        const neededAmount = 100 - powerSpawn.store[RESOURCE_POWER];
        if (neededAmount < 50) return;

        const source = (storage.store[RESOURCE_POWER] >= neededAmount && storage) || 
                        (terminal.store[RESOURCE_POWER] >= neededAmount && terminal) || null;
        if(!source) return;
        const taskdata = {
            source: source.id,
            target: powerSpawn.id,
            resourceType: RESOURCE_POWER,
            amount: neededAmount,
        }
        const posInfo = `${powerSpawn.pos.x}/${powerSpawn.pos.y}/${powerSpawn.pos.roomName}`;
        this.TransportMissionAdd(posInfo, 0, taskdata)
    }

    // 检查lab是否需要填充资源
    UpdateLabMission() {
        const storage = this.storage;
        if(!storage) return;
        if(!this.memory.lab) return;    // lab关停时不进行操作
        if(!this.memory.labA || !this.memory.labB || !this.memory.labAtype || !this.memory.labBtype) return;
        const labA = Game.getObjectById(this.memory.labA) as StructureLab;
        const labB = Game.getObjectById(this.memory.labB) as StructureLab;
        const labAtype = this.memory.labAtype;
        const labBtype = this.memory.labBtype;

        // 检查labA和labB中是否存在非设定资源
        [labA, labB].forEach((lab, index) => {
            const type = index === 0 ? labAtype : labBtype;
            if(!lab.mineralType || lab.mineralType === type) return; // 资源类型正确时不操作
            if(!lab.store[lab.mineralType] || lab.store[lab.mineralType] === 0) return; // 资源为空
            const taskdata = {
                source: lab.id,
                target: storage.id,
                resourceType: lab.mineralType,
                amount: lab.store[lab.mineralType],
            }
            const posInfo = `${lab.pos.x}/${lab.pos.y}/${lab.pos.roomName}`;
            this.TransportMissionAdd(posInfo, 2, taskdata)
        });

        // 检查labA和labB是否需要填充设定的资源
        [labA, labB].forEach((lab, index) => {
            const type = index === 0 ? labAtype : labBtype;
            if(lab.mineralType && lab.mineralType !== type) return;    // 有其他资源时不填充
            if(lab.store.getFreeCapacity(type) < 500) return;   // 需要填充的量太少时不添加任务
            if(storage.store[type] < 500) return; // storage中资源不足时不添加任务
            const taskdata = {
                source: storage.id,
                target: lab.id,
                resourceType: type,
                amount: Math.min(lab.store.getFreeCapacity(type), storage.store[type]),
            }
            const posInfo = `${lab.pos.x}/${lab.pos.y}/${lab.pos.roomName}`;
            this.TransportMissionAdd(posInfo, 2, taskdata)
        });

        if(!this.lab || this.lab.length === 0) return;

        // 从已满的lab中取出产物到storage（不包括labA、labB）
        const Labs = this.lab.filter(lab => lab);
        Labs.forEach(lab => {
            if (lab.id === labA.id || lab.id === labB.id) return;
            if (!lab.store[lab.mineralType] || lab.store[lab.mineralType] === 0) return;
            if (lab.store.getFreeCapacity(lab.mineralType) >= 100) return;
            const taskdata = {
                source: lab.id,
                target: storage.id,
                resourceType: lab.mineralType,
                amount: lab.store[lab.mineralType],
            }
            const posInfo = `${lab.pos.x}/${lab.pos.y}/${lab.pos.roomName}`;
            this.TransportMissionAdd(posInfo, 2, taskdata)
        });

        // 如果lab的资源不同于产物，则全部取出
        Labs.forEach(lab => {
            if(lab.id === labA.id || lab.id === labB.id) return;
            if(lab.mineralType === REACTIONS[labAtype][labBtype]) return;
            if(!lab.store[lab.mineralType] || lab.store[lab.mineralType] === 0) return;
            const taskdata = {
                source: lab.id,
                target: storage.id,
                resourceType: lab.mineralType,
                amount: lab.store[lab.mineralType],
            }
            const posInfo = `${lab.pos.x}/${lab.pos.y}/${lab.pos.roomName}`;
            this.TransportMissionAdd(posInfo, 2, taskdata)
        });
    }

    // 填充boost用的资源
    UpdateLabBoostMission() {
        const storage = this.storage;
        const terminal = this.terminal;
        if(!storage && !terminal) return;
        if(this.memory.lab || !this.memory.labsBoostType) return;

        if(!this.lab || this.lab.length === 0) return;

        const Labs = this.lab.filter(lab => lab);
        Labs.forEach(lab => {
            const boostType = this.memory.labsBoostType[lab.id];
            if(!boostType) return;

            // 如果lab中存在非设定的资源，则搬走
            if(lab.mineralType !== boostType && lab.store[lab.mineralType] > 0) {
                const taskdata = {
                    source: lab.id,
                    target: storage.id,
                    resourceType: lab.mineralType,
                    amount: lab.store[lab.mineralType],
                }
                const posInfo = `${lab.pos.x}/${lab.pos.y}/${lab.pos.roomName}`;
                this.TransportMissionAdd(posInfo, 2, taskdata)
                return;
            }
            
            if(!RESOURCES_ALL.includes(boostType)) return;

            // 如果设定的资源不足，则补充
            if(lab.store.getUsedCapacity(boostType) < 2500) {
                const amount = 3000 - lab.store[boostType];
                let source: Id<Structure>;
                if(storage && storage.store[boostType] >= amount) {
                    source = storage.id;
                } else if(terminal && terminal.store[boostType] >= amount) {
                    source = terminal.id;
                } else {
                    return; // 如果storage和terminal都不足，则不补充
                }
                const taskdata = {
                    source: source,
                    target: lab.id,
                    resourceType: boostType,
                    amount: amount,
                }
                const posInfo = `${lab.pos.x}/${lab.pos.y}/${lab.pos.roomName}`;
                this.TransportMissionAdd(posInfo, 2, taskdata)
            }
        });
    }

    // 填充nuket用的资源
    UpdateNukerMission() {
        if(Game.time % 50 !== 0) return;
        if(this.level < 8) return;
        if(!this.nuker) return;
        const storage = this.storage;
        const terminal = this.terminal;
        if(!storage && !terminal) return;
        
        const nuker = this.nuker;
        if(!nuker) return;
        if(nuker.store[RESOURCE_GHODIUM] === 5000) return;  // 如果nuker中已经满了，则不补充

        const amount = 5000 - nuker.store[RESOURCE_GHODIUM];
        let source: Id<Structure>;
        if (storage.store[RESOURCE_GHODIUM] >= amount) {
            source = storage.id; // 从storage获取
        } else if (terminal && terminal.store[RESOURCE_GHODIUM] >= amount) {
            source = terminal.id; // 从terminal获取
        } else {
            return; // 如果storage和terminal都不足，则不补充
        }

        const taskdata = {
            source: source,
            target: nuker.id,
            resourceType: RESOURCE_GHODIUM,
            amount: amount,
        }
        const posInfo = `${nuker.pos.x}/${nuker.pos.y}/${nuker.pos.roomName}`;
        this.TransportMissionAdd(posInfo, 3, taskdata)
    }

    // 检查任务是否有效
    TransportMissionCheck() {
        const checkFunc = (task: task) => {
            if(task.bind && task.bind.length > 0) {
                task.bind = task.bind.filter(creepid => {    // 去除无效的绑定
                    const creep = Game.getObjectById(creepid) as Creep;
                    if(!creep) return false;
                    const mission = creep.memory.mission;
                    if(mission === null || mission?.id !== task.id) return false;
                    return true;
                })
            }
            // 如果任务被锁定，但是没有绑定creep，那么解锁
            if(task.lock && (!task.bind || task.bind.length === 0)) {
                task.lock = false;
            };
            // 检查目标是否有效
            const data = task.data as TransportTask
            const source = Game.getObjectById(data.source) as any;
            const target = Game.getObjectById(data.target) as any;
            if(!source || !target) return false;
            return target.store.getFreeCapacity(data.resourceType) > 0 && data.amount !== 0;
        }

        this.checkMissionPool('transport', checkFunc);
    }

    // 完成任务
    doneTransportMission(id: task['id'], amount: TransportTask['amount'], creepid: Id<Creep>) {
        const task = this.getMissionFromPoolById(id, 'transport');
        if (!task) return;
        amount = (task.data as TransportTask).amount - amount;
        if (amount < 0) amount = 0;
        
        const deleteFunc = (taskdata: TransportTask) =>{
            if(taskdata.amount <= 0) return true;
            return false;
        }

        this.submitMissionComplete('transport', id, creepid, {amount} as any, deleteFunc);
        return OK;
    }
}