
export default {
    room: {
        // 添加房间
        add(roomName: string, mode: string, layout?: string, x?: number, y?: number) {
            const BotMemRooms =  global.BotMem('rooms');
            if(!BotMemRooms[roomName]) 
                BotMemRooms[roomName] = {};
            BotMemRooms[roomName]['mode'] = mode ?? 'main';
            if(layout) BotMemRooms[roomName]['layout'] = layout;
            if(x && y) BotMemRooms[roomName]['center'] = {x, y};
            console.log(`已添加房间${roomName}。`);
            Game.rooms[roomName].init();
            return OK;
        },
        // 删除房间
        remove(roomName: string) {
            global.removeBotMem('rooms', roomName);
            console.log(`已删除房间${roomName}。`);
            return OK;
        },
        // 查看房间列表
        list() {
            console.log(`房间列表：${Object.keys(global.BotMem('rooms')).join('、')}`);
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
            console.log(`已设置 ${roomName} 的运行模式为 ${mode}。`);
            return OK;
        },
        // 设置房间布局
        setlayout(roomName: string, layout: string, x?: number, y?: number) {
            const room = Game.rooms[roomName];
            const BotMemRooms =  global.BotMem('rooms');
            if(!room || !room.my || !BotMemRooms[roomName]) {
                return Error(`房间 ${roomName} 不存在、未拥有或未添加。`);
            }
            if(!layout) {
                BotMemRooms[roomName]['layout'] = '';
                global.removeBotMem('rooms', roomName, 'center')
                console.log(`已清除 ${roomName} 的布局设置。`);
                return OK;
            }
            BotMemRooms[roomName]['layout'] = layout;
            BotMemRooms[roomName]['center'] = { x, y };
            if(x && y) Memory['rooms'][roomName].centralPos = { x, y };
            const pos = Memory['rooms'][roomName].centralPos;
            console.log(`已设置 ${roomName} 的布局为 ${layout}, 布局中心为 (${pos.x},${pos.y})`);
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
            Memory['rooms'][roomName].centralPos = { x, y };
            console.log(`已设置 ${roomName} 的布局中心为 (${x},${y})。`);
            return OK;
        },
        // 开关自动布局
        autolayout(roomName: string) {
            const room = Game.rooms[roomName];
            const BotMemRooms =  global.BotMem('rooms');
            if(!room || !room.my || !BotMemRooms[roomName]) {
                return Error(`房间 ${roomName} 不存在、未拥有或未添加。`);
            }
            const layout = BotMemRooms[roomName]['layout'];
            if(!layout) {
                return Error(`房间 ${roomName} 未设置布局。`);
            }
            const center = BotMemRooms[roomName]['center'];
            if(layout && !center) {
                return Error(`房间  ${roomName} 未设置布局中心。`);
            }
            const memory = BotMemRooms[roomName];
            memory.autolayout = !memory.autolayout;
            console.log(`已${memory.autolayout ? '开启' : '关闭'} ${roomName} 的自动布局.`);
            return OK;
        },
        removelayout(roomName: string) {
            global.BotMem('layoutMemory')[roomName] = '';
            console.log(`已清除 ${roomName} 的布局memory。`);
            return OK;
        },
        // 开启lab
        labopen(roomName: string) {
            const room = Game.rooms[roomName];
            const BotMemStructures =  global.BotMem('structures');
            if(!room || !room.my || !BotMemStructures[roomName]) {
                console.log(`房间 ${roomName} 不存在、未拥有或未添加。`);
                return;
            }
            BotMemStructures[roomName]['lab'] = true;
            console.log(`已开启 ${roomName} 的lab合成。`);
            return OK;
        },
        // 关闭lab
        labstop(roomName: string) {
            const room = Game.rooms[roomName];
            const BotMemStructures =  global.BotMem('structures');
            if(!room || !room.my || !BotMemStructures[roomName]) {
                console.log(`房间 ${roomName} 不存在、未拥有或未添加。`);
                return;
            }
            BotMemStructures[roomName]['lab'] = false;
            console.log(`已关闭 ${roomName} 的lab合成。`);
            return OK;
        },
        // 设置lab合成底物
        setlab(roomName: string, A: string, B: string) {
            const RES = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            const room = Game.rooms[roomName];
            const BotMemStructures =  global.BotMem('structures');
            if(!room || !room.my || !BotMemStructures[roomName]) {
                console.log(`房间 ${roomName} 不存在、未拥有或未添加。`);
                return;
            }
            BotMemStructures[roomName]['labAtype'] = RES[A] || A;
            BotMemStructures[roomName]['labBtype'] = RES[B] || B;
            console.log(`已设置 ${roomName} 的lab合成底物为 ${RES[A] || A} 和 ${RES[B] || B}。`);
            const labAflag = Game.flags[`labA`] || Game.flags[`lab-A`];
            const labBflag = Game.flags[`labB`] || Game.flags[`lab-B`];
            if(labAflag && labBflag && labAflag.pos.roomName === roomName && labBflag.pos.roomName === roomName) {
                const labA = labAflag.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_LAB);
                const labB = labBflag.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_LAB);
                BotMemStructures[roomName]['labA'] = labA.id;
                BotMemStructures[roomName]['labB'] = labB.id;
                console.log(`已设置 ${roomName} 的底物lab为 ${labA.id} 和 ${labB.id}。`);
                labAflag.remove();
                labBflag.remove();
            }
            BotMemStructures[roomName]['lab'] = true;
            console.log(`已开启 ${roomName} 的lab合成。`);
            return OK;
        },
        // 开启factory
        factoryopen(roomName: string) {
            const room = Game.rooms[roomName];
            const BotMemStructures =  global.BotMem('structures');
            if(!room || !room.my || !BotMemStructures[roomName]) {
                console.log(`房间 ${roomName} 不存在、未拥有或未添加。`);
                return;
            }
            BotMemStructures[roomName]['factory'] = true;
            console.log(`已开启 ${roomName} 的factory。`);
            return OK;
        },
        // 关闭factory
        factorystop(roomName: string) {
            const room = Game.rooms[roomName];
            const BotMemStructures =  global.BotMem('structures');
            if(!room || !room.my || !BotMemStructures[roomName]) {
                console.log(`房间 ${roomName} 不存在、未拥有或未添加。`);
                return;
            }
            BotMemStructures[roomName]['factory'] = false;
            console.log(`已关闭 ${roomName} 的factory。`);
            return OK;
        },
        // 设置factory合成
        setfactory(roomName: string, goods: string) {
            const RES = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            const room = Game.rooms[roomName];
            const BotMemStructures =  global.BotMem('structures');
            if(!room || !room.my || !BotMemStructures[roomName]) {
                console.log(`房间 ${roomName} 不存在、未拥有或未添加。`);
                return;
            }
            BotMemStructures[roomName]['factoryTask'] = RES[goods] || goods;
            console.log(`已设置 ${roomName} 的factory生产任务为 ${RES[goods] || goods}。`);
            BotMemStructures[roomName]['factory'] = true;
            console.log(`已开启 ${roomName} 的factory。`);
            return OK;
        },
        // 设置factory等级
        setfactorylevel(roomName: string, level: number) {
            const room = Game.rooms[roomName];
            const BotMemStructures =  global.BotMem('structures');
            if(!room || !room.my || !BotMemStructures[roomName]) {
                console.log(`房间 ${roomName} 不存在、未拥有或未添加。`);
                return;
            }
            if(level < 0 || level > 5) {
                console.log(`factory等级 ${level} 不存在。`);
                return;
            }
            BotMemStructures[roomName]['factoryLevel'] = level;
            room.memory.factoryLevel = level;
            console.log(`已设置 ${roomName} 的factory等级为 ${level}。`);
            return OK;
        },
        // 开启powerSpawn
        psopen(roomName: string) {
            const room = Game.rooms[roomName];
            const BotMemStructures =  global.BotMem('structures');
            if(!room || !room.my || !BotMemStructures[roomName]) {
                console.log(`房间 ${roomName} 不存在、未拥有或未添加。`);
                return;
            }
            BotMemStructures[roomName]['powerSpawn'] = true;
            console.log(`已开启${roomName}的powerSpawn。`);
            return OK;
        },
        // 关闭powerSpawn
        psstop(roomName: string) {
            const room = Game.rooms[roomName];
            const BotMemStructures =  global.BotMem('structures');
            if(!room || !room.my || !BotMemStructures[roomName]) {
                console.log(`房间 ${roomName} 不存在、未拥有或未添加。`);
                return;
            }
            BotMemStructures[roomName]['powerSpawn'] = false;
            console.log(`已关闭${roomName}的powerSpawn。`);
            return OK;
        },
        // 孵化powerCreep
        pcspawn(roomName: string, pcname: string) {
            const room = Game.rooms[roomName];
            const result = Game.powerCreeps[pcname].spawn(room.powerSpawn);
            if(result === OK) {
                console.log(`${roomName} 的 powerSpawn 孵化了 powerCreep ${pcname} `);
            }
            else {
                console.log(`${roomName} 的 powerSpawn 孵化 powerCreep ${pcname} 失败，错误码 ${result}`);
            }
            return OK;
        },
        // 添加中央搬运任务
        manage(roomName: string, source: 's'|'t'|'f'|'l', target: 's'|'t'|'f'|'l', type: string, amount: number) {
            const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            type = RESOURCE_ABBREVIATIONS[type] || type;
            const room = Game.rooms[roomName];
            room.ManageMissionAdd(source, target, type, amount);
            console.log(`在房间 ${room.name} 添加了中央搬运任务: 从 ${source} 到 ${target}, 资源类型 ${type}, 数量 ${amount}`);
            return OK;
        },
        // 添加发送任务
        send(roomName: string, targetRoom: string, type: string, amount: number) {
            const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            type = RESOURCE_ABBREVIATIONS[type] || type;
            const room = Game.rooms[roomName];
            room.SendMissionAdd(targetRoom, type, amount);
            console.log(`在房间 ${room.name} 添加了发送任务: 发送到 ${targetRoom}, 资源类型 ${type}, 数量 ${amount}`);
            return OK;
        }
    },
    autoFactory: {
        list(roomName: string) {
            const BotMemAutoFactory = global.BotMem('autoFactory');
            if(roomName) {
                const autoFactory = BotMemAutoFactory[roomName];
                if(!autoFactory || autoFactory.length == 0) {
                    console.log(`房间 ${roomName} 没有开启自动factory生产`);
                }
                else {
                    console.log(`房间 ${roomName} 的自动factory生产：${autoFactory}`);
                }
                return OK;
            }

            if(!BotMemAutoFactory || Object.keys(BotMemAutoFactory).length == 0) {
                console.log(`没有房间开启自动factory生产`);
            }
            for(const room in BotMemAutoFactory) {
                if(!BotMemAutoFactory[room] || BotMemAutoFactory[room].length == 0) {
                    continue;
                }
                console.log(`房间 ${room} 的自动factory生产：${BotMemAutoFactory[room]}`);
            }
            return OK;
        },
        add(roomName: string, res: string) {
            const RES = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            global.BotMem('autoFactory')[roomName] = RES[res] || res;
            console.log(`已设置 ${roomName} 的factory自动生产任务为${res}。`);
            return OK;
        },
        remove(roomName: string) {
            global.removeBotMem('autoFactory', roomName);
            console.log(`已删除 ${roomName} 的factory自动生产任务。`);
            return OK;
        }
    },
}