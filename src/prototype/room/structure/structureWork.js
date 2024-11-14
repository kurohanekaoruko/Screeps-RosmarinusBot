/**
 * 管理建筑物的工作
 */
export default class StructureWork extends Room {
    allStructureWork() {
        // 管理房间中的建筑物
        this.TowerWork();
        this.LinkWork();
        this.LabWork();
        this.FactoryWork();
        this.PowerSpawnWork();
    }
    
    TowerWork() {
        // 处理 Tower 防御和修复逻辑
        if (!this.tower) return;
        let towers = this.tower;
    
        // 如果有敌人，则攻击敌人
        let Hostiles = (global.Hostiles || []).map(id => Game.getObjectById(id)).filter(o => o);
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
        let healers = this.find(FIND_MY_CREEPS, {
            filter: creep => creep.hits < creep.hitsMax
        })
        if(!healers.length) healers = this.find(FIND_MY_POWER_CREEPS, {
            filter: creep => creep.hits < creep.hitsMax
        })
        if (healers.length > 0) {
            towers.forEach(tower => {
                let index = Math.floor(Math.random() * Hostiles.length);
                tower.heal(healers[index]);
            })
            return;
        }

        // 修复建筑物
        const task = this.getMissionFromPool('repair');
        if(!task) return;
        const target = Game.getObjectById(task.data.target);
        if(!target) return;
        if (target.hits >= task.data.hits) {
            this.deleteMissionFromPool('repair', task.id);
            return;
        }

        towers.forEach(tower => {
            if(tower.store[RESOURCE_ENERGY] < tower.store.energyCapacity * 0.5) return;  // 如果塔的能量不足一半，则不执行修复逻辑
            tower.repair(target);
        });
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
            if(this.source.some(source => link.pos.inRangeTo(source, 1))) {
                sourceLinks.push(link);
                continue;
            }
            if(link.pos.inRangeTo(this.controller, 1)) {
                controllerLink = link;
                continue;
            }
            if(link.pos.inRangeTo(this.storage, 2)) {
                manageLink = link;
                continue;
            }
            normalLink.push(link);
        }

        if(!controllerLink && !manageLink) return;

        const transferOK = {};
    
        for (let sourceLink of sourceLinks) {
            if(sourceLink.cooldown != 0) continue;  // 如果 Link 在冷却中，则跳过
            if(sourceLink.store[RESOURCE_ENERGY] < 400) continue;  // 如果 Link 的能量不足，则跳过
            if (controllerLink && controllerLink.store[RESOURCE_ENERGY] < 400 && !transferOK.controllerLink) {
                sourceLink.transferEnergy(controllerLink);  // 传输能量
                transferOK.controllerLink = true;
                continue;
            }
            if (manageLink && manageLink.store[RESOURCE_ENERGY] < 400 && !transferOK.manageLink) {
                sourceLink.transferEnergy(manageLink);  // 传输能量
                transferOK.manageLink = true;
                continue;
            }
            if(!normalLink || normalLink.length < 1) continue;
            const nl = normalLink.find(link => link.store[RESOURCE_ENERGY] < 400 && !transferOK[link.id]);
            if (nl) {
                sourceLink.transferEnergy(nl);  // 传输能量
                transferOK[nl.id] = true;
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
        if (manageLink && manageLink.store[RESOURCE_ENERGY] > 400){
            normalLink = normalLink.find(link => link.store[RESOURCE_ENERGY] < 400);
            if (normalLink) {
                manageLink.transferEnergy(normalLink[0]);  // 传输能量
                return;
            }
        }
    }

    LabWork() {
        if (Game.time % 5 !== 1) return;  // 每 5 tick 执行一次
        if (!this.memory.lab) return;    // lab关停时不合成

        if (!this.lab) return;
        if (!this.memory.labA || !this.memory.labB) return;

        const labAtype = this.memory.labAtype ;
        const labBtype = this.memory.labBtype;
        if (!labAtype || !labBtype) return;
        
        let labA = Game.getObjectById(this.memory.labA);
        let labB = Game.getObjectById(this.memory.labB);
        if (!labA || !labB) return;
        if (labA.cooldown != 0 || labB.cooldown != 0) return;
        // 检查labA和labB是否有足够的资源
        if (labA.store[labAtype] < 5 || labB.store[labBtype] < 5) {
            return;
        }
        // 获取其他lab
        let otherLabs = this.lab
            .filter(lab => lab.id !== this.memory.labA && lab.id !== this.memory.labB &&
                    lab && lab.cooldown === 0);
        // 遍历其他lab进行合成
        for (let lab of otherLabs) {
            // 检查lab中是否存在与合成产物不同的资源
            const labProduct = REACTIONS[labAtype][labBtype];
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
        if (Game.time % 10 !== 1) return;  // 每 10 tick 执行一次
        const terminal = this.terminal;
        if (!terminal || terminal.cooldown !== 0) return;

        const task = this.getMissionFromPool('send')
        if (!task) return;
        const { targetRoom, resourceType, amount } = task.data;
        const result = terminal.send(resourceType, amount, targetRoom);
        if (result === OK) {
            console.log(`从房间 ${this.name} 向 ${targetRoom} 发送了 ${amount} 单位的 ${resourceType}`);
        } else {
            console.log(`从房间 ${this.name} 向 ${targetRoom} 发送 ${amount} 单位的 ${resourceType} 失败，错误代码：${result}`);
        }
        this.deleteMissionFromPool('send', task.id);
    }

    FactoryWork() {
        if (Game.time % 10 !== 1) return;  // 每 10 tick 执行一次
        
        if(!this.memory.factory) return;

        const factory = this.factory;
        if(!factory) return;

        if(factory.cooldown != 0) return;

        const task = this.memory.factoryTask;
        if(!task) return;

        const result = factory.produce(task);

        if(result !== OK) {
            if(factory.store[this.memory.factoryTask] > 0) {
                this.ManageMissionAdd('f', 's', this.memory.factoryTask, factory.store[this.memory.factoryTask]);
            }
        };
        return;
    }

    PowerSpawnWork() {
        if(this.level < 8) return;

        // 关停时不处理
        if(!this.memory.powerSpawn) return;

        const powerSpawn = this.powerSpawn;
        if(!powerSpawn) return;
        const store = powerSpawn.store;
        if(store[RESOURCE_ENERGY] < 50 || store[RESOURCE_POWER] < 1) return;
        powerSpawn.processPower();
    }
}