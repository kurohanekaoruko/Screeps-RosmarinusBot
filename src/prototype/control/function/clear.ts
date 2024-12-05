export default {
    clear: {
        site(roomName: string) {
            const room = Game.rooms[roomName];
            if(!room) {
                return Error(`无房间视野`);
            }
            const site = room.find(FIND_MY_CONSTRUCTION_SITES);
            if(site.length === 0) {
                return Error(`无建筑工地`);
            } else {
                for(const s of site) {
                    s.remove();
                }
                return OK;
            }
        },
        mission(roomName: string, type: string) {
            Memory.MissionPools[roomName][type] = [];
            console.log(`已清空房间 ${roomName} 的 ${type} 任务`);
            return OK;
        },
    }
}