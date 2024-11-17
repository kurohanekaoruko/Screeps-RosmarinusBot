// 基础功能旗帜
function BaseFlag(flagName) {
    if(Game.time % 20 != 0) return false;

    // const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;


    // // 查找符合s2t的flag, 切换 AUTO_S2T
    // const s2tMatch = flagName.match(/^s2t$/);
    // if(s2tMatch) {
    //     Game.flags[flagName].room.memory.AUTO_S2T = !Game.flags[flagName].room.memory.AUTO_S2T;
    //     console.log(`在房间 ${Game.flags[flagName].room.name} 设置终端自动资源转入为: ${Game.flags[flagName].room.memory.AUTO_S2T ? '开启' : '关闭'}`);
    //     Game.flags[flagName].remove();
    //     return true;
    // }

    // // 查找符合t2s的flag, 切换 AUTO_T2S
    // const t2sMatch = flagName.match(/^t2s$/);
    // if(t2sMatch) {
    //     Game.flags[flagName].room.memory.AUTO_T2S = !Game.flags[flagName].room.memory.AUTO_T2S;
    //     console.log(`在房间 ${Game.flags[flagName].room.name} 设置终端资源自动转出为: ${Game.flags[flagName].room.memory.AUTO_T2S ? '开启' : '关闭'}`);
    //     Game.flags[flagName].remove();
    //     return true;
    // }

    // // 查找labA、labB的flag, 设置底物lab的id
    // const labABMatch = flagName.match(/^lab[-_#/ ]([AB])$/);
    // if(labABMatch) {
    //     const [_, labAB] = labABMatch;
    //     const flag = Game.flags[flagName];
    //     const room = flag.room;
    //     if(room) {
    //         const lab = flag.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_LAB);
    //         const labId = lab ? lab.id : undefined;
    //         if(labId) {
    //             room.memory[`lab${labAB}`] = labId;
    //             console.log(`在房间 ${room.name} 设置了lab${labAB}的ID: ${labId}`);
    //         } else {
    //             console.log(`在旗帜 ${flagName} 的位置没有找到lab`);
    //         }
    //     } else {
    //         console.log(`无法为旗帜 ${flagName} 找到对应的房间`);
    //     }
    //     flag.remove();
    //     return true;
    // }


    // 查找符合labset-{resourceType}的flag
    const labsetMatch = flagName.match(/^labset[-#/ ](\w+)$/);
    if(labsetMatch) {
        let resourceType = labsetMatch[1];
        const flag = Game.flags[flagName];
        const room = flag.room;
        const lab = flag.pos.lookFor(LOOK_STRUCTURES).find(structure => structure.structureType === STRUCTURE_LAB);

        const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;
        resourceType = RESOURCE_ABBREVIATIONS[resourceType] || resourceType;

        if(!room.memory.labsBoostType) room.memory.labsBoostType = {};
        room.memory.labsBoostType[lab.id] = resourceType;

        console.log(`在房间 ${room.name} 设置了lab ${lab.id} 的强化用资源: ${resourceType}`);
        flag.remove();
        return true;
    }

    // 查找launchNuke的flag, 从距离足够且存在nuker的房间向目标房间发射核弹
    const launchNukeMatch = flagName.match(/^launchNuke[-#/ ]?(\d+)?$/);
    if (launchNukeMatch) {
        // 获取目标
        const targetPos = Game.flags[flagName].pos
        const targetRoom = targetPos.roomName
        if (Game.rooms[targetRoom]?.controller?.my) {
            Game.flags[flagName].remove();
            return true;
        }
        // 获取符合发射条件的房间
        const nearbyRooms = Object.values(Game.rooms).filter(room => 
            room.controller && 
            room.controller.my && 
            room.nuker && 
            Game.map.getRoomLinearDistance(room.name, targetRoom, true) <= 10
        );
        const amount = launchNukeMatch[1] ? parseInt(launchNukeMatch[1]) : 1; // 获取发射数量，默认为1
        let launchedCount = 0; // 已发射数量
        for (const room of nearbyRooms) {
            const nuker = room.nuker; // 获取该房间的核弹发射器
            if(nuker.cooldown > 0) continue;
            if (nuker && nuker.store[RESOURCE_ENERGY] >= 300000 && nuker.store[RESOURCE_GHODIUM] >= 5000) {
                nuker.launchNuke(targetPos);    // 发射核弹
                launchedCount++;
                console.log(`从房间 ${nuker.room.name} 发射核弹到 ${targetRoom} (x:${targetPos.x}  y:${targetPos.y})`);
            }
            if (launchedCount >= amount) break; // 达到发射数量后退出循环
        }
        Game.flags[flagName].remove();
        return true;
    }
}

export { BaseFlag };