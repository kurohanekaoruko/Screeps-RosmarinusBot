import { compress, compressBatch, decompressBatch } from '@/utils';

export default {
    layout: {
        // 设置房间布局
        set(roomName: string, layout: string, x: number, y: number) {
            const room = Game.rooms[roomName];
            const BotMemRooms =  global.BotMem('rooms');
            if(!room || !room.my || !BotMemRooms[roomName]) {
                return Error(`房间 ${roomName} 不存在、未拥有或未添加。`);
            }
            if (!layout) {
                BotMemRooms[roomName]['layout'] = '';
                delete BotMemRooms[roomName]['center'];
                global.log(`已清除 ${roomName} 的布局设置。`);
                return OK;
            }
            if (!x || !y) {
                return Error(`需要输入正确的布局中心坐标。`);
            }
            BotMemRooms[roomName]['layout'] = layout;
            BotMemRooms[roomName]['center'] = { x, y };
            global.log(`已设置 ${roomName} 的布局为 ${layout}, 布局中心为 (${x},${y})`);
            return OK;
        },
        // 开关自动建筑
        auto(roomName: string) {
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
            memory.autobuild = !memory.autobuild;
            global.log(`已${memory.autobuild ? '开启' : '关闭'} ${roomName} 的自动建筑.`);
            return OK;
        },
        // 清除房间布局memory
        remove(roomName: string) {
            global.removeBotMem('layout', roomName);
            global.log(`已清除 ${roomName} 的布局memory。`);
            return OK;
        },
        // 自动布局
        build(roomName: string) {
            const BotMemRooms =  global.BotMem('rooms');
            if (!BotMemRooms[roomName]) {
                return Error(`房间 ${roomName} 未添加到控制列表。`);
            }
            const layoutMemory = global.BotMem('layout', roomName);
            if (layoutMemory && Object.keys(layoutMemory).length) {
                return Error(`房间 ${roomName} 的布局memory已存在，请先使用 layout.remove(roomName) 清除。`);
            }
            const room = Game.rooms[roomName];
            const layoutType = BotMemRooms[roomName]['layout'];

            // 如果没有设置布局就会使用自动布局
            if (!layoutType || layoutType == '63') {
                autoPlanner(room);
            } else {
                buildPlanner(room, layoutType);
            }
        },
        // 查看布局可视化
        visual(roomName: string) {
            const layoutMemory = global.BotMem('layout', roomName);
            if (!layoutMemory) {
                return Error(`房间 ${roomName} 的布局memory不存在。`);
            }
            if (Object.keys(layoutMemory).length == 0) {
                return Error(`房间 ${roomName} 的布局memory为空。`);
            }
            const structMap = {};
            for (const s in layoutMemory) {
                structMap[s] = decompressBatch(layoutMemory[s]);
            }
            const autoPlanner63 = require("autoPlanner63");
            autoPlanner63.HelperVisual.showRoomStructures(roomName, structMap);
            return OK;
        },
        // 从布局memory添加或删除所选rampart
        rampart(roomName: string, operate=1) {
            const flag = Game.flags['layout-rampart'];
            if (!flag) {
                console.log('未找到`layout-rampart`旗帜标记');
            }
            const rampart = []
            if (flag.pos.lookFor(LOOK_STRUCTURES).filter((s) => s.structureType === STRUCTURE_RAMPART).length > 0) {
                rampart.push(compress(flag.pos.x, flag.pos.y));
                const queue = [[flag.pos.x, flag.pos.y]];
                const done = {}
                while (queue.length > 0) {
                    const pos = queue.shift();
                    const x = pos[0];
                    const y = pos[1];
                    if (x < 0 || x > 49 || y < 0 || y > 49) continue;
                    const xy = [[x-1, y], [x+1, y], [x, y-1], [x, y+1]];
                    for (const p of xy) {
                        const px = p[0];
                        const py = p[1];
                        if (px < 0 || px > 49 || py < 0 || py > 49) continue;
                        const pos1 = new RoomPosition(px, py, flag.pos.roomName);
                        if (!done[compress(px, py)] && 
                            pos1.lookFor(LOOK_STRUCTURES)
                            .filter((s) => s.structureType === STRUCTURE_RAMPART).length > 0) {
                            rampart.push(compress(pos1.x, pos1.y));
                            queue.push([px, py]);
                        }
                    }
                    done[compress(x, y)] = true;
                }
            } else {
                console.log('`layout-rampart`旗帜没有放置到rampart上');
            }
            flag.remove();
            let count = 0;
            if(operate === 1) {
                const memory = global.BotMem('layout', roomName);
                if (!memory.rampart) memory.rampart = [];
                for(const ram of rampart) {
                    if(!memory.rampart.includes(ram)) {
                        memory.rampart.push(ram);
                        count++;
                    }
                }
                console.log(`已添加${count}个rampart到布局memory`);
                return OK;
            }
            else {
                const memory = global.BotMem('layout', roomName);
                for(const ram of rampart) {
                    if (memory.rampart.includes(ram)) {
                        memory.rampart.splice(memory.rampart.indexOf(ram), 1);
                        count++;
                    }
                }
                console.log(`已从布局memory删除${count}个rampart`);
                return OK;
            }
        },
        wall(roomName: string, operate=1) {
            const flag = Game.flags['layout-wall'];
            if (!flag) {
                console.log('未找到`layout-wall`旗帜标记');
            }
            const constructedWall = []
            if (flag.pos.lookFor(LOOK_STRUCTURES).filter((s) => s.structureType === STRUCTURE_WALL).length > 0) {
                constructedWall.push(compress(flag.pos.x, flag.pos.y));
                const queue = [[flag.pos.x, flag.pos.y]];
                const done = {}
                while (queue.length > 0) {
                    const pos = queue.shift();
                    const x = pos[0];
                    const y = pos[1];
                    if (x < 0 || x > 49 || y < 0 || y > 49) continue;
                    const xy = [[x-1, y], [x+1, y], [x, y-1], [x, y+1]];
                    for (const p of xy) {
                        const px = p[0];
                        const py = p[1];
                        if (px < 0 || px > 49 || py < 0 || py > 49) continue;
                        const pos1 = new RoomPosition(px, py, flag.pos.roomName);
                        if (!done[compress(px, py)] && 
                            pos1.lookFor(LOOK_STRUCTURES)
                            .filter((s) => s.structureType === STRUCTURE_WALL).length > 0) {
                            constructedWall.push(compress(pos1.x, pos1.y));
                            queue.push([px, py]);
                        }
                    }
                    done[compress(x, y)] = true;
                }
            } else {
                console.log('`layout-wall`旗帜没有放置到wall上');
            }
            flag.remove();
            let count = 0;
            if(operate === 1) {
                const memory = global.BotMem('layout', roomName);
                if (!memory.constructedWall) memory.constructedWall = [];
                for(const wall of constructedWall) {
                    if(!memory.constructedWall.includes(wall)) {
                        memory.constructedWall.push(wall);
                        count++;
                    }
                }
                console.log(`已添加${count}个wall到布局memory`);
                return OK;
            }
            else {
                const memory = global.BotMem('layout', roomName);
                for(const wall of constructedWall) {
                    if (memory.constructedWall.includes(wall)) {
                        memory.constructedWall.splice(memory.constructedWall.indexOf(wall), 1);
                        count++;
                    }
                }
                console.log(`已从布局memory删除${count}个wall`);
                return OK;
            }
        },
        ramwall(roomName: string, operate=1) {
            const flag = Game.flags['layout-ramwall'];
            if (!flag) {
                console.log('未找到`layout-ramwall`旗帜标记');
            }
            const rampart = []
            const constructedWall = []
            const queue = []
            if (flag.pos.lookFor(LOOK_STRUCTURES).every((s) => 
                s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART)) {
                console.log('`layout-ramwall`旗帜没有放置到wall或rampart上');
            }
            else if (flag.pos.lookFor(LOOK_STRUCTURES).some((s) => s.structureType === STRUCTURE_WALL)) {
                constructedWall.push(compress(flag.pos.x, flag.pos.y));
                queue.push([flag.pos.x, flag.pos.y]);
            }
            else if (flag.pos.lookFor(LOOK_STRUCTURES).some((s) => s.structureType === STRUCTURE_RAMPART)) {
                rampart.push(compress(flag.pos.x, flag.pos.y));
                queue.push([flag.pos.x, flag.pos.y]);
            }
            const done = {}
            while (queue.length > 0) {
                const pos = queue.shift();
                const x = pos[0];
                const y = pos[1];
                if (x < 0 || x > 49 || y < 0 || y > 49) continue;
                const xy = [[x-1, y], [x+1, y], [x, y-1], [x, y+1]];
                for (const p of xy) {
                    const px = p[0];
                    const py = p[1];
                    if (px < 0 || px > 49 || py < 0 || py > 49) continue;
                    const pos1 = new RoomPosition(px, py, flag.pos.roomName);
                    if (!done[compress(px, py)] && 
                        pos1.lookFor(LOOK_STRUCTURES)
                        .some((s) => s.structureType === STRUCTURE_WALL)) {
                        constructedWall.push(compress(pos1.x, pos1.y));
                        queue.push([px, py]);
                    }  else if (!done[compress(px, py)] && 
                        pos1.lookFor(LOOK_STRUCTURES)
                        .some((s) => s.structureType === STRUCTURE_RAMPART)) {
                        rampart.push(compress(pos1.x, pos1.y));
                        queue.push([px, py]);
                    }
                }
                done[compress(x, y)] = true;
            }
            
            flag.remove();
            let wallcount = 0;
            let rampartcount = 0;
            if(operate === 1) {
                const memory = global.BotMem('layout', roomName);
                if (!memory.constructedWall) memory.constructedWall = [];
                for(const wall of constructedWall) {
                    if(!memory.constructedWall.includes(wall)) {
                        memory.constructedWall.push(wall);
                        wallcount++;
                    }
                }
                if (!memory.rampart) memory.rampart = [];
                for(const ramp of rampart) {
                    if(!memory.rampart.includes(ramp)) {
                        memory.rampart.push(ramp);
                        rampartcount++;
                    }
                }
                console.log(`已添加${wallcount}个wall和${rampartcount}个rampart到布局memory`);
                return OK;
            }
            else {
                const memory = global.BotMem('layout', roomName);
                for(const wall of constructedWall) {
                    if (memory.constructedWall.includes(wall)) {
                        memory.constructedWall.splice(memory.constructedWall.indexOf(wall), 1);
                        wallcount++;
                    }
                }
                for(const ramp of rampart) {
                    if (memory.rampart.includes(ramp)) {
                        memory.rampart.splice(memory.rampart.indexOf(ramp), 1);
                        rampartcount++;
                    }
                }
                console.log(`已从布局memory删除${wallcount}个wall和${rampartcount}个rampart`);
                return OK;
            }
        },
    }
}

