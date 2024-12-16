const double_dismantle_action = {
    move: function (creep: Creep) {
        const name = creep.name.match(/#(\w+)/)?.[1] ?? creep.name;
        const moveflag = Game.flags[name + '-move'];
        if(moveflag && !creep.pos.inRangeTo(moveflag.pos, 0)) {
            if(creep.room.name !== moveflag.pos.roomName) {
                creep.memory.targetRoom = moveflag.pos.roomName;
            }
            creep.doubleMove(moveflag.pos, '#ffff00')
        }
        if (moveflag) return true;
        return false
    },
    dismantle: function (creep: Creep) {
        if(creep.room.controller?.my) return false;
        const name = creep.name.match(/#(\w+)/)?.[1] ?? creep.name;
        const disflag = Game.flags[name + '-dis'] || Game.flags['dis-' + creep.room.name];
        if(disflag) {
            const enemiesStructures = disflag.pos.lookFor(LOOK_STRUCTURES);
            if(enemiesStructures.length > 0) {
                const Structures = enemiesStructures.filter((s) => s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_CONTAINER);
                const targetStructure = Structures.find((s) => s.structureType === STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART) ||
                                        Structures[0];
                if(creep.pos.isNearTo(targetStructure)) creep.dismantle(targetStructure);
                else creep.doubleMove(targetStructure.pos, '#ffff00');
                return true;
            }
        }

        return false
    }
}

const double_dismantle = {
    run: function (creep: Creep) {
        if (!creep.memory.notified) {
            creep.notifyWhenAttacked(false);
            creep.memory.notified = true;
        }
        if(!creep.memory.boosted) {
            const boosts = ['XGHO2', 'GHO2', 'GO', 'XZH2O', 'ZH2O', 'ZH', 'XZHO2', 'ZHO2', 'ZO'];
            creep.memory.boosted = creep.goBoost(boosts);
            return
        }
    
        // 等待绑定
        if(!creep.memory.bind) return;
    
        // 获取绑定的另一个creep
        const bindcreep = Game.getObjectById(creep.memory.bind) as Creep;
    
        if(!bindcreep) {
            delete creep.memory.bind;
            return;
        }
    
        if (double_dismantle_action.move(creep)) return;
    
        // 移动到目标房间.未到达房间不继续行动
        if (creep.doubleMoveToRoom(creep.memory.targetRoom, '#ff0000')) return;
    
        if (double_dismantle_action.dismantle(creep)) return;
    }
}

export default double_dismantle;