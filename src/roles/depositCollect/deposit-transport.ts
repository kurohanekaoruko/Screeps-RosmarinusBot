const deposit_transport = {
    source: function(creep) {
        if((creep.memory.longMoveEnd||0) > 0 && (creep.memory.longMoveStart||0) > 0) {
            let tick = creep.memory.longMoveEnd - creep.memory.longMoveStart;
            if(tick < 0) tick = 0;
            if (creep.ticksToLive < tick + 20 && creep.store.getUsedCapacity() > 0) {
                return true
            }
        }
        else{
            if(creep.ticksToLive < 200 && creep.store.getUsedCapacity() > 0){
                return true;
            }
        }

        const droppedResources = creep.room.find(FIND_DROPPED_RESOURCES).filter(s => s.resourceType !== RESOURCE_ENERGY);
        if (droppedResources.length > 0) {
            const closestResource = creep.pos.findClosestByRange(droppedResources);
            if (creep.pos.inRangeTo(closestResource, 1)) {
                creep.pickup(closestResource)
            }
            else{
                creep.moveTo(closestResource, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return creep.store.getFreeCapacity() == 0;
        }
        const tombstones = creep.room.find(FIND_TOMBSTONES, {
            filter: s => s.store.getUsedCapacity() > 0 && Object.keys(s.store).some(type => type !== RESOURCE_ENERGY)
        });
        if (tombstones.length > 0) {
            const closestTombstone = creep.pos.findClosestByRange(tombstones);
            if (creep.pos.inRangeTo(closestTombstone, 1)) {
                const resourceType = Object.keys(closestTombstone.store).find(type => type !== RESOURCE_ENERGY);
                creep.withdraw(closestTombstone, resourceType);
            } else {
                creep.moveTo(closestTombstone, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return creep.store.getFreeCapacity() == 0;
        }

        if(!creep.memory.longMoveStart) creep.memory.longMoveStart = Game.time;
        if (creep.room.name != creep.memory.targetRoom || creep.pos.isRoomEdge()) {
            let opt = {};
            if (creep.room.name != creep.memory.homeRoom) opt = { ignoreCreeps: false };
            creep.moveToRoom(creep.memory.targetRoom, opt);
            return;
        }

        const harvesters = creep.room.find(FIND_MY_CREEPS, {
            filter: creep => creep.memory.role === 'deposit-harvest' &&
                             creep.room.name === creep.memory.targetRoom &&
                             creep.store.getUsedCapacity() > 0
        });
        if (harvesters.length > 0) {
            let closestHarvester = creep.pos.findClosestByRange(harvesters, {
                filter: (creep: Creep) => creep.store.getFreeCapacity() == 0
            });
            if (!closestHarvester) closestHarvester = creep.pos.findClosestByRange(harvesters);
            if (!creep.pos.inRangeTo(closestHarvester, 1)) {
                creep.moveTo(closestHarvester, { visualizePathStyle: { stroke: '#00ff00' }, ignoreCreeps: false });
            }
        }

        const deposit = creep.pos.findClosestByRange(creep.room.deposit ?? []);
        if (deposit && creep.pos.inRangeTo(deposit, 3)) {
            creep.moveTo(deposit, {
                visualizePathStyle: { stroke: '#00ff00' },
                ignoreCreeps: false,
                range: 3
            });
        }
        if (!creep.memory.longMoveEnd) creep.memory.longMoveEnd = Game.time;

        return creep.store.getFreeCapacity() == 0
    },
    target: function(creep) {
        if (creep.room.name != creep.memory.homeRoom || creep.pos.isRoomEdge()) {
            let opt = {};
            if (creep.room.name != creep.memory.targetRoom) opt = { ignoreCreeps: false };
            creep.moveToRoom(creep.memory.homeRoom, opt);
            return;
        }

        const target = [creep.room.storage, creep.room.terminal].find(s => s && s.store.getFreeCapacity() > 1000);

        if (creep.room.my && target) {
            const resourceType = Object.keys(creep.store)[0];
            if (creep.pos.inRangeTo(target, 1)) {
                creep.transfer(target, resourceType);
            } else {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            creep.say('no target');
            creep.moveTo(new RoomPosition(25, 25, creep.memory.homeRoom), { visualizePathStyle: { stroke: '#ffaa00' } });
        }
        
        return creep.store.getUsedCapacity() == 0;
    }
}

export default deposit_transport;