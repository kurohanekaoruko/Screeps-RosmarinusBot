const ClaimModule = {
    tickEnd: function () {
        if (Game.time % 100) return;
        for (const flagName in Game.flags) {
            // 占领
            const claimFlag = flagName.match(/^([EW][1-9]+[NS][1-9]+)[-_#/]claim(?:[-_#/].*)?$/);
            if (Game.time % 500 == 0 && claimFlag) {
                const room = Game.rooms[claimFlag[1]];
                if (!room.controller || !room.controller.my) continue;
                const targetRoom = Game.flags[flagName].room;
                if (!targetRoom || (targetRoom.controller && !targetRoom.controller.my)) {
                    room.SpawnMissionAdd('', [], -1, 'claimer',{
                        homeRoom: claimFlag[1],
                        targetRoom: Game.flags[flagName].pos.roomName
                    } as any);
                }
            }
            // 援建
            if (Game.time % 800 == 0 && claimFlag) {
                const room = Game.rooms[claimFlag[1]];
                if (!room.controller || !room.controller.my) continue;
                room.SpawnMissionAdd('', [], 12, 'builder', {
                    home: Game.flags[flagName].pos.roomName
                } as any);
            }

            // 增援升级
            const upgradFlag = flagName.match(/^([EW][1-9]+[NS][1-9]+)[-_#/]upgrad(?:[-_#/].*)?$/);
            if (Game.time % 400 == 0 && upgradFlag) {
                const room = Game.rooms[upgradFlag[1]];
                if (!room.controller || !room.controller.my) continue;
                room.SpawnMissionAdd('', [], 12, 'speedup-upgrad', {
                    home: Game.flags[flagName].pos.roomName
                } as any);
            }
            
            // 搜刮资源
            const despoilFlag = flagName.match(/^([EW][1-9]+[NS][1-9]+)[-_#/]despoil(?:[-_#/].*)?$/);
            if (Game.time % 500 == 0 && despoilFlag) {
                const room = Game.rooms[despoilFlag[1]];
                if (!room.controller || !room.controller.my) continue;
                room.SpawnMissionAdd('', [], -1, 'logistic', { 
                    homeRoom: despoilFlag[1],
                    targetRoom: Game.flags[flagName].pos.roomName
                } as any);
                continue;
            }

            // 攻击控制器
            const aclaimFlag = flagName.match(/^([EW][1-9]+[NS][1-9]+)[-_#/]aclaim$/);
            if (Game.time % 1000 == 0 && aclaimFlag) {
                const room = Game.rooms[aclaimFlag[1]];
                if (!room.controller || !room.controller.my) continue;
                room.SpawnMissionAdd('', [], -1, 'aclaimer', { 
                    homeRoom: aclaimFlag[1],
                    targetRoom: Game.flags[flagName].pos.roomName,
                    claimNum: 1,
                } as any);
                continue;
            }
        }
    }
}

export {ClaimModule};

