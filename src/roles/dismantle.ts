
const dismantle = {
    run: function (creep: Creep) {
        if (!creep.memory.notified) {
            creep.notifyWhenAttacked(false);
            creep.memory.notified = true;
        }
        if (!creep.memory.boosted) {
            const boosts = ['XZH2O', 'ZH2O', 'ZH', 'XZHO2', 'ZHO2', 'ZO'];
            creep.memory.boosted = creep.goBoost(boosts);
            return
        }
    
        if (creep.room.name != creep.memory.targetRoom || creep.pos.isRoomEdge()) {
            creep.moveToRoom(creep.memory.targetRoom);
            return
        }
    
        {
            const name = creep.name.match(/#(\w+)/)?.[1] ?? creep.name;
            const moveflag = Game.flags[name + '-move'];
            if(moveflag && !creep.pos.inRangeTo(moveflag.pos, 0)) {
                if(creep.room.name !== moveflag.pos.roomName) {
                    creep.memory.targetRoom = moveflag.pos.roomName;
                }
                creep.moveTo(moveflag.pos, {
                    maxRooms: 1,
                    range: 0,
                })
            }
            if (moveflag) return true;
        }
    
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
                else creep.moveTo(targetStructure,{
                    maxRooms: 1,
                    range: 0,
                });
                return true;
            }
        }
    }
}

export default dismantle;