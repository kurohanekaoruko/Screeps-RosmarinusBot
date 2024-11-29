export default {
    factory: {
        // 开启factory
        open(roomName: string) {
            const room = Game.rooms[roomName];
            const BotMemStructures =  global.BotMem('structures');
            if(!room || !room.my || !BotMemStructures[roomName]) {
                global.log(`房间 ${roomName} 不存在、未拥有或未添加。`);
                return;
            }
            BotMemStructures[roomName]['factory'] = true;
            global.log(`已开启 ${roomName} 的factory。`);
            return OK;
        },
        // 关闭factory
        stop(roomName: string) {
            const room = Game.rooms[roomName];
            const BotMemStructures =  global.BotMem('structures');
            if(!room || !room.my || !BotMemStructures[roomName]) {
                global.log(`房间 ${roomName} 不存在、未拥有或未添加。`);
                return;
            }
            BotMemStructures[roomName]['factory'] = false;
            global.log(`已关闭 ${roomName} 的factory。`);
            return OK;
        },
        // 设置factory合成
        set(roomName: string, goods: string) {
            const RES = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            const room = Game.rooms[roomName];
            const BotMemStructures =  global.BotMem('structures');
            if(!room || !room.my || !BotMemStructures[roomName]) {
                global.log(`房间 ${roomName} 不存在、未拥有或未添加。`);
                return;
            }
            BotMemStructures[roomName]['factoryTask'] = RES[goods] || goods;
            global.log(`[${roomName}]已设置factory生产任务为 ${RES[goods] || goods}。`);
            BotMemStructures[roomName]['factory'] = true;
            global.log(`[${roomName}]已开启factory。`);
            return OK;
        },
        // 设置factory等级
        setlevel(roomName: string, level: number) {
            const room = Game.rooms[roomName];
            const BotMemStructures =  global.BotMem('structures');
            if(!room || !room.my || !BotMemStructures[roomName]) {
                global.log(`[${roomName}]房间不存在、未拥有或未添加。`);
                return;
            }
            if(level < 0 || level > 5) {
                global.log(`[${roomName}]factory等级 ${level} 不存在。`);
                return;
            }
            BotMemStructures[roomName]['factoryLevel'] = level;
            room.memory.factoryLevel = level;
            global.log(`[${roomName}]已设置factory等级为 ${level}。`);
            return OK;
        },
        auto: {
            list(roomName: string) {
                const BotMemAutoFactory = global.BotMem('autoFactory');
                if(roomName) {
                    const autoFactory = BotMemAutoFactory[roomName];
                    if(!autoFactory || autoFactory.length == 0) {
                        global.log(`[${roomName}]没有开启自动factory生产`);
                    }
                    else {
                        global.log(`[${roomName}]自动factory生产：${autoFactory}`);
                    }
                    return OK;
                }
    
                if(!BotMemAutoFactory || Object.keys(BotMemAutoFactory).length == 0) {
                    global.log(`没有房间开启自动factory生产`);
                }
                for(const room in BotMemAutoFactory) {
                    if(!BotMemAutoFactory[room] || BotMemAutoFactory[room].length == 0) {
                        continue;
                    }
                    global.log(`[${room}]自动factory生产：${BotMemAutoFactory[room]}`);
                }
                return OK;
            },
            add(roomName: string, res: string) {
                const RES = global.BaseConfig.RESOURCE_ABBREVIATIONS;
                global.BotMem('autoFactory')[roomName] = RES[res] || res;
                global.log(`已设置 ${roomName} 的factory自动生产任务为${res}。`);
                return OK;
            },
            remove(roomName: string) {
                global.removeBotMem('autoFactory', roomName);
                global.log(`已删除 ${roomName} 的factory自动生产任务。`);
                return OK;
            }
        },
    }
}