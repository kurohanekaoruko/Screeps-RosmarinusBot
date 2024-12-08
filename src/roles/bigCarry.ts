function withdraw(creep: Creep) {
    if (creep.room.name != creep.memory.sourceRoom) {
        creep.moveToRoom(creep.memory.sourceRoom);
        return;
    }

    const res = creep.memory['resource'] || RESOURCE_ENERGY;

    const target = [creep.room.storage, creep.room.terminal].filter((i) => {
        return i && i.store[res] > 0 && (creep.room.my || 
            i.pos.lookFor(LOOK_STRUCTURES).every((i) => i.structureType !== STRUCTURE_RAMPART));
    })[0];

    if (target) {
        creep.withdrawOrMoveTo(target, res);
    }

    return;
}

function transfer(creep: Creep) {
    if (creep.room.name != creep.memory.targetRoom) {
        creep.moveToRoom(creep.memory.targetRoom);
        return;
    }

    const res = creep.memory['resource'] || RESOURCE_ENERGY;

    const target = [creep.room.storage, creep.room.terminal].filter((i) => i && i.store.getFreeCapacity(res) > 0)[0];

    if (target) {
        creep.transferOrMoveTo(target, res);
    }
    
}



const BigCarryFunction = {
    prepare: function (creep: Creep) {
        const boostRes = ['XKH2O', 'KH2O', 'KH', 'XZHO2', 'ZHO2', 'ZO'];
        return creep.goBoost(boostRes);
    },
    source: function (creep: Creep) {
        if(!creep.memory.ready) return false;
        withdraw(creep);
        return creep.store.getFreeCapacity() === 0;
    },
    target: function (creep: Creep) {
        if(!creep.memory.ready) return false;
        transfer(creep);
        return creep.store.getUsedCapacity() === 0;
    }
};

export default BigCarryFunction;