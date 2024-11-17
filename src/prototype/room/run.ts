export default class RoomRun extends Room {
    // 房间初始化
    init() {
        const BotMemory = global.BotMem();
        if (!this.controller || !this.controller.my || !BotMemory['rooms'][this.name]) return;
        if (!BotMemory['structures'][this.name]) {
            BotMemory['structures'][this.name] = {};
        }
        global.SpawnQueue[this.name] = [];  // 当前房间的孵化队列
        global.CreepNum[this.name] = {};    // 当前房间各类型的creep数量
        global.QueueCreepNum[this.name] = {};    // 当前房间孵化队列中各类型的creep数量
        this.initMissionPool(); // 初始化任务池
        this.update();  // 初始化缓存
    }
    // 房间运行
    run() {
        const BotMemory = global.BotMem();
        if (!this.controller || !this.controller.my || !BotMemory['rooms'][this.name]) return;
        if(!Memory.MissionPools[this.name]) { this.init() }
        if(Game.time % 100 == 0) this.update();  // 定期更新缓存

        this.MissionUpdate();  // 任务更新
        this.roomCheck();  // 房间定期检查
        this.allStructureWork();    // 处理建筑物行为，包括tower、link
        this.autoMarket();       // 自动市场交易
        this.autoLayout();       // 自动布局
    }
    // 房间定期检查
    roomCheck() {
        // 关于主动防御的检查
        if (Game.time % 5 == 0) {
            let hostiles = this.find(FIND_HOSTILE_CREEPS, {
                filter: hostile => 
                    !global.BaseConfig.whitelist.includes(hostile.owner.username) &&
                    hostile.owner.username != 'Source Keeper' &&
                    hostile.owner.username != 'Invader' &&
                    (hostile.getActiveBodyparts(ATTACK) > 0 || 
                     hostile.getActiveBodyparts(RANGED_ATTACK) > 0 ||
                     hostile.getActiveBodyparts(HEAL) > 0 ||
                     hostile.getActiveBodyparts(WORK) > 0)
            });
            if (hostiles.length > 0) {
                if(!global.Hostiles) global.Hostiles = {};
                global.Hostiles[this.name] = hostiles.map(hostile => hostile.id);
                this.memory.defender = true;    // 进入防御模式
                const doubleDefender = Object.values(Game.creeps)
                        .filter((creep) => creep.memory.role == 'double-defender' && creep.memory.targetRoom == this.name);
                const doubleHeal = Object.values(Game.creeps)
                        .filter((creep) => creep.memory.role == 'double-heal' && creep.memory.targetRoom == this.name && creep.memory.squad == 'defender');
                const queuenum = global.QueueCreepNum[this.name]
                if(doubleDefender.length + (queuenum?.['double-defender']||0) < 1) {
                    this.SpawnQueueAdd('', [], {role: 'double-defender', squad: 'defender', targetRoom: this.name})
                }
                if(doubleHeal.length + (queuenum?.['double-heal']||0) < 1) {
                    this.SpawnQueueAdd('', [], {role: 'double-heal', squad: 'defender', targetRoom: this.name})
                }
            }
            else {
                if(!global.Hostiles) global.Hostiles = {};
                global.Hostiles[this.name] = [];
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

