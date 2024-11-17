const BuildWork = function (creep: Creep) {
    // 如果有任务执行，则执行后退出
    if(BuildWorkFunc(creep)) return;
    
    // 如果没有任务，则升级控制器
    const controller = creep.room.controller;
    if (!controller || !controller.my) return;
    
    if (creep.pos.inRangeTo(controller, 3)) {
        creep.upgradeController(controller);
    } else {
        creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
    }
}

const BuildWorkFunc = function (creep: Creep) {
    let target = null;
    let taskType = null;

    if(!creep.memory.cache.task) {
        const task = creep.room.getBuildMission(creep);
        if (!task) return false;
        const taskdata = task.data as BuildRepairTask;
        creep.memory.cache.task = taskdata;
        creep.memory.cache.tasktype = task.type;
        if(task.type === 'build'){
            creep.memory.cache.buildtype = (Game.getObjectById(taskdata.target) as ConstructionSite).structureType;
        }
    }
    
    if(creep.memory.cache.task){
        const taskdata = creep.memory.cache.task;
        target = Game.getObjectById(taskdata.target);
        taskType = creep.memory.cache.tasktype;
        if(taskType === 'build' && !target){
            creep.room.deleteMissionFromPool(taskType, creep.memory.cache.task.id);
            creep.room.update(creep.memory.cache.buildtype);
            delete creep.memory.cache.task;
            return true;
        }
        if(taskType === 'repair' && target.hits > taskdata.hits){
            creep.room.deleteMissionFromPool(taskType, creep.memory.cache.task.id);
            delete creep.memory.cache.task;
            return true;
        }
    }

    if(taskType && target){
        if(taskType === 'build'){
            if(Game.time % 10 === 0) creep.say('🏗️');   
            creep.buildOrMoveTo(target);
            return true;
        }
        if(taskType === 'repair'){
            if(Game.time % 10 === 0) creep.say('🔧');
            creep.repairOrMoveTo(target);
            return true;
        }
    }

    if(!target || (taskType === 'repair' && target.hits > creep.memory.cache.task.hits)){
        creep.room.deleteMissionFromPool(taskType, creep.memory.cache.task.id);
        delete creep.memory.cache.task;
        return true;
    }

    return false;
}

const UnitBuilder = {
    prepare: function (creep: Creep) {
        return creep.boost(['XLH2O', 'LH2O', 'LH']);
    },
    target: function (creep: Creep) {   // 建造
        if(!creep.memory.ready) return false;
        if(!creep.moveHomeRoom()) return;
        BuildWork(creep);
        if(creep.store.getUsedCapacity() === 0) {
            creep.say('🔄');
            return true;
        } else { return false; }
    },
    source: function (creep: Creep) {   // 获取能量
        if(!creep.memory.ready) return false;
        if(!creep.moveHomeRoom()) return;
        creep.takeEnergy();
        if(creep.store.getFreeCapacity() === 0) {
            creep.say('🚧');
            return true;
        } else { return false; }
    }
}

export default UnitBuilder;