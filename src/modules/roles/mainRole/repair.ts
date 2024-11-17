const RepairWork = function (creep: Creep) {
    // 如果有任务执行，则执行后退出
    if(RepairWorkFunc(creep)) return;
    
    // 如果没有任务，则升级控制器
    const controller = creep.room.controller;
    if (!controller || !controller.my) return;
    
    if (creep.pos.inRangeTo(controller, 3)) {
        creep.upgradeController(controller);
    } else {
        creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
    }
}

const RepairWorkFunc = function (creep: Creep) {
    let target = null;
    let taskType = null;

    if(!creep.memory.cache.task){
        const task = creep.room.getRepairMission(creep);
        if (!task) return false;
        const taskdata = task.data as BuildRepairTask;
        creep.memory.cache.task = taskdata;
        creep.memory.cache.taskid = task.id;
        creep.memory.cache.tasktype = task.type;
    }
    
    if(creep.memory.cache.task){
        const taskdata = creep.memory.cache.task;
        target = Game.getObjectById(taskdata.target);
        taskType = creep.memory.cache.tasktype;
        if(!target || target.hits > taskdata.hits){
            creep.room.deleteMissionFromPool(taskType, creep.memory.cache.task.id);
            creep.memory.cache.task = null;
            return true;
        }
        if(creep.memory.cache.tasktype == 'walls' && creep.store.getUsedCapacity() === 0) {
            const target = Game.getObjectById(creep.memory.cache.task.target) as Structure;
            creep.room.updateMissionPool(
                creep.memory.cache.tasktype,
                creep.memory.cache.taskid,
                { level: Math.floor(target.hits / target.hitsMax * 100) }
            )
            creep.memory.cache.task = null;
            return true;
        }
    }

    if(taskType && target){
        if(taskType === 'repair'){
            if(Game.time % 10 === 0) creep.say('🔧');
            creep.repairOrMoveTo(target);
            return true;
        }
        if(taskType === 'walls'){
            if(Game.time % 10 === 0) creep.say('🔨');
            creep.repairOrMoveTo(target);
            return true;
        }
    }

    if(!target || target.hits > creep.memory.cache.task.hits){
        creep.room.deleteMissionFromPool(taskType, creep.memory.cache.taskid);
        creep.memory.cache.task = null;
        return true;
    }

    return false;
}

const UnitRepair = {
    prepare: function (creep: Creep) {
        return creep.boost(['XLH2O', 'LH2O', 'LH']);
    },
    target: function (creep: Creep) {   // 维修
        if(!creep.memory.ready) return false;
        if(!creep.moveHomeRoom()) return;
        RepairWork(creep);
        if(creep.store.getUsedCapacity() === 0) {
            creep.say('🔄');
            return true;
        } else { return false; }
    },
    source: function (creep: Creep) {   // 获取能量
        if(!creep.memory.ready) return false;
        if(!creep.moveHomeRoom()) return;
        if(creep.ticksToLive < 30 && creep.body.some(part => part.boost)) {
            if(creep.unboost()) creep.suicide();
            return false;
        }
        creep.takeEnergy();
        if(creep.store.getFreeCapacity() === 0) {
            creep.say('🚧');
            return true;
        } else { return false; }
    }
}

export default UnitRepair;