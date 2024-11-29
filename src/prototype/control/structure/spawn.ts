export default {
    spawn: {
        doubleSquad(roomName: string, targetRoom: string, squad: string) {
            if (!(['attack', 'dismantle', 'carry', 'tough'].includes(squad))) return -1;
            const room = Game.rooms[roomName];
            room.SpawnMissionAdd('', [], -1, `double-${squad}`, {squad: squad, targetRoom: targetRoom} as any);
            room.SpawnMissionAdd('', [], -1, 'double-heal', {squad: squad, targetRoom: targetRoom} as any);
            return 0;
        },
        oneBody(roomName: string, targetRoom: string, type: string) {
            if (!(['ranged', 'tough'].includes(type))) return -1;
            const room = Game.rooms[roomName];
            room.SpawnMissionAdd('', [], -1, `one-${type}`, {targetRoom: targetRoom} as any);
            console.log(`[${roomName}] 即将孵化 ${type} 一体机。`);
            return 0;
        }
    }
}