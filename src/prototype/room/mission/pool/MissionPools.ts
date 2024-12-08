/**
 * 任务池被存储在Memory的MissionPools中, 每个room独立存储
 * 
 * 任务池的格式:
 * [ roomName: string ]: {
 *      "任务类型": [任务数组],
 *      ...
 * }
 * 
 * 
 * 任务的格式:
 * {
 *      id: string,     // 任务id
 *      type: string,   // 任务类型
 *      level: number,  // 优先级, 越小越优先
 *      data: any,      // 任务数据, 该模块并不关心任务数据的具体内容, 在执行任务时处理即可
 *      lock?: Id,      // 可选, 绑定该任务的creep Id, 如果任务被锁定, 则其他creep无法获取该任务。
 * }
 */


/** 通用的任务池模块 */
export default class MissionPools extends Room {
    // 任务池初始化
    public initMissionPool() {
        if(!Memory.MissionPools) Memory.MissionPools = {}
        if(!Memory.MissionPools[this.name])  Memory.MissionPools[this.name] = {}
        const Pools = Memory.MissionPools[this.name];
        const PoolTypes = [
            'transport',
            'manage',
            'build',
            'repair',
            'walls',
            'send',
            'spawn'
        ]
        for (const type of Object.keys(Pools)) { if(!PoolTypes.includes(type)) delete Pools[type] }
        for (const type of PoolTypes) { if(!Pools[type]) Pools[type] = [] }
        return OK;
    }

    // (私有方法) 获取任务池
    private getPool(type: Task["type"]) {
        const memory = Memory.MissionPools[this.name];
        if(!memory) return null;
        if(memory[type]) return memory[type];
        console.log(`房间 ${this.name} 的任务池 ${type} 不存在`);
        return null;
    }
    
    // (私有方法) 添加任务到任务池
    private pushTaskToPool(type: Task["type"], task: Task) {
        if(!Memory.MissionPools[this.name][type]) {
            console.log(`任务池 ${type} 不存在`);
            return ERR_NOT_FOUND;
        }
        if(!task) return ERR_NOT_FOUND;
        Memory.MissionPools[this.name][type].push(task);
        return OK;
    }

    // (私有方法) 删除任务池中的任务
    private removeTaskFromPool(type: Task["type"], index: number) {
        if(!Memory.MissionPools[this.name][type]) {
            console.log(`任务池 ${type} 不存在`);
            return ERR_NOT_FOUND;
        }
        Memory.MissionPools[this.name][type].splice(index, 1);
        return OK;
    }

    // (私有方法) 修改任务池中的任务
    private modifyTaskInPool(type: Task["type"], index: number, task: Task) {
        if(!Memory.MissionPools[this.name][type]) {
            console.log(`任务池 ${type} 不存在`);
            return ERR_NOT_FOUND;
        }
        Memory.MissionPools[this.name][type][index] = task;
        return OK;
    }

    // (私有方法) 生成一个16进制id
    private generateId() {
        const Gametime = Game.time.toString(16);
        const Random = Math.random().toString(16).slice(2,11);
        return Gametime + Random;
    }

    // 添加任务到任务池
    public addMissionToPool(type: Task["type"], level: Task["level"], data: Task["data"]) {
        const id = this.generateId(); // 生成id
        let task: Task = {id, type, level, data, lock: null}
        this.pushTaskToPool(type, task);
        return OK;
    }

    // 计算切比雪夫距离
    private getDistance(pos1: string, pos2: string): number {
        const [x1, y1] = pos1.split('/').map(Number);
        const [x2, y2] = pos2.split('/').map(Number);
        return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
    }

    // 获取任务池中的任务
    public getMissionFromPool(type: Task["type"], pos?: string, checkFunc?: (task: Task) => boolean) {
        const tasks = this.getPool(type);
        if (!tasks) { return null; }
        if (tasks.length === 0) return null; // 如果没有任务，返回null

        // 筛选未锁且有效的任务
        const unlockedTasks = tasks.filter(task => task && !task.lock && (checkFunc ? checkFunc(task) : true));

        if (unlockedTasks.length === 0) return null; // 如果没有可用任务，返回null
        if (unlockedTasks.length === 1) return unlockedTasks[0]; // 如果只有一个任务，返回该任务
        
        return unlockedTasks.reduce((prev, curr) => {
            // 任务等级相同时，如果传入了pos，那么根据距离返回任务
            if (prev.level !== curr.level || !pos) return prev.level <= curr.level ? prev : curr;
            if (!prev.data.pos || !curr.data.pos) return prev;
            const prevDistance = this.getDistance(prev.data.pos, pos);
            const currDistance = this.getDistance(curr.data.pos, pos);
            return prevDistance <= currDistance ? prev : curr;
        });
    }

