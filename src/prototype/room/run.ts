export default class RoomRun extends Room {
    // 房间初始化
    init() {
        const BotMemory = global.BotMem();
        if (!this.my || !BotMemory['rooms'][this.name]) return;
        if (!BotMemory['structures'][this.name])
            BotMemory['structures'][this.name] = {};
        global.CreepNum[this.name] = {};    // 当前房间各类型的creep数量
        global.SpawnMissionNum[this.name] = {};    // 当前房间孵化队列中各类型的creep数量
        this.initMissionPool(); // 初始化任务池
        this.update();  // 初始化缓存
    }
    // 房间运行
    run() {
        this.MissionUpdate();    // 更新任务池
        this.StructureWork();    // 处理建筑行为
        this.activeDefend();     // 主动防御处理
        this.autoMarket();       // 自动市场交易
        this.autoBuild();        // 自动建筑
        this.autoLab();          // 自动Lab合成
        this.autoFactory();      // 自动Factory生产
        this.outMine();          // 外矿采集
    }
}