import ros from "@/planner/static/ros/ros"
import hoho from "@/planner/static/hoho/hoho"
import tea from "@/planner/static/tea/tea"

const planner = {
    'ros': ros,
    'hoho': hoho,
    'tea': tea
}

// 构建静态布局
const buildPlanner = function (room: Room, layoutType: string) {
    const layout = planner[layoutType];
    if (!layout) {
        console.log(`不支持的布局类型: ${layoutType}`);
        return;
    }
    const BotMemRooms =  global.BotMem('rooms');
    const center = BotMemRooms[room.name].center;
    global.BotMem('layout')[room.name] = {};
    const layoutMemory = global.BotMem('layout', room.name);

    const terrain = room.getTerrain();
    let minX = 50, maxX = 0, minY = 50, maxY = 0;

    // 计算并保存建筑的坐标
    for (const s in layout.buildings) {
        for (const pos of layout.buildings[s].pos) {
            const x = pos.x + (center.x - 25);
            const y = pos.y + (center.y - 25);
            if (terrain.get(x, y) == TERRAIN_MASK_WALL) continue;
            if (!layoutMemory[s]) layoutMemory[s] = [];
            layoutMemory[s].push(compress(x, y));
            minX = Math.min(minX, x-3);
            maxX = Math.max(maxX, x+3);
            minY = Math.min(minY, y-3);
            maxY = Math.max(maxY, y+3);
        }
    }

    // 保存矿机坐标
    const mineral = room.mineral || room.find(FIND_MINERALS)[0];
    if (mineral) {
        if (!layoutMemory['extractor']) layoutMemory['extractor'] = [];
        const x = mineral.pos.x, y = mineral.pos.y;
        layoutMemory['extractor'].push(compress(x, y));
    }

    // // 构建外墙
    // const rampart = [];
    // for (let x = minX; x <= maxX; x++) {
    //     if (x <= 0 || x >= 49) continue;
    //     if (terrain.get(x, minY) != TERRAIN_MASK_WALL && minY > 0 && minY < 49)
    //         rampart.push(compress(x, minY));
    //     if (terrain.get(x, maxY) != TERRAIN_MASK_WALL && maxY > 0 && maxY < 49)
    //         rampart.push(compress(x, maxY));
    // }
    // for (let y = minY; y <= maxY; y++) {
    //     if (y <= 0 || y >= 49) continue;
    //     if (terrain.get(minX, y) != TERRAIN_MASK_WALL && minX > 0 && minX < 49)
    //         rampart.push(compress(minX, y));
    //     if (terrain.get(maxX, y) != TERRAIN_MASK_WALL && maxX > 0 && maxX < 49)
    //         rampart.push(compress(maxX, y));
    // }

    // // 清除位于安全区域的部分
    // // ......（未实现）

    // layoutMemory['rampart'] = rampart;

    global.log(`已使用静态布局${layoutType}生成${room.name}的布局Memory`);
}

