export const MemoryInit = {
    tickStart: () => {
        // 检查主要内存是否已初始化
        if(!Memory['RoomControlData']) Memory['RoomControlData'] = {};
        if(!Memory['StructControlData']) Memory['StructControlData'] = {};
        if(!Memory['LayoutData']) Memory['LayoutData'] = {};
        if(!Memory['OutMineData']) Memory['OutMineData'] = {};
        if(!Memory['AutoData']) Memory['AutoData'] = {};
        if(!Memory['AutoData']['AutoMarketData']) Memory['AutoData']['AutoMarketData'] = {};
        if(!Memory['AutoData']['AutoLabData']) Memory['AutoData']['AutoLabData'] = {};
        if(!Memory['AutoData']['AutoFactoryData']) Memory['AutoData']['AutoFactoryData'] = {};
        if(!Memory['ResourceManage']) Memory['ResourceManage'] = {};
        if(!Memory['MissionPools']) Memory['MissionPools'] = {};
    }
}
