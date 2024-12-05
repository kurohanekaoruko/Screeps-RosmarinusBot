import ros from "@/planner/static/ros/ros"
import dev from "@/planner/static/dev/dev"
import hoho from "@/planner/static/hoho/hoho"
import tea from "@/planner/static/tea/tea"

const planner = {
    'ros': ros,
    'dev': dev,
    'hoho': hoho,
    'tea': tea
}

export default class AutoBuild extends Room {
    // 自动建筑
    autoBuild() {
        if (Game.time % 100) return;
        if (Game.cpu.bucket < 100) return;

        const memory = global.BotMem('rooms', this.name);
        const layoutMemory = global.BotMem('layout', this.name);
        const center = memory.center;
        if(!memory) return;

        // 设置了布局和中心, 则自动构建布局Memory
        if (memory.layout && center &&
            (!layoutMemory || Object.keys(layoutMemory).length == 0)) {
            plannerBuild(this, center, memory.layout);
        }
        
        // 开启了自动建造, 且有布局Memory, 则自动建筑
        if (memory.autobuild &&
            layoutMemory && Object.keys(layoutMemory).length) {
            plannerCreateSite(this);
        }
    }
}

// 构建布局
const plannerBuild = function (room: Room, center: { x: number, y: number }, layoutType: string) {
    const layout = planner[layoutType];
    if (!layout) return;

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
            layoutMemory[s].push(x * 100 + y);
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
        layoutMemory['extractor'].push(x * 100 + y);
    }

    // // 构建外墙
    // const rampart = [];
    // for (let x = minX; x <= maxX; x++) {
    //     if (x <= 0 || x >= 49) continue;
    //     if (terrain.get(x, minY) != TERRAIN_MASK_WALL && minY > 0 && minY < 49)
    //         rampart.push(x * 100 + minY);
    //     if (terrain.get(x, maxY) != TERRAIN_MASK_WALL && maxY > 0 && maxY < 49)
    //         rampart.push(x * 100 + maxY);
    // }
    // for (let y = minY; y <= maxY; y++) {
    //     if (y <= 0 || y >= 49) continue;
    //     if (terrain.get(minX, y) != TERRAIN_MASK_WALL && minX > 0 && minX < 49)
    //         rampart.push(minX * 100 + y);
    //     if (terrain.get(maxX, y) != TERRAIN_MASK_WALL && maxX > 0 && maxX < 49)
    //         rampart.push(maxX * 100 + y);
    // }

    // // 清除位于安全区域的部分
    // // ......（未实现）

    // layoutMemory['rampart'] = rampart;

    global.log(`已使用静态布局${layoutType}生成${room.name}的布局Memory`);
}

// 根据布局放置工地
const plannerCreateSite = function (room: Room) {
    // 现有工地到达上限时不处理
    const allSite = room.find(FIND_CONSTRUCTION_SITES);
    if (allSite.length >= 100) return;

    const layoutMemory = global.BotMem('layout', room.name);

    for (const s in layoutMemory) {
        // 当前RCL能造的数量为最大建造数
        const buildMax = CONTROLLER_STRUCTURES[s][room.level];
        if (!buildMax) continue;
        // 建筑计数
        let count = 0;
        if (s == 'extension' || s == 'container') {
            let structures = room[s] || room.find(FIND_STRUCTURES, { filter: (o) => o.structureType == s });
            // 如果数量达到上限，则跳过
            count = structures.length
            if (count >= buildMax) continue;
            // 算上工地数再判断一次
            const sites = allSite.filter(o => o.structureType == s);
            count += sites.length;
            if (count >= buildMax) continue;
        }
        // 根据等级来限制造到第几个
        // 用当前等级建造上限来限制
        let points = layoutMemory[s].slice(0, buildMax);
        if (s == 'road') {
            // 对于路则使用如下判断来限制
            switch (global.BotMem('rooms', room.name, 'layout')) {
                case 'tea':
                    if (room.level < 3) continue;   // 3级以下不建造路
                    if (room.level == 3) points = layoutMemory[s].slice(0, 11);
                    if (room.level == 4) points = layoutMemory[s].slice(0, 24);
                    if (room.level == 5) points = layoutMemory[s].slice(0, 37);
                    break;
                case 'hoho':
                    if (room.level < 3) continue;   // 3级以下不建造路
                    if (room.level == 3) points = layoutMemory[s].slice(0, 7);
                    if (room.level == 4) points = layoutMemory[s].slice(0, 13);
                    if (room.level == 5) points = layoutMemory[s].slice(0, 21);
                    if (room.level == 6) points = layoutMemory[s].slice(0, 29);
                    if (room.level == 7) points = layoutMemory[s].slice(0, 35);
                    break;
                case '63':
                    if (room.level < 3) continue;   // 3级以下不建造路
                    break;
                case 'ros':
                    if (room.level < 3) continue;   // 3级以下不建造路
                    if (room.level == 3) points = layoutMemory[s].slice(0, 9);
                    if (room.level == 4) points = layoutMemory[s].slice(0, 17);
                    if (room.level == 5) points = layoutMemory[s].slice(0, 41);
                    break;
            }
        }
        // 构建工地
        for (const pos of points) {
            const x = Math.floor(pos / 100), y = pos % 100;
            const Pos = new RoomPosition(x, y, room.name);
            const C = Pos.lookFor(LOOK_CONSTRUCTION_SITES);
            if (C.length) continue; // 已有工地跳过
            const S = Pos.lookFor(LOOK_STRUCTURES);
            if (S.length) {
                if (s == 'rampart') {
                    // 4级以下不建造墙
                    if (room.level < 4) continue;
                    // 有墙，则跳过
                    if (S.filter(o => o.structureType == 'rampart').length) continue;
                } else if (s == 'road') {
                    // 3级以下不建造路
                    if (room.level < 3) continue;
                    // 有非墙建筑，则跳过
                    if (S.filter(o => o.structureType != 'rampart').length) continue;
                } else if (['spawn', 'tower', 'storage', 'link', 'terminal',
                    'factory', 'lab', 'observer', 'nuker', 'powerSpawn'].includes(s)) {
                    // 对于关键建筑，如果已有该建筑但是无墙，那么建造墙再跳过
                    if (S.filter(o => o.structureType == s).length &&
                        !S.filter(o => o.structureType == 'rampart').length) {
                        const result = room.createConstructionSite(x, y, 'rampart');
                        if (result == ERR_FULL) return;
                        continue;
                    }
                }
                else {
                    // 有非墙非路建筑，则跳过
                    if (S.filter(o => o.structureType != 'rampart' &&
                        o.structureType != 'road').length)
                        continue;
                }
            }
            const result = room.createConstructionSite(x, y, s as any);
            if (result == OK) count++;
            else if (result == ERR_FULL) return;
            if (count >= buildMax) break;
        }

        if (room.level >= 6) {
            const center = global.BotMem('rooms', room.name).center;
            if (center) {
                const x = center.x, y = center.y;
                const Pos = new RoomPosition(x, y, room.name);
                const C = Pos.lookFor(LOOK_CONSTRUCTION_SITES);
                if (C.length) continue; // 已有工地跳过
                const S = Pos.lookFor(LOOK_STRUCTURES).filter(o => o.structureType == 'rampart');
                if (S.length) continue; // 已有墙跳过
                room.createConstructionSite(x, y, 'rampart');
            }
        }
    }
}