const defend_attack = {
    run: function (creep: Creep) {
        // 攻击敌人
        let Hostiles = (global.Hostiles?.[creep.room.name] || [])
                        .map((id: Id<Creep>) => Game.getObjectById(id))
                        .filter((c: Creep) => c) as Creep[];
        if(Hostiles.length > 0) {
            const hostile = creep.pos.findClosestByRange(Hostiles);
            if(creep.pos.inRangeTo(hostile, 1)) {
                creep.attack(hostile);
            } else {
                creep.moveTo(hostile);
            }
        }
        
    }
}

export default defend_attack