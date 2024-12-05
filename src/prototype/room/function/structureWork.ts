import { RoleData, RoleLevelData } from '@/constant/CreepConstant';
import { CompoundColor } from '@/constant/ResourceConstant';

/**
 * 管理建筑物的工作
 */
export default class StructureWork extends Room {
    StructureWork() {
        // 管理房间中的建筑物
        this.SpawnWork();
        this.TowerWork();
        this.LinkWork();
        this.LabWork();
        this.TerminalWork();
        this.FactoryWork();
        this.PowerSpawnWork();
    }

    SpawnWork() {
        if (!this.spawn) return;
        this.spawn.forEach(spawn => {
            if (!spawn.spawning) return;
            const code = spawn.spawning.name.match(/\[(\w+)\]/)?.[1];
            this.visual.text(
                `${code} 🕒${spawn.spawning.remainingTime}`,
                spawn.pos.x,
                spawn.pos.y,
                { align: 'center',
                  color: 'red',
                  stroke: '#ffffff',
                  strokeWidth: 0.05,
                  font: 'bold 0.32 inter' }
            )
        })

        // 处理 Spawn 孵化逻辑
        if (Game.time % 10) return;
        if (this.energyAvailable < 300) return;
        if (!this.checkMissionInPool('spawn')) return;

        // 获取当前房间的等级，如果房间扩展不足，则返回较低的等级
        const lv = this.getEffectiveRoomLevel();
        let hc = null;
    
        // 如果有能量，则生产 creep
        this.spawn.forEach(spawn => {
            if (!spawn || spawn.spawning) return;
            const task = this.getSpawnMission();
            if (!task) return;
            if (!task.data?.memory?.role) {
                this.deleteMissionFromPool('spawn', task.id);
                return;
            }
            const data = task.data as SpawnTask;
            const role = data.memory.role;
            const number = (Game.time*36*36 + Math.floor(Math.random()*36*36))
                            .toString(36).slice(-4).toUpperCase();
            const name = `[${data.name||RoleData[role].code}]#${number}`;
            let body: Number[];
            if (data.body?.length > 0) {
                body = data.body;
            } else {
                body = this.DynamicBodys(role);
            }
            const bodypart = this.GenerateBodys(body);
            if (!bodypart || bodypart.length == 0) {
                this.submitSpawnMission(task.id);
                return;
            }
            const result = spawn.spawnCreep(bodypart, name, { memory: data.memory });
            if (result == OK) {
                if (!global.CreepNum) global.CreepNum = {};
                if (!global.CreepNum[this.name]) global.CreepNum[this.name] = {};
                global.CreepNum[this.name][role] = (global.CreepNum[this.name][role] || 0) + 1;
                this.submitSpawnMission(task.id);
                return;
            } else {
                if (Game.time % 30) return;
                if (hc && hc >= 2) return;
                if (role !== 'harvester' && role !== 'transport' && role !== 'carrier') return;
                const num = this.find(FIND_MY_CREEPS, {filter: c => c.memory.role == role}).length;
                if (num !== 0) return;
                if (role !== 'carrier' || (role == 'carrier' && this.level < 4)) {
                    if (hc == null) {
                        hc = this.find(FIND_MY_CREEPS, {filter: c => c.memory.role == 'har-car'}).length +
                            (global.SpawnMissionNum[this.name]?.['har-car'] || 0)
                    }
                    if (hc >= 2) return;
                    spawn.spawnCreep(
                        this.GenerateBodys(RoleData['har-car'].ability),
                        `<${RoleData['har-car'].code}>#${number}`,
                        { memory: { role: 'har-car', home: this.name } as CreepMemory }
                    );
                    global.log(`房间 ${this.name} 没有且不足以孵化 ${role}，已紧急孵化 har-car。`);
                    hc++;
                }
            }
        })
    }
    
