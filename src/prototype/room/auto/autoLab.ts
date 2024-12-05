import { LabMap, LabLevel } from '@/constant/ResourceConstant'

export default class AutoLab extends Room {
    autoLab() {
        if (Game.time % 50) return;
        if (!this.lab || !this.lab.length) return;
        const botmem =  global.BotMem('structures', this.name);

        // 关停时不处理
        if (!botmem || !botmem.lab) return;
        const labProduct = botmem.labAtype && botmem.labBtype ?
                        REACTIONS[botmem.labAtype][botmem.labBtype] : null;
        const amount = botmem.labAmount;    // 产物限额

        const labA = Game.getObjectById(botmem.labA) as StructureLab;
        const labB = Game.getObjectById(botmem.labB) as StructureLab;
        // 检查库存是否够合成
        const ResAmountCheck = (this.getResourceAmount(botmem.labAtype) >= 1000 &&
                                this.getResourceAmount(botmem.labBtype) >= 1000)
        // 检查当前填充的是否够合成
        const LabMineralCheck = labA && labB &&
                                labA.mineralType === botmem.labAtype &&
                                labB.mineralType === botmem.labBtype &&
                                labA.store[botmem.labAtype] >= 0 &&
                                labB.store[botmem.labBtype] >= 0;
        // 没有限额，原料充足，则不变更任务
        if (amount <= 0 && botmem.labAtype && botmem.labBtype &&
            (ResAmountCheck || LabMineralCheck)
        ) return;

        // 有限额，则增加数量检查
        if (amount > 0 && botmem.labAtype && botmem.labBtype &&
            labProduct && this.getResourceAmount(labProduct) < amount &&
            (ResAmountCheck || LabMineralCheck)
        ) return;

        // 达到限额就清空
        if (amount > 0 && labProduct &&
            this.getResourceAmount(labProduct) >= amount) {
            botmem.labAtype = '';
            botmem.labBtype = '';
            botmem.labAmount = 0;
        }
        // 如果没有限额, 并且找不到新任务, 那么任务会暂时保留

        // 获取自动任务列表
        const autoLabMap = global.BotMem('autoLab', this.name);
        if (!autoLabMap || !Object.keys(autoLabMap).length) return;

        // 查找未到达限额且原料足够的任务, 按优先级选择
        let task = null;
        let lv = Infinity; // 优先级
        for (const res in autoLabMap) {
            const level = LabLevel[res];
            if (lv <= level) continue;
            if (autoLabMap[res] > 0 && this.getResourceAmount(res) >= autoLabMap[res] * 0.9) continue;
            if (this.getResourceAmount(LabMap[res]['raw1']) < 6000 ||
                this.getResourceAmount(LabMap[res]['raw2']) < 6000) continue;
            task = res;
            lv = level;
        }
        if (!task) return;

        botmem.labAtype = LabMap[task]['raw1'];
        botmem.labBtype = LabMap[task]['raw2'];
        botmem.labAmount = autoLabMap[task];

        global.log(`[${this.name}] 已自动分配lab合成任务: ${botmem.labAtype}/${botmem.labBtype}, 限额: ${autoLabMap[task] || '无'}`)
        return OK;
    }
}
