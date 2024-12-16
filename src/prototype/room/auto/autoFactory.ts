
export default class AutoFactory extends Room {
    autoFactory() {
        if (Game.time % 50) return;
        if (!this.factory) return;
        const botmem = Memory['StructControlData'][this.name];
        // 关停时不处理
        if (!botmem || !botmem.factory) return;

        // 产物
        const Product = botmem.factoryProduct;
        // 限额
        const amount = (botmem.factoryAmount||0);
        // 原料
        const components = COMMODITIES[Product]?.components;

        // 没有限额，原料充足，则不变更任务
        if (amount <= 0 && Product && components &&
            Object.keys(components).every((c: any) => 
                this.getResourceAmount(c) >= 1000 || this.factory.store[c] >= components[c]
            )
        ) return;
        // 有限额，则增加数量检查
        if (amount > 0 && Product && components &&
            this.getResourceAmount(Product) < amount &&
            Object.keys(components).every((c: any) => 
                this.getResourceAmount(c) >= 1000 || this.factory.store[c] >= components[c]
            )
        ) return;

        // 达到限额则结束该任务
        if (amount > 0 && Product &&
            this.getResourceAmount(Product) >= amount) {
            botmem.factoryProduct = '';
            botmem.factoryAmount = 0;
        }

        // 获取自动任务列表
        const autoFactoryMap = Memory['AutoData']['AutoFactoryData'][this.name];
        if (!autoFactoryMap || !Object.keys(autoFactoryMap).length) return;

        // 查找未到达限额且原料足够的任务
        let task = null;
        let lv = Infinity;
        for (const res in autoFactoryMap) {
            const level = COMMODITIES[res].level || 0;
            // 优先生产全等级任务
            if (lv <= level) continue;
            const components = COMMODITIES[res].components;
            const amount = autoFactoryMap[res] - 1000;
            if (amount > 0 && this.getResourceAmount(res) >= amount * 0.9) continue;
            if (Object.keys(components).some((c: any) =>
                this.getResourceAmount(c) < 1000)) continue;
            task = res;
            lv = level;
        }
        if (!task) return;

        botmem.factoryProduct = task;
        botmem.factoryAmount = autoFactoryMap[task];

        global.log(`[${this.name}] 已自动分配factory生产任务: ${task}, 限额: ${autoFactoryMap[task] || '无'}`)
        return OK;
    }
}
