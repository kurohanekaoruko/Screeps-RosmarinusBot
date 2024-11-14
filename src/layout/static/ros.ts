const ros = {
    'storage': [{ 'x': -1, 'y': 0 }],
    'link': [{ 'x': 0, 'y': -1 }],
    'terminal': [{ 'x': 1, 'y': 0 }],
    'factory': [{ 'x': 0, 'y': 1 }],
    'spawn': [{ 'x': -4, 'y': 0 }, { 'x': 0, 'y': -4 }, { 'x': 4, 'y': 0 }],
    'powerSpawn': [{ 'x': 0, 'y': 4 }],
    'tower': [{ 'x': -2, 'y': -2 }, { 'x': 2, 'y': -2 }, { 'x': 2, 'y': 2 }, { 'x': -2, 'y': 2 }, { 'x': -5, 'y': 5 }, { 'x': 5, 'y': 5 }],
    'observer': [{ 'x': 1, 'y': 6 }],
    'nuker': [{ 'x': -1, 'y': 6 }],
    'container': [{ 'x': -4, 'y': -2 }, { 'x': -2, 'y': -4 }],
    'lab': [
        { 'x': -3, 'y': -5 }, { 'x': -4, 'y': -4 }, { 'x': -5, 'y': -3 }, { 'x': -3, 'y': -4 }, { 'x': -4, 'y': -3 }, { 'x': -5, 'y': -5 },
        { 'x': -2, 'y': -5 }, { 'x': -4, 'y': -5 }, { 'x': -5, 'y': -2 }, { 'x': -5, 'y': -4 }
    ],
    'extension': [
        { 'x': -2, 'y': -1 }, { 'x': -1, 'y': -2 }, { 'x': -2, 'y': -3 }, { 'x': -1, 'y': -4 }, { 'x': 0, 'y': -3 }, { 'x': -3, 'y': 0 }, 
        { 'x': -5, 'y': 0 }, { 'x': -4, 'y': -1 }, { 'x': -3, 'y': -2 }, { 'x': -4, 'y': 1 }, { 'x': -3, 'y': 2 }, { 'x': -2, 'y': 1 }, 
        { 'x': -1, 'y': 2 }, { 'x': 0, 'y': -5 }, { 'x': 1, 'y': -4 }, { 'x': 1, 'y': -2 }, { 'x': 2, 'y': -3 }, { 'x': 2, 'y': -1 }, 
        { 'x': 3, 'y': -2 }, { 'x': -2, 'y': 3 }, { 'x': 2, 'y': 3 }, { 'x': 1, 'y': 4 }, { 'x': -1, 'y': 4 }, { 'x': 1, 'y': 2 }, 
        { 'x': 0, 'y': 3 }, { 'x': 0, 'y': 5 }, { 'x': 2, 'y': 1 }, { 'x': 3, 'y': 0 }, { 'x': 3, 'y': 2 }, { 'x': 4, 'y': -1 }, 
        { 'x': 4, 'y': 1 }, { 'x': 5, 'y': 0 }, { 'x': 2, 'y': -5 }, { 'x': 3, 'y': -4 }, { 'x': 4, 'y': -4 }, { 'x': 4, 'y': -3 }, 
        { 'x': 3, 'y': -5 }, { 'x': 5, 'y': -3 }, { 'x': 5, 'y': -2 }, { 'x': -4, 'y': 3 }, { 'x': -4, 'y': 4 }, { 'x': -5, 'y': 2 },
        { 'x': -5, 'y': 3 }, { 'x': 4, 'y': 3 }, { 'x': -3, 'y': 4 }, { 'x': 5, 'y': 3 }, { 'x': 3, 'y': 4 }, { 'x': 5, 'y': 2 }, 
        { 'x': 4, 'y': 4 }, { 'x': -3, 'y': 5 }, { 'x': -2, 'y': 5 }, { 'x': 2, 'y': 5 }, { 'x': 3, 'y': 5 }, { 'x': 4, 'y': -5 }, 
        { 'x': 5, 'y': -4 }, { 'x': -5, 'y': 4 }, { 'x': 5, 'y': 4 }, { 'x': 4, 'y': 5 }, { 'x': -4, 'y': 5 }, { 'x': 5, 'y': -5 }
    ],
    'road': [
        { "x": -1, "y": -3 }, { "x": -2, "y": -4 }, { "x": 0, "y": -2 }, { "x": -1, "y": -1 }, { "x": -3, "y": -3 }, { "x": -2, "y": 0 }, 
        { "x": -3, "y": -1 }, { "x": -4, "y": -2 }, { "x": -3, "y": 1 }, { "x": -4, "y": 2 }, { "x": -5, "y": -1 }, { "x": -5, "y": 1 }, 
        { "x": -6, "y": 0 }, { "x": 2, "y": -4 }, { "x": 1, "y": -3 }, { "x": 1, "y": -5 }, { "x": 3, "y": -3 }, { "x": 0, "y": -6 }, 
        { "x": 1, "y": -1 }, { "x": 4, "y": -2 }, { "x": 3, "y": -1 }, { "x": -1, "y": -5 }, { "x": 2, "y": 0 }, { "x": 5, "y": -1 }, 
        { "x": -1, "y": 1 }, { "x": 6, "y": 0 }, { "x": 3, "y": 1 }, { "x": 1, "y": 1 }, { "x": 5, "y": 1 }, { "x": 0, "y": 2 }, 
        { "x": 4, "y": 2 }, { "x": -3, "y": 3 }, { "x": -1, "y": 3 }, { "x": 1, "y": 3 }, { "x": -2, "y": 4 }, { "x": 2, "y": 4 }, 
        { "x": -1, "y": 5 }, { "x": 1, "y": 5 }, { "x": 0, "y": 6 }, { "x": 3, "y": 3 }, { "x": 0, "y": 0 }, { "x": -6, "y": -2 },
        { "x": -6, "y": 2 }, { "x": -6, "y": -3 }, { "x": -2, "y": -6 }, { "x": -6, "y": -4 }, { "x": -6, "y": -5 }, { "x": -3, "y": -6 }, 
        { "x": -4, "y": -6 }, { "x": -6, "y": 3 }, { "x": -6, "y": 4 }, { "x": 2, "y": -6 }, { "x": -6, "y": 5 }, { "x": -2, "y": 6 }, 
        { "x": 6, "y": 2 }, { "x": 6, "y": -2 }, { "x": 6, "y": 3 }, { "x": -5, "y": -6 }, { "x": -3, "y": 6 }, { "x": -4, "y": 6 }, 
        { "x": 2, "y": 6 }, { "x": -5, "y": 6 }, { "x": 3, "y": 6 }, { "x": 4, "y": 6 }, { "x": 6, "y": 4 }, { "x": 5, "y": 6 }, 
        { "x": 6, "y": 5 }, { "x": 6, "y": -3 }, { "x": 6, "y": -4 }, { "x": 6, "y": -5 }, { "x": 3, "y": -6 }, { "x": 4, "y": -6 }, 
        { "x": 5, "y": -6 }
    ],
    'rampart': [
        { "x": 0, "y": 0 }, { "x": -1, "y": 0 }, { "x": 0, "y": -1 }, { "x": 1, "y": 0 }, { "x": 0, "y": 1 }, { 'x': -4, 'y': 0 }, 
        { 'x': 0, 'y': -4 }, { 'x': 4, 'y': 0 }, { 'x': 0, 'y': 4 }, { 'x': -2, 'y': -2 }, { 'x': 2, 'y': -2 }, { 'x': 2, 'y': 2 }, 
        { 'x': -2, 'y': 2 }, { 'x': -5, 'y': 5 }, { 'x': 5, 'y': 5 }, { 'x': 1, 'y': 6 }, { 'x': -1, 'y': 6 }, { 'x': -3, 'y': -5 }, 
        { 'x': -4, 'y': -4 }, { 'x': -5, 'y': -3 }, { 'x': -3, 'y': -4 }, { 'x': -4, 'y': -3 }, { 'x': -5, 'y': -5 }, { 'x': -2, 'y': -5 }, 
        { 'x': -4, 'y': -5 }, { 'x': -5, 'y': -2 }, { 'x': -5, 'y': -4 }
    ]
}

