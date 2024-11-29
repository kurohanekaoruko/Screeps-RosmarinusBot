const deposit_harvest = {
    source: function(creep: Creep) {
        if (creep.room.name != creep.memory.targetRoom || creep.pos.isRoomEdge()) {
            let opt = {};
            if (creep.room.name != creep.memory.homeRoom) opt = { ignoreCreeps: false };
            creep.moveToRoom(creep.memory.targetRoom, opt);
            return;
        }

        const depositIndex = creep.memory['depositIndex'];
        const deposit = creep.room.deposit[depositIndex] || creep.room.find(FIND_DEPOSITS)[depositIndex];

        if(!deposit) {
            if(creep.room.deposit) {
                creep.memory['depositIndex'] = 0;
            } else creep.suicide();
            return;
        }

        if(creep.pos.inRangeTo(deposit, 1)) {
            if(deposit.cooldown == 0) creep.harvest(deposit)
        }
        else{
            creep.moveTo(deposit, { visualizePathStyle: { stroke: '#ffaa00' } });
        }

        if (deposit.cooldown > 0 && creep.store.getUsedCapacity() > 0) {
            const nearbyTransport = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
                filter: c => c.memory.role === 'deposit-transport' && c.store.getFreeCapacity() > 0
            })[0];
            if(nearbyTransport){
                const resourceType = Object.keys(creep.store)[0] as ResourceConstant;
                if (creep.pos.inRangeTo(nearbyTransport, 1)) {
                    creep.transfer(nearbyTransport, resourceType);
                }
                return false;
            }
        }

        return creep.store.getFreeCapacity() == 0;
    },
    target: function(creep: Creep) {
        const nearbyTransport = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
            filter: c => c.memory.role === 'deposit-transport' && c.store.getFreeCapacity() > 0
        })[0];
        if (!nearbyTransport) return creep.store.getUsedCapacity() == 0;

        const resourceType = Object.keys(creep.store)[0] as ResourceConstant;
        creep.transfer(nearbyTransport, resourceType);
        return creep.store.getUsedCapacity() == 0;
    }
}

export default deposit_harvest;