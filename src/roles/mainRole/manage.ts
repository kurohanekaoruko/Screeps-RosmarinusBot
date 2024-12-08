/**
 * manage任务执行函数
 * @param {Creep} creep - 执行任务的 creep
 * @returns {boolean} - 是否成功执行任务
 */
function manageMission(creep: Creep): boolean {
    if(!creep.room.checkMissionInPool('manage')) return false;

    const task = creep.room.getMissionFromPoolFirst('manage') as Task;
    let source = null;
    let target = null;

    /** 获取结构对象 */
    const getStructure = (structureKey: string) => {
        return creep.room[structureKey] || null;
    };

    const taskdata = task.data as ManageTask

    source = getStructure(taskdata.source);
    target = getStructure(taskdata.target);

    if (!source || !target) {
        creep.room.deleteMissionFromPool('manage', task.id)
        return false;
    };
    if (!source.pos.inRange(target.pos, 2)) {
        creep.room.deleteMissionFromPool('manage', task.id)
        return false;
    }

    const type = taskdata.resourceType;
    const amount = taskdata.amount;
    
    // 如果任务数据不合法，则移除任务
    if(!amount || typeof amount !== 'number' || amount <= 0) {
        creep.room.deleteMissionFromPool('manage', task.id)
        return false;
    }

    // 如果身上有不是type的资源，先将其放到storage或terminal
    if (handleOtherResources(creep, type)) return true;

    if (creep.store.getUsedCapacity(type) === 0) {
        // 提取资源
        if (creep.store.getFreeCapacity() === 0) return false;
        if (source.store[type] === 0) {
            creep.room.deleteMissionFromPool('manage', task.id);
            return false;
        }
        const withdrawAmount = Math.min(amount, creep.store.getFreeCapacity(type), source.store[type]);
        if (creep.pos.isNearTo(source)) {
            creep.withdraw(source, type, withdrawAmount);
        }
        else creep.moveTo(source,  { visualizePathStyle: { stroke: '#ffaa00' }})

        return true;
    } else {
        if (!creep.pos.isNearTo(target)) {
            creep.moveTo(target, {reusePath: 10, visualizePathStyle: {stroke: '#ffaa00'}});
            return true;
        }
    
        const transferResult = creep.transfer(target, type);
        if (transferResult === ERR_FULL) {
            creep.room.deleteMissionFromPool('manage', task.id);
            return true;
        }
    
        if (transferResult !== OK) {
            return true;
        }
    
        const transferredAmount = Math.min(creep.store[type], amount);
        const data = task.data as TransportTask;
        data.amount -= transferredAmount;
        
        if (data.amount <= 0) {
            creep.room.deleteMissionFromPool('manage', task.id);
        }
        
        return true;
    }
}

/**
 * 处理 creep 身上的其他资源
 * @param {Creep} creep - 需要处理的 creep
 * @param {string} targetType - 目标资源类型
 * @returns {boolean} - 是否处理了其他资源
 */
function handleOtherResources(creep: Creep, targetType: ResourceConstant): boolean {
    const resourceType = Object.keys(creep.store).find(type => type !== targetType && creep.store[type] > 0) as ResourceConstant;
    
    if (!resourceType) return false;

    const storage = creep.room.storage;
    if (storage && storage.store.getFreeCapacity() > 0) {
        return creep.transferOrMoveTo(storage, resourceType);
    }

    const terminal = creep.room.terminal;
    if (terminal && terminal.store.getFreeCapacity() > 0) {
        return creep.transferOrMoveTo(terminal, resourceType);
    }

    creep.say('FULL');

    return false;
}




function LinkEnergyTransfer(creep: Creep) {
    const storage = creep.room.storage;
    const terminal = creep.room.terminal;
    if (!storage && !terminal) return;

    let controllerLink = null;
    let manageLink = null;
    let normalLink = [];
    for(const link of creep.room.link) {
        if(creep.room.source.some((source: any) => link.pos.inRangeTo(source, 2))) {
            continue;
        }
        if(link.pos.inRangeTo(creep.room.controller, 2)) {
            controllerLink = link;
            continue;
        }
        if(link.pos.inRangeTo(storage, 1) || link.pos.inRangeTo(terminal, 1)) {
            manageLink = link;
            continue;
        }
        normalLink.push(link);
    }
    const nlink = normalLink.find((link: any) => link.store[RESOURCE_ENERGY] < 400);

    if (!manageLink) return; // 没有中心Link，不执行任务

    // 向link转移能量
    if (controllerLink && creep.room.level < 8 && controllerLink.store[RESOURCE_ENERGY] < 400) {
        if (manageLink?.store.getFreeCapacity(RESOURCE_ENERGY) < 100) {
            return; // 只在空余空间大于100时转移能量
        }
        if (creep.store[RESOURCE_ENERGY] >= 100) {  // 有能量时转移
            return creep.transferOrMoveTo(manageLink, RESOURCE_ENERGY);
        }
        const source = storage?.store[RESOURCE_ENERGY] > 0 ? storage : null;
        if (source) return creep.withdrawOrMoveTo(source, RESOURCE_ENERGY);
    }
    else if(nlink) {
        if (manageLink?.store.getFreeCapacity(RESOURCE_ENERGY) < 100) {
            return; // 只在空余空间大于100时转移能量
        }
        if (creep.store[RESOURCE_ENERGY] >= 100) {  // 有能量时转移
            return creep.transferOrMoveTo(manageLink, RESOURCE_ENERGY);
        }
        const source = storage?.store[RESOURCE_ENERGY] > 0 ? storage : null;
        if (source) return creep.withdrawOrMoveTo(source, RESOURCE_ENERGY);
    }
    // 从link提取能量
    else if (manageLink?.store[RESOURCE_ENERGY] > 0) {
        if (creep.store.getFreeCapacity() > 0) {
            return creep.withdrawOrMoveTo(manageLink, RESOURCE_ENERGY);
        }
    }
    return false
}


const manageFunction = function (creep: Creep) {
    if (!creep.memory.dontPullMe) creep.memory.dontPullMe = true;
    const storage = creep.room.storage;
    const terminal = creep.room.terminal;

    // 搬运任务
    if (manageMission(creep)) {
        return;
    }
    // 取放Link
    if (LinkEnergyTransfer(creep)) {
        return;
    }
    
    // 将身上的资源存放到storage、terminal中
    const resourceType = Object.keys(creep.store)[0] as ResourceConstant;
    const target = storage?.store.getFreeCapacity(RESOURCE_ENERGY) > 0 ? storage :
                    terminal?.store.getFreeCapacity(RESOURCE_ENERGY) > 0 ? terminal : null;
    if (target && resourceType && creep.store[resourceType] > 0)
        return creep.transferOrMoveTo(target, resourceType);
    
    // // 没有任务时移动到布局中心
    // const centralPos = global.BotMem('rooms', creep.room.name, 'center');
    // if (centralPos) {
    //     const pos = new RoomPosition(centralPos.x, centralPos.y, creep.room.name);
    //     if (!creep.pos.isEqualTo(pos)) {
    //         creep.moveTo(pos, { visualizePathStyle: { stroke: '#ffffff' } });
    //         return;
    //     }
    // }
    return;
};

export default manageFunction;
