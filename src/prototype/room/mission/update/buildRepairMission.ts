// 发布建造维修任务
function UpdateBuildRepairMission(room: Room) {
    // 查找所有受损的结构
    const allStructures = room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.hits < structure.hitsMax
    });

    const NORMAL_STRUCTURE_THRESHOLD = 0.8;     // 普通修复建筑耐久度阈值
    const URGENT_STRUCTURE_THRESHOLD = 0.1;     // 紧急修复建筑耐久度阈值
    const NORMAL_WALL_THRESHOLD = 0.001;        // 普通修复墙耐久度阈值
    const URGENT_WALL_HITS = 2000;              // 紧急修复墙耐久度
    

    // 维修优先级：紧急维修-建筑 > 紧急维修-墙 > 常规维修-建筑 > 常规维修-墙
    for (const structure of allStructures) {
        const { hitsMax, structureType, hits, id, pos } = structure;
        const posInfo = `${pos.x}/${pos.y}/${pos.roomName}`
        if (structureType !== STRUCTURE_WALL && structureType !== STRUCTURE_RAMPART) {
            // 处理建筑
            if (hits < hitsMax * URGENT_STRUCTURE_THRESHOLD) {  // 紧急维修
                const data = {target: id, pos: posInfo, hits: hitsMax * URGENT_STRUCTURE_THRESHOLD};
                room.BuildRepairMissionAdd('repair', 1, data)
                continue;
            }
            if (hits < hitsMax * NORMAL_STRUCTURE_THRESHOLD) {  // 常规维修
                const data = {target: id, pos: posInfo, hits: hitsMax * NORMAL_STRUCTURE_THRESHOLD};
                room.BuildRepairMissionAdd('repair', 3, data)
                continue;
            }
        } else {
            // 处理墙和城墙
            if (hits < URGENT_WALL_HITS) {          // 紧急维修
                const data = {target: id, pos: posInfo, hits: URGENT_WALL_HITS};
                room.BuildRepairMissionAdd('repair', 2, data)
                continue;
            }
            if (hits < hitsMax * NORMAL_WALL_THRESHOLD) {   // 常规维修
                const data = {target: id, pos: posInfo, hits: hitsMax * NORMAL_WALL_THRESHOLD};
                room.BuildRepairMissionAdd('repair', 4, data)
                continue;
            }
        }
    }

    // 建造任务
    const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
    for(const site of constructionSites) {
        const posInfo = `${site.pos.x}/${site.pos.y}/${site.pos.roomName}`
        const data = {target: site.id, pos: posInfo};
        let level = Math.floor((1 - site.progress / site.progressTotal) * 5);
        if (site.structureType === STRUCTURE_EXTENSION) {
            level += 5;
        }
        else if (site.structureType === STRUCTURE_ROAD ||
            site.structureType === STRUCTURE_CONTAINER) {
            level += 10;
        }
        room.BuildRepairMissionAdd('build', level, data)
    }
}

// 刷墙任务
function UpdateWallRepairMission(room: Room) {
    let WALL_HITS_MAX_THRESHOLD = 0.5;        // 墙最大耐久度阈值
    const botMem = global.BotMem('structures', room.name);
    if (botMem['ram_threshold']) {
        WALL_HITS_MAX_THRESHOLD = Math.min(botMem['ram_threshold'], 1);
    }
    const memory = global.BotMem('layout', room.name);
    if (!memory) return;
    const rampartMem = memory['rampart'] || [];
    const wallMem = memory['wall'] || [];
    const walls = room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.hits < structure.hitsMax &&
        (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) &&
        (rampartMem.includes(structure.pos.x*100+structure.pos.y) || wallMem.includes(structure.pos.x*100+structure.pos.y))
    });
    for(const structure of walls) {
        const { hitsMax, hits, id, pos } = structure;
        const posInfo = `${pos.x}/${pos.y}/${pos.roomName}`
        if(hits < hitsMax * WALL_HITS_MAX_THRESHOLD * 0.9) {  // 刷墙
            const level = Math.floor(hits / hitsMax * 100) + 1; // 优先级
            const targetHits = level / 100 * hitsMax;
            const data = {target: id, pos: posInfo, hits: targetHits};
            room.BuildRepairMissionAdd('walls', level, data);
            continue;
        }
    }
}

// 检查任务是否有效
function BuildRepairMissionCheck(room: Room) {
    const checkFunc = (task: Task) => {
        const {target, hits} = task.data;
        const structure = Game.getObjectById(target) as Structure | null;
        if(!structure) return false;
        if ((task.type === 'repair' || task.type === 'walls') &&
            structure.hits >= hits) return false;
        return true;
    }

    room.checkMissionPool('build', checkFunc);
    room.checkMissionPool('repair', checkFunc);
    room.checkMissionPool('walls', checkFunc);
}

export { UpdateBuildRepairMission, UpdateWallRepairMission, BuildRepairMissionCheck }