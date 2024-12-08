export default {
    nuker: {
        launch(...rooms: string[]) {
            for (const flagName of Object.keys(Game.flags)) {
                const launchNukeMatch = flagName.match(/^launchNuke[-#/ ](\d+)$/);
                if (!launchNukeMatch) continue;
                // 获取目标
                const targetPos = Game.flags[flagName].pos
                const targetRoom = targetPos.roomName
                if (Game.rooms[targetRoom]?.controller?.my) {
                    Game.flags[flagName].remove();
                    return OK;
                }
                // 获取符合发射条件的房间
                if(!rooms || rooms.length === 0) rooms = Object.keys(Game.rooms);
                const nearbyRooms = rooms.filter(room =>
                    Game.rooms[room] &&
                    Game.rooms[room].my &&
                    Game.rooms[room].nuker &&
                    Game.rooms[room].nuker.store[RESOURCE_ENERGY] == 300000 &&
                    Game.rooms[room].nuker.store[RESOURCE_GHODIUM] == 5000 &&
                    Game.rooms[room].nuker.cooldown === 0 &&
                    Game.map.getRoomLinearDistance(room, targetRoom, true) <= 10
                )
                const amount = launchNukeMatch[1] ? parseInt(launchNukeMatch[1]) : 1; // 获取发射数量，默认为1
                let launchedCount = 0; // 已发射数量
                for (const room of nearbyRooms) {
                    const nuker = Game.rooms[room].nuker; // 获取该房间的核弹发射器
                    nuker.launchNuke(targetPos);    // 发射核弹
                    launchedCount++;
                    console.log(`从房间 ${nuker.room.name} 发射核弹到 ${targetRoom} (x:${targetPos.x}  y:${targetPos.y})`);
                    if (launchedCount >= amount) break; // 达到发射数量后退出循环
                }
                return OK;
            }
            return Error(`没有发射成功`);
        }
    }
}