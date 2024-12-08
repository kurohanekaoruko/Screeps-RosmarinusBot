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
        // 设置factory生产
        set(roomName: string, res: string) {
            const RES = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            const room = Game.rooms[roomName];
            const BotMemStructures =  global.BotMem('structures');
            if(!room || !room.my || !BotMemStructures[roomName]) {
                return Error(`房间 ${roomName} 不存在、未拥有或未添加。`);
            }
            res = RES[res] || res;
            if(!COMMODITIES[res]) {
                return Error(`生产目标 ${res} 不存在。`);
            }
            const flv = room.factory?.level || global.BotMem('structures', roomName)?.['factoryLevel'] || 0;
            if(COMMODITIES[res].level && COMMODITIES[res].level != flv) {
                return Error(`生产目标 ${res} 需要factory等级为 ${COMMODITIES[res].level}, 而factory等级不匹配或未设置等级。`);
            }
            BotMemStructures[roomName]['factoryProduct'] = res;
            BotMemStructures[roomName]['factoryAmount'] = 0;
            global.log(`[${roomName}] 已设置factory生产任务为 ${res}。`);
            if (!BotMemStructures[roomName]['factory']) {
                BotMemStructures[roomName]['factory'] = true;
                global.log(`[${roomName}] 已开启factory。`);
            }
            return OK;
        },
        // 设置factory等级
        setlevel(roomName: string, level: number) {
            const room = Game.rooms[roomName];
            const BotMemStructures =  global.BotMem('structures');
            if(!room || !room.my || !BotMemStructures[roomName]) {
                global.log(`[${roomName}] 房间不存在、未拥有或未添加。`);
                return;
            }
            if(level < 0 || level > 5) {
                global.log(`[${roomName}] factory等级 ${level} 不存在。`);
                return;
            }
            BotMemStructures[roomName]['factoryLevel'] = level;
            room.memory.factoryLevel = level;
            global.log(`[${roomName}] 已设置factory等级为 ${level}。`);
            return OK;
        },
        auto(roomName: string, res: string, amount?: number) {
            const RES = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            res = RES[res] || res;
            const room = Game.rooms[roomName];
            if(!room || !room.my) {
                global.log(`房间 ${roomName} 不存在或未拥有。`);
                return;
            }
            if(!COMMODITIES[res]) {
                global.log(`资源 ${res} 不存在。`);
                return;
            }
            const flv = room.factory?.level || global.BotMem('structures', roomName)?.['factoryLevel'];
            if(COMMODITIES[res].level && COMMODITIES[res].level != flv) {
                global.log(`资源 ${res} 的等级 ${COMMODITIES[res].level} 不匹配 factory 等级 ${flv}。`);
                return;
            }
            const BotMemStructures =  global.BotMem('autoFactory');
            if(!BotMemStructures[roomName]) BotMemStructures[roomName] = {};

            if (amount >= 0) {
                BotMemStructures[roomName][res] = amount;
                global.log(`已设置 ${roomName} 的factory自动生产: ${res} - ${amount}。`);
                return OK;
            } else {
                delete BotMemStructures[roomName][res];
                global.log(`已删除 ${roomName} 的factory自动生产: ${res}。`);
                return OK;
            }
            
        },
        autolist(roomName: string) {
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
        
    }
}