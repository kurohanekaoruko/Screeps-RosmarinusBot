const ClaimModule = {
    tickEnd: function () {
        if (Game.time % 10) return;
        for (const flagName in Game.flags) {
            // 占领
            const claimFlag = flagName.match(/^([EW][1-9]+[NS][1-9]+)[-_#/]claim(?:[-_#/].*)?$/);
            if (claimFlag) {
                continue;
            }
            
            // 搜刮资源
            const despoilFlag = flagName.match(/^([EW][1-9]+[NS][1-9]+)[-_#/]despoil(?:[-_#/].*)?$/);
            if (Game.time % 500 == 0 && despoilFlag) {
                const room = Game.rooms[despoilFlag[1]];
                if (!room.controller || !room.controller.my) continue;
                room.SpawnMissionAdd('', [], -1, 'logistics', { 
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

