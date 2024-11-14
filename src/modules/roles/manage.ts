/**
 * manage任务执行函数
 * @param {Creep} creep - 执行任务的 creep
 * @returns {boolean} - 是否成功执行任务
 */
function manageMission(creep: Creep): boolean {
    if(!creep.room.checkMissionInPool('manage')) return false;

    const task = creep.room.getMissionFromPoolFirst('manage') as task;
    let source = null;
    let target = null;
    /**
     * 获取结构对象
     */
    const getStructure = (structureKey: string) => {
        return structureKey === 'storage' || structureKey === 'terminal' || structureKey === 'factory'
               ? creep.room[structureKey] 
               : null;
    };

    const taskdata = task.data as ManageTask

    source = getStructure(taskdata.source);
    target = getStructure(taskdata.target);

    if (!source || !target) {
        creep.room.deleteMissionFromPool('manage', task.id)
        return false;
    };

    const type = taskdata.resourceType;
    const amount = taskdata.amount;

    // 如果目标结构没有空余空间，则移除任务
    if(target.store.getFreeCapacity() === 0) {
        creep.room.deleteMissionFromPool('manage', task.id)
        return false;
    };
    // 如果源结构没有足够资源，则移除任务
    if(source.store.getUsedCapacity(type) < amount) {
        creep.room.deleteMissionFromPool('manage', task.id)
        return false;
    }

    // 如果身上有不是type的资源，先将其放到storage或terminal
    if (handleOtherResources(creep, type)) return true;

    if (creep.store.getUsedCapacity(type) === 0) {
        return handleWithdraw(creep, source, type, amount, task);
    } else {
        return handleTransfer(creep, target, type, amount, task);
    }
}

/**
 * 处理 creep 身上的其他资源
 * @param {Creep} creep - 需要处理的 creep
 * @param {string} targetType - 目标资源类型
 * @returns {boolean} - 是否处理了其他资源
 */
function handleOtherResources(creep: Creep, targetType: ResourceConstant): boolean {
    const resourceType = Object.keys(creep.store).find(type => type !== targetType && creep.store[type] > 0);
    
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

/**
 * 处理从源结构提取资源
 * @param {Creep} creep - 执行任务的 creep
 * @param {Structure} source - 源结构
 * @param {string} type - 资源类型
 * @param {number} amount - 需要提取的数量
 * @param {task} task - 任务对象
 * @returns {boolean} - 是否成功处理
 */
function handleWithdraw(creep: Creep, source: any, type: ResourceConstant, amount: number, task: task): boolean {
    if (creep.store.getFreeCapacity() === 0) return false;
    
    if (source.store[type] === 0) {
        creep.room.deleteMissionFromPool('manage', task.id);
        return false;
    }

    const withdrawAmount = Math.min(amount, creep.store.getFreeCapacity(type), source.store[type]);
    if (creep.pos.isNearTo(source)) creep.withdraw(source, type, withdrawAmount)
    else creep.moveTo(source,  { visualizePathStyle: { stroke: '#ffaa00' }})

    return true;
}

/**
 * 处理向目标结构转移资源
 * @param {Creep} creep - 执行任务的 creep
 * @param {Structure} target - 目标结构
 * @param {string} type - 资源类型
 * @param {number} amount - 需要转移的数量
 * @param {Array} task - 管理任务队列
 * @returns {boolean} - 是否成功处理
 */
function handleTransfer(creep: Creep, target: any, type: ResourceConstant, amount: number, task: task): boolean {
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


const manageFunction = function (creep: Creep) {
    if (!creep.memory.dontPullMe) creep.memory.dontPullMe = true;
    const storage = creep.room.storage;
    const terminal = creep.room.terminal;
    
    if(manageMission(creep)) {
        return;
    }
    
    // 检查身上是否有非能量资源并存放到storage
    if (storage) {
        const resourceType = Object.keys(creep.store)[0] || RESOURCE_ENERGY;
        if (resourceType !== RESOURCE_ENERGY) {
            creep.transferOrMoveTo(storage, resourceType);
            return;
        }
    }

    const controllerLink = creep.room.link.find(l => l.pos.inRangeTo(creep.room.controller, 2));
    const manageLink = creep.room.link.find(l => l.pos.inRangeTo(creep.room.storage, 2));

    if (controllerLink && creep.room.level < 8 && controllerLink.store[RESOURCE_ENERGY] < 400) {
        if (manageLink?.store.getFreeCapacity(RESOURCE_ENERGY) < 100) {
            return; // 只在空余空间大于100时转移能量
        }
        if (creep.store[RESOURCE_ENERGY] >= 100) {  // 有能量时转移
            return creep.transferOrMoveTo(manageLink, RESOURCE_ENERGY);
        }
        const source = storage?.store[RESOURCE_ENERGY] > 0 ? storage : 
                        terminal?.store[RESOURCE_ENERGY] > 0 ? terminal : null;
        if (source) return creep.withdrawOrMoveTo(source, RESOURCE_ENERGY);
    } 
    
    else if (manageLink?.store[RESOURCE_ENERGY] > 0) {
        if (creep.store[RESOURCE_ENERGY] === 0) {
            return creep.withdrawOrMoveTo(manageLink, RESOURCE_ENERGY);
        }
    }

    if (creep.store[RESOURCE_ENERGY] > 0) {
        const target = storage?.store.getFreeCapacity(RESOURCE_ENERGY) > 0 ? storage :
                        terminal?.store.getFreeCapacity(RESOURCE_ENERGY) > 0 ? terminal : null;
        if (target) return creep.transferOrMoveTo(target, RESOURCE_ENERGY);
    }

    // 闲置时移动到布局中心
    const centralPos = creep.room.memory.centralPos;
    if (centralPos) {
        const pos = new RoomPosition(centralPos.x, centralPos.y, creep.room.name);
        if (!creep.pos.isEqualTo(pos)) {
            creep.moveTo(pos, { visualizePathStyle: { stroke: '#ffffff' } });
            return; // 如果正在移动，直接返回
        }
    }
    return;
};

export default manageFunction;
