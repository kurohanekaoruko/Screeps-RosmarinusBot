const cleaner = {
    run: function (creep: Creep) {
        if (!creep.memory.notified) {
            creep.notifyWhenAttacked(false);
            creep.memory.notified = true;
        }
        if (creep.room.name != creep.memory.targetRoom || creep.pos.isRoomEdge()) {
            creep.moveToRoom(creep.memory.targetRoom);
            return
        }

        if (!creep.memory['NO_PATH']) creep.memory['NO_PATH'] = [];
        const target = Game.getObjectById(creep.memory['targetId']) as Structure;

        if (!target) {
            const enemiesStructures = creep.room.find(FIND_HOSTILE_STRUCTURES);
            if(enemiesStructures.length == 0) return;
            const Structures = enemiesStructures.filter((s) =>
                s.hits && s.hits > 0 && s.hits < 1e4 &&
                s.structureType != STRUCTURE_STORAGE && s.structureType != STRUCTURE_TERMINAL);
            const targetStructure = creep.pos.findClosestByRange(Structures, {
                filter: (s: any) => !creep.memory['NO_PATH'].includes(s.id)
            });
            if (!targetStructure) return;
            const result = creep.moveTo(targetStructure, {maxRooms: 1,range: 1});
            if (result == ERR_NO_PATH) {
                creep.memory['NO_PATH'].push(targetStructure.id);
                return;
            }
            creep.memory['targetId'] = targetStructure.id;
            return;
        }

        if (!target) return;
        if(creep.pos.isNearTo(target)) creep.dismantle(target);
        else creep.moveTo(target,{maxRooms: 1,range: 1});

        return true;
    }
}


export default cleaner;