/**
 * 房间工作模块，具体工作由原型拓展定义
 */
export const roomRunner = function (room: Room) {
    // 定期更新建筑缓存
    if (Game.time % 100 == 0) room.update();

    // 只运行自己的房间
    if (!room || !room.controller?.my) return;
    // 不运行未加入控制列表的房间
    if (!Memory['RoomControlData'][room.name]) return;

    // 初始化
    if (!Memory.MissionPools[room.name])
        room.init();

    // 房间运行
    room.MissionUpdate();    // 更新任务池
    room.StructureWork();    // 处理建筑行为
    room.activeDefend();     // 主动防御处理
    room.autoMarket();       // 自动市场交易
    room.autoBuild();        // 自动建筑
    room.autoLab();          // 自动Lab合成
    room.autoFactory();      // 自动Factory生产
    room.outMine();          // 外矿采集

}