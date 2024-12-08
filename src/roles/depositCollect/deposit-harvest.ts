const deposit_harvest = {
    source: function(creep: Creep) {
        if (creep.room.name != creep.memory.targetRoom || creep.pos.isRoomEdge()) {
            let opt = {};
            if (creep.room.name != creep.memory.homeRoom) opt = { ignoreCreeps: false };
            creep.moveToRoom(creep.memory.targetRoom, opt);
            return;
        }

        if (!creep.memory['targetDeposit']) {
            // 搜索冷却
            if(creep.memory['findCooldown'] && Game.time % 10) return;
            // 初始化最少Creep绑定计数
            let minCreepCount = Infinity;
            let leastCrowdedDeposit = [];
            let deposits = creep.room.deposit || creep.room.find(FIND_DEPOSITS);
            // 筛选
            let activeDeposits = deposits.filter(d => d.lastCooldown <= 120);
            if (activeDeposits.length > 0) {
                deposits = activeDeposits;
            }
            if (deposits.length == 0) return;
            // 遍历找到最优的来绑定
            deposits.forEach(d => {
                // 统计当前房间内绑定该Deposit的Creep数量
                let creepCount = creep.room.find(FIND_MY_CREEPS, {
                    filter: (c: any) => 
                        c.memory.role === creep.memory.role &&
                        c.memory.targetDeposit === d.id &&
                        c.ticksToLive > 150
                }).length;
                // 最大站位数
                let maxPosCount = creep.room.memory['depositMine'][d.id] || 0;
                // 绑定满的忽略
                if (creepCount >= maxPosCount) return;
                // 记录绑定数最小的采集点
                if (creepCount < minCreepCount) {
                    minCreepCount = creepCount;
                    leastCrowdedDeposit = [d];
                } else if (creepCount === minCreepCount) {
                    leastCrowdedDeposit.push(d);
                }
            })
            // 若有多个结果, 则选取最近的
            let closestDeposit = null;
            if (leastCrowdedDeposit.length == 1) {
                closestDeposit = leastCrowdedDeposit[0];
            } else if (leastCrowdedDeposit.length > 1) {
                closestDeposit = creep.pos.findClosestByRange(leastCrowdedDeposit);
            } else {    // 没有可采集的Deposit
                creep.memory['findCooldown'] = true;
                return; 
            }
            creep.memory['targetDeposit'] = closestDeposit.id;
        }

        const deposit = Game.getObjectById(creep.memory['targetDeposit']) as Deposit;
        if (!deposit) {
            creep.memory['targetDeposit'] = null;
            return;
        }

        if (creep.pos.inRangeTo(deposit, 1)) {
            if (!creep.memory.dontPullMe) creep.memory.dontPullMe = true;
            if (deposit.cooldown == 0) {
                creep.harvest(deposit);
                return false;
            }
            if (creep.getActiveBodyparts(ATTACK) > 0) {
                const hostiles = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 1, {
                    filter: c => c.body.some(p => p.type == WORK || p.type == HEAL)
                });
                if (hostiles.length > 0) creep.attack(hostiles[0]);
            }
        } else{
            if (creep.getActiveBodyparts(ATTACK) > 0) {
                const hostiles = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 1, {
                    filter: c => c.body.some(p => p.type == WORK || p.type == HEAL)
                });
                if (hostiles.length > 0) {
                    creep.attack(hostiles[0]);
                    return false;
                }
            }
            if (creep.memory.dontPullMe) creep.memory.dontPullMe = false;
            creep.moveTo(deposit, {
                visualizePathStyle: { stroke: '#ffaa00' },
                range: 1,
                ignoreCreeps: true
            });
        }

        if (deposit.cooldown > 0 && creep.store.getUsedCapacity() > 0) {
            const nearbyTransport = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
                filter: c => c.memory.role === 'deposit-transfer' && c.store.getFreeCapacity() > 0
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
            filter: c => c.memory.role === 'deposit-transfer' && c.store.getFreeCapacity() > 0
        })[0];
        if (!nearbyTransport) return creep.store.getUsedCapacity() == 0;

        const resourceType = Object.keys(creep.store)[0] as ResourceConstant;
        creep.transfer(nearbyTransport, resourceType);
        return creep.store.getUsedCapacity() == 0;
    }
}

export default deposit_harvest;