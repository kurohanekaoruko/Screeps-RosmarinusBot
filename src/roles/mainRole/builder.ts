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
    let taskid = null;

    if(!creep.memory.cache.task) {
        const task = creep.room.getBuildMission(creep) || creep.room.getRepairMission(creep);
        if (!task) return false;
        const taskdata = task.data as BuildTask | RepairTask;
        creep.memory.cache.task = taskdata;
        creep.memory.cache.taskid = task.id;
        creep.memory.cache.tasktype = task.type;
        const target = Game.getObjectById(taskdata.target) as any;
        if(!target || (task.type !== 'build' && target.hits >= (taskdata as RepairTask).hits)){
            creep.room.deleteMissionFromPool(task.type, task.id);
            delete creep.memory.cache.task;
            delete creep.memory.cache.tasktype;
            return true;
        }
    }
    
    if(creep.memory.cache.task){
        const taskdata = creep.memory.cache.task;
        target = Game.getObjectById(taskdata.target);
        taskType = creep.memory.cache.tasktype;
        taskid = creep.memory.cache.taskid;
        if(!target || (taskType !== 'build' && target.hits >= taskdata.hits)){
            creep.room.deleteMissionFromPool(taskType, taskid);
            delete creep.memory.cache.task;
            delete creep.memory.cache.tasktype;
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
        if(taskType === 'walls'){
            if(Game.time % 10 === 0) creep.say('🔨');
            creep.repairOrMoveTo(target);
            return true;
        }
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
        creep.withdrawEnergy();
        if(creep.store.getFreeCapacity() === 0) {
            creep.say('🚧');
            return true;
        } else { return false; }
    }
}

export default UnitBuilder;