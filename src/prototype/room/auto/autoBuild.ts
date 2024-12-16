import {compress,decompress} from "@/utils"

export default class AutoBuild extends Room {
    // 自动建筑
    autoBuild() {
        if (Game.time % 100 == 0) {
            this.memory['index'] = Object.keys(Game.rooms).indexOf(this.name) % 100;
        }
        
        if (Game.time % 100 !== this.memory['index']) return;
        if (Game.cpu.bucket < 100) return;

        // 开启了自动建造, 且有布局Memory, 则自动建筑
        const memory = Memory['RoomControlData'][this.name];
        const layoutMemory = Memory['LayoutData'][this.name];
        if(!memory) return;
        if (memory.autobuild && layoutMemory &&
            Object.keys(layoutMemory).length) {
            plannerCreateSite(this, layoutMemory);
        }
    }
}

// 根据布局放置工地
const plannerCreateSite = function (room: Room, layoutMemory: any) {
    // 现有工地到达上限时不处理
    const allSite = room.find(FIND_CONSTRUCTION_SITES);
    if (allSite.length >= 100) return;
    // 遍历布局各个建筑类型的坐标数组
    for (const s in layoutMemory) {
        // 当前RCL能造的数量为最大建造数
        const buildMax = CONTROLLER_STRUCTURES[s][room.level];
        if (!buildMax) continue;
        
        // 对于部分建筑, 如果数量达到上限，则跳过
        if (s == 'extension' || s == 'container' || s == 'link')  {
            // 建筑计数
            let count = 0;
            let structures = room[s] || room.find(FIND_STRUCTURES, { filter: (o) => o.structureType == s });
            count = structures.length;
            if (count >= buildMax) continue;
            // 算上工地数再判断一次
            const sites = allSite.filter(o => o.structureType == s);
            count += sites.length;
            if (count >= buildMax) continue;
        }
        // 限制建造到第几个
        let points = getPoints(room, s, layoutMemory[s], buildMax);
        if (!points || points.length == 0) continue;
        // 构建工地
        for (const p of points) {
            const [x, y] = decompress(p); // 解压坐标
            const Pos = new RoomPosition(x, y, room.name);
            const C = Pos.lookFor(LOOK_CONSTRUCTION_SITES);
            if (C.length) continue; // 已有工地跳过
            const S = Pos.lookFor(LOOK_STRUCTURES);
            // 关键建筑位置造rampart
            buildRampart(room, s, S, Pos);
            // 检查是否跳过该位置的建造
            if (checkSkipBuild(room, s, S, Pos)) continue;
            const result = room.createConstructionSite(x, y, s as any);
            if (result == ERR_FULL) return;
        }
    }
}

// 限制建造到第几个, 返回坐标数组(压缩形式)
function getPoints(room: Room, structureType: string, layoutArray: any, buildMax: number) {
    if (structureType == 'road') {
        // 对于路则使用如下判断来限制
        const layoutType = Memory['LayoutData'][room.name]['layout'];
        switch (layoutType) {
            case 'tea':
                if (room.level < 3) return [];   // 3级以下不建造路
                if (room.level == 3) return layoutArray.slice(0, 11);
                if (room.level == 4) return layoutArray.slice(0, 24);
                if (room.level == 5) return layoutArray.slice(0, 37);
                break;
            case 'hoho':
                if (room.level < 3) return [];   // 3级以下不建造路
                if (room.level == 3) return layoutArray.slice(0, 7);
                if (room.level == 4) return layoutArray.slice(0, 13);
                if (room.level == 5) return layoutArray.slice(0, 21);
                if (room.level == 6) return layoutArray.slice(0, 29);
                if (room.level == 7) return layoutArray.slice(0, 35);
                break;
            case 'ros':
                if (room.level < 3) return [];   // 3级以下不建造路
                if (room.level == 3) return layoutArray.slice(0, 9);
                if (room.level == 4) return layoutArray.slice(0, 17);
                if (room.level == 5) return layoutArray.slice(0, 41);
                break;
            case '63':
                if (room.level < 3) return [];   // 3级以下不建造路
                // if (room.level == 3) return layoutArray.slice(0, 10);
                // if (room.level == 4) return layoutArray.slice(0, 20);
                // if (room.level == 5) return layoutArray.slice(0, 40);
                break;
        }
    } else if (structureType == 'rampart') {
        // 3级以下不建造墙
        if (room.level < 3) return [];
    }

    // 默认用当前等级建造上限来限制
    return layoutArray.slice(0, buildMax);
}

// 关键建筑表
const mainStructMap = ['spawn', 'tower', 'storage', 'terminal', 'factory', 'lab', 'nuker', 'powerSpawn'];

// 对于关键建筑, 在所在位置建造rampart
function buildRampart(room: Room, structureType: string, LOOK_S: Structure<StructureConstant>[], Pos: RoomPosition) {
    if (room.level < 4) return; // 4级以下不建造墙
    if (!mainStructMap.includes(structureType)) return;
    if (LOOK_S.some(o => o.structureType == 'rampart')) return;
    if (LOOK_S.every(o => o.structureType !== structureType)) return;
    room.createConstructionSite(Pos.x, Pos.y, 'rampart');
    return;
}


// 检查建筑所在位置的情况, 决定是否跳过建造
function checkSkipBuild(room: Room, structureType: string, LOOK_S: Structure<StructureConstant>[], Pos: RoomPosition) {
    switch (structureType) {
        case 'rampart':
            // 位置没建筑可以造
            if (!LOOK_S.length) return false;
            // 有墙跳过
            if (LOOK_S.some(o => o.structureType == STRUCTURE_RAMPART || o.structureType == STRUCTURE_WALL)) return true;
            break;
        case 'road':
            // 位置没建筑可以造
            if (!LOOK_S.length) return false;
            // 有非墙建筑，则跳过
            if (LOOK_S.some(o => o.structureType != STRUCTURE_RAMPART)) return true;
            break;
        case 'container':
            // 有非墙非路建筑，则跳过
            if (LOOK_S.length &&
                LOOK_S.some(o => o.structureType != STRUCTURE_RAMPART &&
                o.structureType != STRUCTURE_ROAD)) return true;
            // 低等级可以造
            if (room.level <= 6) return false;
            const sources = room.source || [];
            // 在能量源旁边的container, 在等级高时不造
            if (sources[0] && Pos.inRangeTo(sources[0], 2)) return true;
            if (sources[1] && Pos.inRangeTo(sources[1], 2)) return true;
            break;
        default:
            // 位置没建筑可以造
            if (!LOOK_S.length) return false;
            // 有非墙非路建筑，则跳过
            if (LOOK_S.some(o => o.structureType != 'rampart' &&
                o.structureType != 'road')) return true;
            break;
    }
    
    return false;
}