    // 不考虑优先级，直接获取第一个任务
    public getMissionFromPoolFirst(type: Task["type"], checkFunc?: (task: Task) => boolean) {
        const tasks = this.getPool(type).filter(task => task && !task.lock && (checkFunc ? checkFunc(task) : true));
        if (!tasks) { return; }
        if (tasks.length === 0) return null; // 如果没有任务，返回null
        return tasks[0];
    }

    // 获取随机一个任务
    public getMissionFromPoolRandom(type: Task["type"]) {
        const tasks = this.getPool(type);
        if (!tasks) { return; }
        if (tasks.length === 0) return null; // 如果没有任务，返回null
        return tasks[Math.floor(Math.random() * tasks.length)];
    }

    // 获取全部任务
    public getAllMissionFromPool(type: Task["type"]) {
        return this.getPool(type);
    }

    // 用id获取任务池中的任务
    public getMissionFromPoolById(type: Task["type"], id: Task["id"]) {
        const tasks = this.getPool(type);
        if (!tasks) { return; }
        if (tasks.length === 0) return null; // 如果没有任务，返回null
        return tasks.find(t => t.id === id);
    }

    // 检查是否有相同任务
    public checkSameMissionInPool(type: Task["type"], data: Task["data"]) {
        const tasks = this.getPool(type);
        if (!tasks) { return; }
        if (!tasks.length) return null; // 如果没有任务，返回null

        for(const task of tasks) {
            const sameInPool = Object.keys(data).every(key => data[key] === task.data[key]);
            if (!sameInPool) continue;
            return task.id; // 如果存在相同任务，返回任务的id
        }
        return null; // 如果不存在相同任务，返回null
    }

    // 检查任务池中是否存在任务
    public checkMissionInPool(type: Task["type"]) {
        const tasks = this.getPool(type);
        return tasks && tasks.length > 0
    }

    // 获取任务池中的任务数量
    public getMissionNumInPool(type: Task["type"]) {
        const tasks = this.getPool(type);
        return tasks ? tasks.length : 0;
    }

    // 锁定任务池中的任务
    public lockMissionInPool(type: Task["type"], id: Task["id"], creepId: Id<Creep>) {
        const tasks = Memory.MissionPools[this.name][type];
        if (!tasks) { return; }
        if (tasks.length === 0) return; // 如果没有任务，不处理

        const task = tasks.find(t => t.id === id);
        if (!task) { console.log(`任务${id}不存在`);return;}

        task.lock = creepId;
        return OK;
    }

    // 解锁任务池中的任务
    public unlockMissionInPool(type: Task["type"], id: Task["id"]) {
        const tasks = Memory.MissionPools[this.name][type];
        if (!tasks) { return; }
        if (!tasks.length) return; // 如果没有任务，不处理

        const task = tasks.find(t => t.id === id)
        if (task) {console.log(`任务${id}不存在`);return;}

        task.lock = null;
        return OK;
    }

    // 更新任务池中的任务
    public updateMissionPool(type: Task["type"], id: Task["id"], {level, data}) {
        const tasks = Memory.MissionPools[this.name][type];
        if (!tasks) { return; }
        if (!tasks.length) return; // 如果没有任务，不处理

        const task = tasks.find(t => t.id === id);
        if (!task) { console.log(`任务 ${id} 不存在`); return;}

        if (level !== undefined) task.level = level;
        if (data) {
            for(const key in data){
                task.data[key] = data[key];
            }
        }

        return OK;
}

    // 用id删除任务池中的任务
    public deleteMissionFromPool(type: Task["type"], id: Task["id"]) {
        const memory = Memory.MissionPools[this.name];
        if (!memory) { return; }
        const tasks = memory[type];
        if (!tasks) { return; }
        if (!tasks.length) return; // 如果没有任务，不处理

        const index = tasks.findIndex(t => t.id == id);
        if (index === -1) {return;}

        Memory.MissionPools[this.name][type].splice(index, 1);

        return OK
    }

    // 检查任务池中的任务是否已完成、过期、失效
    public checkMissionPool(type: Task["type"], checkFunc: (t: Task) => boolean) {
        const tasks = this.getPool(type);
        if (!tasks) { return; }
        if (!tasks.length) return; // 如果没有任务，不处理

        for (const task of tasks) {
            // 检查函数返回false，则删除任务
            if (!checkFunc(task)) this.deleteMissionFromPool(type, task.id)
        }
        return OK;
    }

    // 提交任务完成信息
    public submitMission(type: Task["type"], id: Task["id"], data: Task["data"], deleteFunc: (t: any) => boolean) {
        // 定位任务
        const tasks = Memory.MissionPools[this.name][type];
        if (!tasks) { return; }
        if (!tasks.length) return; // 如果没有任务，不处理
        const task = tasks.find(t => t.id === id);
        if (!task) { console.log(`任务${id}不存在`);return;}
        // 更新数据
        for(const key in data){
            task.data[key] = data[key];
        }
        // 去除锁定
        task.lock = null;
        // 判断任务是否该被删除
        if(deleteFunc(task.data)) this.deleteMissionFromPool(type, id);
        return OK;
    }
}