    TowerWork() {
        // 处理 Tower 防御和修复逻辑
        if (!this.tower) return;
        let towers = this.tower;

        // 如果有敌人，则攻击敌人
        if (!global.towerTargets) global.towerTargets = {};
        if (Game.time % 10 == 0) {
            global.towerTargets[this.name] = 
                this.find(FIND_HOSTILE_CREEPS)
                    .filter(c => !Memory['whitelist']?.includes(c.owner.username))
                    .map(c => c.id);
        }
        let Hostiles = (global.towerTargets[this.name]||[])
                        .map((id: Id<Creep>) => Game.getObjectById(id))
                        .filter((c: Creep | null) => c) as Creep[] | PowerCreep[];
        if (Hostiles.length > 0) {
            towers.forEach(tower => {
                if (Hostiles.length == 0) return;
                let index = Math.floor(Math.random() * Hostiles.length);
                tower.attack(Hostiles[index]);
                return;
            })
            return;
        }

        // 治疗己方单位
        if (!global.towerHealTargets) global.towerHealTargets = {};
        if (Game.time % 10 == 0) {
            global.towerHealTargets[this.name] = this.find(FIND_MY_POWER_CREEPS, {
                filter: c => c.hits < c.hitsMax && (c.my || Memory['whitelist']?.includes(c.owner.username))
                }).map(c => c.id);
            if (global.towerHealTargets[this.name].length == 0) {
                global.towerHealTargets[this.name] = this.find(FIND_CREEPS, {
                    filter: c => c.hits < c.hitsMax && (c.my || Memory['whitelist']?.includes(c.owner.username))
                }).map(c => c.id);
            }
        }
        let healers = (global.towerHealTargets[this.name]||[])
                .map((id: Id<Creep>) => Game.getObjectById(id))
                .filter((c: Creep | null) => c) as Creep[] | PowerCreep[];
        if (healers.length > 0) {
            towers.forEach(tower => {
                let index = Math.floor(Math.random() * Hostiles.length);
                tower.heal(healers[index]);
            })
            return;
        }

        // 修复建筑物
        if (!global.towerTaskTarget) global.towerTaskTarget = {};
        if (Game.time % 10 == 0) {
            global.towerTaskTarget[this.name] = null;
            if (this.checkMissionInPool('repair')) {
                const task = this.getMissionFromPool('repair');
                if(!task) return;
                const target = Game.getObjectById(task.data.target) as Structure;
                if(!target) return;
                if (target.hits >= task.data.hits) {
                    this.deleteMissionFromPool('repair', task.id);
                    return;
                }
                global.towerTaskTarget[this.name] = target.id;
            }
        }
        
        const target = Game.getObjectById(global.towerTaskTarget[this.name]) as Structure;
        if(target) {
            towers.forEach(t => {
                // 如果塔的能量不足一半，则不执行修复逻辑
                if(t.store[RESOURCE_ENERGY] < 500) return;
                t.repair(target);
            });
        }
        
    }
    
    LinkWork() {
        if (this.level < 5) return;  // 只有在房间等级达到 5 时才启用 Link 能量传输
        if (this.link.length < 2) return;  // 至少需要两个 Link

        if (Game.time % 5 != 0) return;
        
        let sourceLinks = []
        let controllerLink = null;
        let manageLink = null;
        let normalLink = [];
        for(const link of this.link) {
            if(this.source.some(source => link.pos.inRangeTo(source, 2))) {
                sourceLinks.push(link);
                continue;
            }
            if(link.pos.inRangeTo(this.controller, 2)) {
                controllerLink = link;
                continue;
            }
            if(link.pos.inRangeTo(this.storage, 1) || link.pos.inRangeTo(this.terminal, 1)) {
                manageLink = link;
                continue;
            }
            normalLink.push(link);
        }

        if(!controllerLink && !manageLink) return;

        const transferOK = {} as any;
    
        for (let sourceLink of sourceLinks) {
            if(sourceLink.cooldown != 0) continue;  // 如果 Link 在冷却中，则跳过
            if(sourceLink.store[RESOURCE_ENERGY] < 400) continue;  // 如果 Link 的能量不足，则跳过

            if (controllerLink && controllerLink.store[RESOURCE_ENERGY] < 400 && !transferOK.controllerLink) {
                sourceLink.transferEnergy(controllerLink);  // 传输能量
                transferOK.controllerLink = true;
                continue;
            }

            const nlink = normalLink.find(link => link.store[RESOURCE_ENERGY] < 400 && !transferOK[link.id]);
            if (nlink) {
                sourceLink.transferEnergy(nlink);  // 传输能量
                transferOK[nlink.id] = true;
                continue;
            }

            if (manageLink && manageLink.store[RESOURCE_ENERGY] < 400 && !transferOK.manageLink) {
                sourceLink.transferEnergy(manageLink);  // 传输能量
                transferOK.manageLink = true;
                continue;
            }

            break;
        }

        if (controllerLink && controllerLink.store[RESOURCE_ENERGY] < 400 && !transferOK.controllerLink){ // 如果控制器Link能量不足400
            if(!manageLink || manageLink.cooldown != 0) return;
            if(manageLink && manageLink.store[RESOURCE_ENERGY] > 400){  // 如果中心Link能量大于400
                manageLink.transferEnergy(controllerLink);  // 传输能量
                return;
            }
        }
        if (manageLink && manageLink.cooldown == 0 && manageLink.store[RESOURCE_ENERGY] > 400){
            normalLink = normalLink.find(link => link.store[RESOURCE_ENERGY] < 400 && !transferOK[link.id]);
            if (normalLink) {
                manageLink.transferEnergy(normalLink[0]);  // 传输能量
                return;
            }
        }
    }

