import { signConstant } from "@/constant/signConstant";

// 房间控制
export default {
    room: {
        // 添加房间
        add(roomName: string, mode?: string, layout?: string, x?: number, y?: number) {
            const BotMemRooms =  global.BotMem('rooms');
            if(!BotMemRooms[roomName]) BotMemRooms[roomName] = {};
            BotMemRooms[roomName]['mode'] = mode ?? 'main';
            global.log(`已添加房间${roomName}。`);
            if(layout) {
                BotMemRooms[roomName]['layout'] = layout;
                global.log(`已设置 ${roomName} 的布局为 ${layout}。`);
            }
            if(x && y) {
                BotMemRooms[roomName]['center'] = {x, y};
                global.log(`已设置 ${roomName} 的布局中心为 (${x},${y})。`);
            }
            Game.rooms[roomName].init();
            return OK;
        },
        // 删除房间
        remove(roomName: string) {
            global.removeBotMem('rooms', roomName);
            global.log(`已删除房间${roomName}。`);
            return OK;
        },
        // 查看房间列表
        list() {
            global.log(`房间列表：${Object.keys(global.BotMem('rooms')).join('、')}`);
            return OK;
        },
        // 设置房间模式
        setmode(roomName: string, mode: string='main') {
            const room = Game.rooms[roomName];
            const BotMemRooms =  global.BotMem('rooms');
            if(!room || !room.my || !BotMemRooms[roomName]) {
                return Error(`房间 ${roomName} 不存在、未拥有或未添加。`);
            }
            BotMemRooms[roomName]['mode'] = mode;
            global.log(`已设置 ${roomName} 的运行模式为 ${mode}。`);
            return OK;
        },
        // 设置房间中心
        setcenter(roomName: string, x: number, y: number) {
            const room = Game.rooms[roomName];
            const BotMemRooms =  global.BotMem('rooms');
            if(!room || !room.my || !BotMemRooms[roomName]) {
                return Error(`房间 ${roomName} 不存在、未拥有或未添加。`);
            }
            BotMemRooms[roomName].center = { x, y };
            global.log(`已设置 ${roomName} 的布局中心为 (${x},${y})。`);
            return OK;
        },
        // 设置签名
        sign(roomName: string, text?: string) {
            const room = Game.rooms[roomName];
            if(!room || !room.my) {
                return Error(`房间 ${roomName} 不存在或未拥有。`);
            }
            const botMem = global.BotMem('rooms', roomName);
            botMem['sign'] = text ?? signConstant[Math.floor(Math.random() * signConstant.length)];
            global.log(`已设置 ${roomName} 的房间签名为:\n ${text}。`);
            return OK;
        },
        // 设置刷墙上限
        setram(roomName: string, hits: number) {
            const botMem = global.BotMem('structures', roomName);
            if (hits <= 0) {
                console.log(`输入的数值必须大于0.`);
                return -1;
            }
            if (hits <= 1) {
                botMem['ram_threshold'] = hits;
                console.log(`已设置 ${roomName} 的刷墙上限比例为 ${hits}。`);
            } else {
                botMem['ram_threshold'] = hits / 3e8;
                console.log(`已设置 ${roomName} 的刷墙上限比例为 ${hits / 3e8}。`);
            }
            return OK;
        },
        // 开启冲级
        spup(roomName: string, num?: number) {
            const room = Game.rooms[roomName];
            if(!room || !room.my) return Error(`房间 ${roomName} 不存在或未拥有。`);
            const botMem = global.BotMem('rooms', roomName);
            botMem['spup'] = Math.floor(num ?? 0);
            global.log(`已设置 ${roomName} 的冲级状态为 ${botMem['spup'] ? '开启' : '关闭'}。`);
            if(botMem['spup']) global.log(`冲级数量为 ${botMem['spup']}。`);
            return OK;
        },
        // 加速刷墙
        spre(roomName: string, num?: number) {
            const room = Game.rooms[roomName];
            if(!room || !room.my) return Error(`房间 ${roomName} 不存在或未拥有。`);
            const botMem = global.BotMem('rooms', roomName);
            botMem['spre'] = Math.floor(num ?? 0);
            global.log(`已设置 ${roomName} 的加速刷墙状态为 ${botMem['spre'] ? '开启' : '关闭'}。`);
            if(botMem['spre']) global.log(`加速刷墙数量为 ${botMem['spre']}。`);
            return OK;
        },
        // 添加中央搬运任务
        manage(roomName: string, source: 's'|'t'|'f'|'l', target: 's'|'t'|'f'|'l', type: string, amount: number) {
            const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            type = RESOURCE_ABBREVIATIONS[type] || type;
            const room = Game.rooms[roomName];
            room.ManageMissionAdd(source, target, type, amount);
            global.log(`在房间 ${room.name} 添加了中央搬运任务: 从 ${source} 到 ${target}, 资源类型 ${type}, 数量 ${amount}`);
            return OK;
        },
        // 添加发送任务
        send(roomName: string, targetRoom: string, type: string, amount: number) {
            const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            type = RESOURCE_ABBREVIATIONS[type] || type;
            const room = Game.rooms[roomName];
            room.SendMissionAdd(targetRoom, type, amount);
            global.log(`在房间 ${room.name} 添加了发送任务: 发送到 ${targetRoom}, 资源类型 ${type}, 数量 ${amount}`);
            return OK;
        }
    },
}