import { RoleData, RoleBodys } from '@/constant/CreepConstant';

export default {
    spawn: {
        role(roomName: string, role: string, memory: any, num?: number) {
            if (!roomName || !role) return -1;
            if (!RoleData[role]) return -1;
            if (!num) num = 1;
            const room = Game.rooms[roomName];
            if (!memory.home && !memory.homeRoom) {
                memory.homeRoom = roomName;
            }
            for (let i = 0; i < num; i++) {
                room.SpawnMissionAdd('', [], -1, role, memory);
            }
            console.log(`[${roomName}] 即将孵化 ${role}, 数量: ${num} \n memory: ${JSON.stringify(memory)}`);
            return 0;
        },
        onebody(roomName: string, targetRoom: string, type: string, T: string) {
            if (!(['ranged', 'tough', 'attack'].includes(type))) return Error('没有该一体机类型');
            const room = Game.rooms[roomName];
            const bodypart = RoleBodys[`one-${type}`]?.[T];
            room.SpawnMissionAdd('', (bodypart||[]), -1, `one-${type}`, {targetRoom: targetRoom} as any);
            console.log(`[${roomName}] 即将孵化${type}一体机到${targetRoom}。`);
            return 0;
        },
        doublesquad(roomName: string, targetRoom: string, squad: string, TA?: string, TB?: string) {
            if (!(['attack', 'dismantle', 'carry'].includes(squad))) return Error('没有该双人小队类型');
            const room = Game.rooms[roomName];
            const bodypart1 = RoleBodys[`double-${squad}`]?.[TA];
            const bodypart2 = RoleBodys['double-heal']?.[TB];
            room.SpawnMissionAdd('', (bodypart1||[]), -1, `double-${squad}`, {squad: squad, targetRoom: targetRoom} as any);
            room.SpawnMissionAdd('', (bodypart2||[]), -1, 'double-heal', {squad: squad, targetRoom: targetRoom} as any);
            console.log(`[${roomName}] 即将孵化${squad}双人小队到${targetRoom}。`);
            return 0;
        },
    }
}