// 自适应布局
const autoPlanner = function (room: Room) {
    if (Game.cpu.bucket < 100) {
        return Error(`CPU bucket余量过低, 暂时无法运行自动布局。`);
    }
    let roomStructsData: any;
    let pa = Game.flags.pa?.pos;
    let pb = Game.flags.pb?.pos;
    let pc = Game.flags.pc?.pos;
    let pm = Game.flags.pm?.pos;
    if ((!pa || !pb || !pc || !pm) && room) {
        pa = room.source?.[0]?.pos || room.find(FIND_SOURCES)[0]?.pos;
        pb = room.source?.[1]?.pos || room.find(FIND_SOURCES)[1]?.pos || new RoomPosition(pa.x, pa.y, room.name);
        pc = room.controller?.pos;
        pm = room.mineral?.pos || room.find(FIND_MINERALS)[0]?.pos;
        if (!pa || !pb || !pc || !pm) return Error(`房间 ${room.name} 的能量源、控制器或矿点不存在。`);
    } else if (!pa || !pb || !pc || !pm) return Error(`没有房间视野, 且未找到pa、pb、pc、pm旗帜标记。`);

    const autoPlanner63 = require("autoPlanner63");
    roomStructsData = autoPlanner63.ManagerPlanner.computeManor(room.name, [pc, pm, pa, pb,]);
    if (roomStructsData) {
        const BotMemRooms =  global.BotMem('rooms');
        BotMemRooms[room.name]['layout'] = "63";
        BotMemRooms[room.name]['center'] = roomStructsData.storagePos;
        global.BotMem('layout')[room.name] = {};
        const layoutMemory = global.BotMem('layout', room.name);
        const structMap = roomStructsData.structMap;
        for (const s in structMap) {
            layoutMemory[s] = compressBatch(structMap[s]);
        }
        console.log(`房间 ${room.name} 的布局memory已生成。`);
        console.log('布局中心: ' + JSON.stringify(roomStructsData.storagePos));
        return OK;
    } else {
        return Error(`房间 ${room.name} 的自动布局失败。`);
    }
}