    LabWork() {
        this.lab.forEach(lab => {
            if (!lab.mineralType) return;
            this.visual.text(lab.mineralType,
                lab.pos.x, lab.pos.y,
                { align: 'center',
                  color: CompoundColor[lab.mineralType],
                  stroke: '#2a2a2a',
                  strokeWidth: 0.05,
                  font: '0.24 inter' }
            )
        })
        // 每 5 tick 执行一次
        if (Game.time % 5 !== 1) return;
        // lab数量不足时不合成
        if (!this.lab || this.lab.length < 3) return;

        const memory =  global.BotMem('structures', this.name);
        // lab关停时不合成
        if (!memory || !memory.lab || this.memory.defend) return;
        // 没有设置底物lab时不合成
        if (!memory.labA || !memory.labB) return;

        const labAtype = memory.labAtype ;
        const labBtype = memory.labBtype;
        // 没有设置底物类型时不合成
        if (!labAtype || !labBtype) return;
        
        let labA = Game.getObjectById(memory.labA) as StructureLab;
        let labB = Game.getObjectById(memory.labB) as StructureLab;
        // 底物lab不存在时不合成
        if (!labA || !labB) return;
        // 检查labA和labB是否有足够的资源
        if (labA.store[labAtype] < 5 || labB.store[labBtype] < 5) {
            return;
        }
        // 获取其他lab
        let otherLabs = this.lab
            .filter(lab => lab.id !== memory.labA && lab.id !== memory.labB &&
                    lab && lab.cooldown === 0);
        // boost设置
        const botmem =  global.BotMem('structures', this.name, 'boostTypes');
        // 遍历其他lab进行合成
        for (let lab of otherLabs) {
            // 合成产物
            const labProduct = REACTIONS[labAtype][labBtype] as ResourceConstant;
            // 如果有boost并且boost类型与合成产物不同，则跳过
            if(botmem[lab.id] && botmem[lab.id] != labProduct) continue;
            // 检查lab中是否存在与合成产物不同的资源
            if (lab.mineralType && lab.mineralType !== labProduct) {
                continue; // 如果存在不同的资源，跳过这个lab
            }
            // 检查lab是否已满
            if (lab.store.getFreeCapacity(labProduct) === 0) {
                continue; // 如果lab已满，跳过这个lab
            }
            // 尝试进行合成
            lab.runReaction(labA, labB);
        }
    }

    TerminalWork() {
        if (Game.time % 30 !== 2) return;
        const terminal = this.terminal;
        if (!terminal || terminal.cooldown !== 0) return;

        const task = this.getSendMission();
        if (!task) return;
        const { targetRoom, resourceType, amount } = task.data;
        let sendAmount = Math.min(amount, terminal.store[resourceType]);
        const cost = Game.market.calcTransactionCost(sendAmount, this.name, targetRoom);
        if (resourceType === RESOURCE_ENERGY) {
            sendAmount = Math.min(sendAmount, terminal.store[resourceType] - cost);
        }
        else if (cost > terminal.store[RESOURCE_ENERGY]) {
            sendAmount = Math.floor(sendAmount * terminal.store[RESOURCE_ENERGY] / cost);
        }
        const result = terminal.send(resourceType, sendAmount, targetRoom);
        if (result === OK) {
            if(amount - sendAmount > 100) {
                this.updateMissionPool('send', task.id, {data: {amount: amount - sendAmount}});
            } else {
                this.deleteMissionFromPool('send', task.id);
            }
            console.log(`房间 ${this.name} 向 ${targetRoom} 发送了 ${sendAmount} 单位的 ${resourceType}`);
        } else {
            console.log(`房间 ${this.name} 向 ${targetRoom} 发送 ${sendAmount} 单位的 ${resourceType} 失败，错误代码：${result}`);
        }
    }

    FactoryWork() {
        if (Game.time % 10 !== 1) return;  // 每 10 tick 执行一次
        const memory =  global.BotMem('structures', this.name);
        // 关停时不处理
        if(!memory || !memory.factory) return;
        const factory = this.factory;
        // 工厂不存在时不处理
        if(!factory) return;
        // 冷却时不处理
        if(factory.cooldown != 0) return;
        // 没有任务时不处理
        const product = memory.factoryProduct;
        if (!product) return;

        const result = factory.produce(product);
        if (result !== OK) {
            if(factory.store[product] > 0) {
                this.ManageMissionAdd('f', 's', product, factory.store[product]);
            }
        };
    }

    PowerSpawnWork() {
        if(this.level < 8) return;

        // 关停时不处理
        if(!global.BotMem('structures', this.name)?.powerSpawn) return;
        // 能量不足不处理
        if(this.getResourceAmount(RESOURCE_ENERGY) < 10000) return;

        const powerSpawn = this.powerSpawn;
        if(!powerSpawn) return;
        const store = powerSpawn.store;
        if(store[RESOURCE_ENERGY] < 50 || store[RESOURCE_POWER] < 1) return;
        powerSpawn.processPower();
    }


}