/** Rosmarinus（ros）布局 */
const rosLayout = (room: Room, center: {x: number, y: number}, log=false) => {
    // 现有工地
    const allSite = room.find(FIND_MY_CONSTRUCTION_SITES);
    // 到达上限时不处理
    if(allSite.length >= 100) return;
    
    // 布局中心
    if(!center) {
        console.log(`[ros] ${room.name} 未设置布局中心`);
        return;
    }
    const centralPos = new RoomPosition(center.x, center.y, room.name);

    for(const s of [
        'road', 'extension', 'spawn', 'link', 'tower', 'storage',
        'terminal', 'factory', 'lab', 'observer', 'nuker', 'powerSpawn',
    ]) {
        // 最大数量，当前等级最大建造数与布局需求数
        const max = Math.min(CONTROLLER_STRUCTURES[s][room.level], ros[s].length);
        if(!max) continue;
        let structures = room[s] ?? [];
        if(structures.length >= CONTROLLER_STRUCTURES[s][room.level]) continue;
        if(['link', 'road'].includes(s)) {
            structures = structures.filter((o: any) => o.pos.inRange(centralPos, 6));
        }
        let count = structures.length
        if(count >= max) continue;
        const sites = allSite.filter(o => o.structureType == s);
        count += (sites??[]).length;
        if(count >= max) continue;
        for(const pos of ros[s]) {
            const x = pos.x + centralPos.x;
            const y = pos.y + centralPos.y;
            const target = new RoomPosition(x, y, room.name);
            const L = target.lookFor(LOOK_STRUCTURES);
            const C = target.lookFor(LOOK_CONSTRUCTION_SITES);
            if(L.filter(o => o.structureType != 'road' && o.structureType != 'container').length) continue;
            if(C.length) continue;
            const result = room.createConstructionSite(x, y, s as BuildableStructureConstant);
            if(result == OK) {
                if(log) console.log(`[ros] ${room.name} 建造 ${s} 位于 ${x},${y}`);
                count++;
            }
            if(count >= max) break;
        }
    }

    // 自动建造container
    if(room.controller.level == 8 && room.lab.length == 10 &&
        (room.container.filter((c) => c.pos.inRange(centralPos, 6)).length < ros['container'].length)
    ) {
        for(const pos of ros['container']) {
            const x = pos.x + centralPos.x;
            const y = pos.y + centralPos.y;
            const target = new RoomPosition(x, y, room.name);
            const L = target.lookFor(LOOK_STRUCTURES);
            const C = target.lookFor(LOOK_CONSTRUCTION_SITES);
            if(L.filter(o => o.structureType != 'road').length) continue;
            if(C.length) continue;
            const result = room.createConstructionSite(x, y, STRUCTURE_CONTAINER);
            if(result == OK && log) console.log(`[ros] ${room.name} 建造 container 位于 ${x},${y}`);
        }
    }

    // 自动建造extractor
    if(room.level >= 6 && !room.extractor) {
        const mineral = room.mineral;
        if(mineral.pos.lookFor(LOOK_CONSTRUCTION_SITES).length == 0) {
            const result = room.createConstructionSite(mineral.pos.x, mineral.pos.y, STRUCTURE_EXTRACTOR);
            if(result == OK && log) console.log(`[ros] ${room.name} 建造 extractor 位于 ${mineral.pos.x},${mineral.pos.y}`);
        }
    }

    // 自动建造rampart
    if(room.controller.level >= 5 && room.controller.level <= 8) {
        for(const pos of ros['rampart']) {
            const x = pos.x + centralPos.x;
            const y = pos.y + centralPos.y;
            const target = new RoomPosition(x, y, room.name);
            const L = target.lookFor(LOOK_STRUCTURES);
            const C = target.lookFor(LOOK_CONSTRUCTION_SITES);
            if(L.filter(o => o.structureType == STRUCTURE_RAMPART || o.structureType == STRUCTURE_WALL).length) continue;
            if(!L.filter(o => o.structureType != 'road' && o.structureType != 'container').length) continue;
            if(C.length) continue;
            const result = room.createConstructionSite(x, y, STRUCTURE_RAMPART);
            if(result == OK && log) console.log(`[ros] ${room.name} 建造 rampart 位于 ${x},${y}`);
        }
    }
}

export default rosLayout;
