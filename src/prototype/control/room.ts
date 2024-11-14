
export default {
    room: {
        // 添加房间
        add(roomName: string, mode: string, layout?: string, x?: number, y?: number) {
            const BOT_NAME = global.BaseConfig.BOT_NAME;
            if(!Memory[BOT_NAME]['rooms'][roomName])
                Memory[BOT_NAME]['rooms'][roomName] = {};
            Memory[BOT_NAME]['rooms'][roomName].mode = mode ?? 'main';
            if(layout) Memory[BOT_NAME]['rooms'][roomName].layout = layout;
            if(x && y) Memory[BOT_NAME]['rooms'][roomName].center = {x, y};
            console.log(`已添加房间${roomName}。`);
            return OK;
        },
        // 删除房间
        remove(roomName: string) {
            delete Memory[global.BOT_NAME]['rooms'][roomName];
            console.log(`已删除房间${roomName}。`);
            return OK;
        },
        // 查看房间列表
        list() {
            console.log(`房间列表：${Object.keys(Memory[global.BOT_NAME]['rooms']).join('、')}`);
            return OK;
        },
        // 设置房间模式
        setmode(roomName: string, mode: string='main') {
            const room = Game.rooms[roomName];
            if(!room || !room.my || !Memory[global.BOT_NAME]['rooms'][roomName]) {
                console.log(`房间${roomName}不存在、未拥有或未添加。`);
                return OK;
            }
            Memory[global.BOT_NAME]['rooms'][roomName].mode = mode;
            console.log(`已设置${roomName}的运行模式为${mode}。`);
            return OK;
        },
        // 设置房间布局
        setlayout(roomName: string, layout: string, x?: number, y?: number) {
            const room = Game.rooms[roomName];
            if(!room || !room.my || !Memory[global.BOT_NAME]['rooms'][roomName]) {
                console.log(`房间${roomName}不存在、未拥有或未添加。`);
                return;
            }
            if(!layout) {
                Memory[global.BOT_NAME]['rooms'][roomName].layout = '';
                delete Memory[global.BOT_NAME]['rooms'][roomName].center;
                console.log(`已清除 ${roomName} 的布局设置。`);
                return;
            }
            Memory[global.BOT_NAME]['rooms'][roomName].layout = layout;
            Memory[global.BOT_NAME]['rooms'][roomName].center = { x, y };
            if(x && y) Memory['rooms'][roomName].centralPos = { x, y };
            const pos = Memory['rooms'][roomName].centralPos;
            console.log(`已设置 ${roomName} 的布局为 ${layout}, 布局中心为 (${pos.x},${pos.y})`);
            return;
        },
        // 设置房间中心
        setcenter(roomName: string, x: number, y: number) {
            const room = Game.rooms[roomName];
            if(!room || !room.my || !Memory[global.BOT_NAME]['rooms'][roomName]) {
                console.log(`房间 ${roomName} 不存在、未拥有或未添加。`);
                return;
            }
            Memory[global.BOT_NAME]['rooms'][roomName].center = { x, y };
            Memory['rooms'][roomName].centralPos = { x, y };
            console.log(`已设置 ${roomName} 的布局中心为 (${x},${y})。`);
            return;
        },
        // 开关自动布局
        autolayout(roomName: string) {
            const room = Game.rooms[roomName];
            if(!room || !room.my || !Memory[global.BOT_NAME]['rooms'][roomName]) {
                console.log(`房间 ${roomName} 不存在、未拥有或未添加。`);
                return;
            }
            const layout = Memory[global.BOT_NAME]['rooms'][roomName].layout;
            if(!layout) {
                console.log(`房间 ${roomName} 未设置布局。`);
                return;
            }
            const center = Memory[global.BOT_NAME]['rooms'][roomName].center;
            if(layout && !center) {
                console.log(`房间  ${roomName} 未设置布局中心。`);
                return;
            }
            const memory = Memory[global.BOT_NAME]['rooms'][roomName];
            memory.autolayout = !memory.autolayout;
            console.log(`已${memory.autolayout ? '开启' : '关闭'} ${roomName} 的自动布局.`);
            return OK;
        },
        // 开启lab
        labopen(roomName: string) {
            const room = Game.rooms[roomName];
            room.memory.lab = true;
            console.log(`已开启 ${roomName} 的lab合成。`);
            return;
        },
        // 关闭lab
        labstop(roomName: string) {
            const room = Game.rooms[roomName];
            room.memory.lab = false;
            console.log(`已关闭 ${roomName} 的lab合成。`);
            return;
        },
        // 设置lab合成底物
        setLab(roomName: string, A: string, B: string) {
            const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            const room = Game.rooms[roomName];
            room.memory.labAtype = RESOURCE_ABBREVIATIONS[A] || A;
            room.memory.labBtype = RESOURCE_ABBREVIATIONS[B] || B;
            console.log(`已设置 ${roomName} 的lab合成底物为 ${A} 和 ${B}。`);
            return OK;
        },
        // 开启factory
        factoryopen(roomName: string) {
            const room = Game.rooms[roomName];
            room.memory.factory = true;
            console.log(`已开启${roomName}的factory。`);
            return OK;
        },
        // 关闭factory
        factorystop(roomName: string) {
            const room = Game.rooms[roomName];
            room.memory.factory = false;
            console.log(`已关闭${roomName}的factory。`);
            return OK;
        },
        // 设置factory等级
        setFactoryLevel(roomName: string, level: number) {
            const room = Game.rooms[roomName];
            room.memory.factoryLevel = level;
            console.log(`已设置${roomName}的factory等级为${level}。`);
            return OK;
        },
        // 开启powerSpawn
        psopen(roomName: string) {
            const room = Game.rooms[roomName];
            room.memory.powerSpawn = true;
            console.log(`已开启${roomName}的powerSpawn。`);
            return OK;
        },
        // 关闭powerSpawn
        psstop(roomName: string) {
            const room = Game.rooms[roomName];
            room.memory.powerSpawn = false;
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
        addManageTask(roomName: string, source: 's'|'t'|'f'|'l', target: 's'|'t'|'f'|'l', type: string, amount: number) {
            const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            type = RESOURCE_ABBREVIATIONS[type] || type;
            const room = Game.rooms[roomName];
            room.ManageMissionAdd(source, target, type, amount);
            console.log(`在房间 ${room.name} 添加了中央搬运任务: 从 ${source} 到 ${target}, 资源类型 ${type}, 数量 ${amount}`);
            return OK;
        }
    },
    autoFactory: {
        list(roomName: string) {
            if(roomName) {
                const autoFactory = Memory[global.BOT_NAME]['autoFactory'][roomName];
                if(!autoFactory || autoFactory.length == 0) {
                    console.log(`房间 ${roomName} 没有开启自动factory生产`);
                }
                else {
                    console.log(`房间 ${roomName} 的自动factory生产：${autoFactory}`);
                }
                return OK;
            }

            const autoFactory = Memory[global.BOT_NAME]['autoFactory'];
            if(!autoFactory || Object.keys(autoFactory).length == 0) {
                console.log(`没有房间开启自动factory生产`);
            }
            for(const room in autoFactory) {
                if(!autoFactory[room] || autoFactory[room].length == 0) {
                    continue;
                }
                console.log(`房间 ${room} 的自动factory生产：${autoFactory[room]}`);
            }
            return OK;
        },
        add(roomName: string, res: string) {
            const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            res = RESOURCE_ABBREVIATIONS[res] || res;
            Memory[global.BOT_NAME]['autoFactory'][roomName] = res;
            console.log(`已设置 ${roomName} 的factory自动生产任务为${res}。`);
            return OK;
        },
        remove(roomName: string) {
            delete Memory[global.BOT_NAME]['autoFactory'][roomName];
            console.log(`已删除 ${roomName} 的factory自动生产任务。`);
            return OK;
        }
    },
}