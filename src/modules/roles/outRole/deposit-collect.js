

const depositHarvest = {
    source: function(creep) {
        if (creep.room.name != creep.memory.targetRoom) {
            creep.moveToRoom(creep.memory.targetRoom);
            return;
        }

        if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveToRoom(creep.room.name);
            return;
        }
        
        const deposit = creep.room.find(FIND_DEPOSITS)[0];

        if(!deposit) {
            const flags = Object.keys(Game.flags);
            for (const flagName of flags) {
                const flag = Game.flags[flagName];
                if (flag.roomName === creep.room.name && flagName.match(/^collect[-_#/ ]([EW]\d+[NS]\d+)[-_#/ ](\d+)(?:[-_#/ ].*)?$/)) {
                    flag.remove();
                    break;
                }
            }
            creep.suicide();
        }

        if (deposit.cooldown > 0 && creep.store.getUsedCapacity() > 0) {
            const nearbyTransport = creep.pos.findInRange(FIND_MY_CREEPS, 3, {
                filter: c => c.memory.role === 'deposit-transport' && c.store.getFreeCapacity() > 0
            })[0];
            if(nearbyTransport){
                const resourceType = Object.keys(creep.store)[0];
                if (creep.pos.inRangeTo(nearbyTransport, 1)) {
                    creep.transfer(nearbyTransport, resourceType);
                } else {
                    creep.moveTo(nearbyTransport, { visualizePathStyle: { stroke: '#ffffff' } });
                }
                return false;
            }
        }

        if(creep.pos.inRangeTo(deposit, 1)) {
            if(deposit.cooldown <= 0) creep.harvest(deposit)
        }
        else{
            creep.moveTo(deposit, { visualizePathStyle: { stroke: '#ffaa00' } });
        }

        return creep.store.getFreeCapacity() == 0;
    },
    target: function(creep) {
        const nearbyTransport = creep.pos.findInRange(FIND_MY_CREEPS, 3, {
            filter: c => c.memory.role === 'deposit-transport' && c.store.getFreeCapacity() > 0
        })[0];
        if (!nearbyTransport) return;

        const resourceType = Object.keys(creep.store)[0];
        if (creep.pos.inRangeTo(nearbyTransport, 1)) {
            creep.transfer(nearbyTransport, resourceType);
        } else {
            creep.moveTo(nearbyTransport, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return creep.store.getUsedCapacity() == 0;
    }
}

const depositTransport = {
    source: function(creep) {
        if((creep.memory.longMoveEnd||0) > 0 && (creep.memory.longMoveStart||0) > 0) {
            const tick = creep.memory.longMoveEnd - creep.memory.longMoveStart;
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
        if (creep.room.name != creep.memory.targetRoom) {
            creep.moveToRoom(creep.memory.targetRoom)
            return;
        }
        if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveToRoom(creep.room.name)
            return;
        }

        const harvesters = _.filter(Game.creeps, creep => creep.memory.role === 'deposit-harvest' && creep.room.name === creep.memory.targetRoom);
        if (harvesters.length > 0) {
            const centerX = _.sum(harvesters, creep => creep.pos.x) / harvesters.length;
            const centerY = _.sum(harvesters, creep => creep.pos.y) / harvesters.length;
            const centerPosition = new RoomPosition(Math.round(centerX), Math.round(centerY), creep.memory.targetRoom);
            creep.moveTo(centerPosition, { visualizePathStyle: { stroke: '#00ff00' } });
        }
        if(!creep.memory.longMoveEnd) creep.memory.longMoveEnd = Game.time;

        return creep.store.getFreeCapacity() == 0
    },
    target: function(creep) {
        if (creep.room.name != creep.memory.homeRoom) {
            creep.moveToRoom(creep.memory.homeRoom)
            return;
        }
    
        if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
            creep.moveToRoom(creep.room.name)
            return;
        }


        if (creep.room.controller && creep.room.controller.my && creep.room.storage) {
            const resourceType = Object.keys(creep.store)[0];
            if (creep.pos.inRangeTo(creep.room.storage, 1)) {
                creep.transfer(creep.room.storage, resourceType);
            } else {
                creep.moveTo(creep.room.storage, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.homeRoom), { visualizePathStyle: { stroke: '#ffaa00' } });
        }
        
        return creep.store.getUsedCapacity() == 0;
    }
}

export { depositHarvest, depositTransport };