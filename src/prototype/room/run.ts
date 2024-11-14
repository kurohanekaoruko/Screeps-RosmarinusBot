export default class RoomRun extends Room {
    // 房间初始化
    init() {
        if (!this.controller || !this.controller.my) return;
        global.SpawnQueue[this.name] = [];  // 当前房间的孵化队列
        this.initMissionPool(); // 初始化任务池
        this.update();  // 初始化缓存
    }
    // 房间运行
    run() {
        if(!Memory.MissionPools[this.name]) { this.init() }
        if(Game.time % 100 == 0) this.update();  // 定期更新缓存

        this.MissionUpdate();  // 任务更新
        this.roomCheck();  // 房间定期检查
        this.allStructureWork();    // 处理建筑物行为，包括tower、link
        
        this.autoMarket();       // 自动市场交易
        this.autoLayout();       // 自动布局
        this.autoFactory();       // 自动工厂生产
    }
    // 房间定期检查
    roomCheck() {
        // 关于主动防御的检查
        if (Game.time % 5 == 0) {
            let hostiles = this.find(FIND_HOSTILE_CREEPS);
            if (hostiles.length > 0) {
                global.Hostiles = hostiles.map(hostile => hostile.id);
                this.memory.defender = true;    // 进入防御模式
            }
            else {
                this.memory.defender = false;   // 离开防御模式
            }
        }
        // 关于孵化的检查
        if(Game.time % 10 == 0) {
            this.CheckCreeps();  // Creep数量检查
            this.SpawnCreeps();  // 处理孵化队列
            this.ShutdownInspection();  // 停机检查
        }
    }
}

