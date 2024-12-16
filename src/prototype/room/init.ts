export default class RoomRun extends Room {
    // 房间初始化
    init() {
        if (!this.my || !Memory['RoomControlData'][this.name]) return;
        if (!Memory['StructControlData'][this.name])
            Memory['StructControlData'][this.name] = {};
        global.CreepNum[this.name] = {};    // 当前房间各类型的creep数量
        global.SpawnMissionNum[this.name] = {};    // 当前房间孵化队列中各类型的creep数量
        this.initMissionPool(); // 初始化任务池
        this.update();  // 初始化缓存
    }
}

