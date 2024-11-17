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
            'send'
        ]
        for (const type of Object.keys(Pools)) { if(!PoolTypes.includes(type)) delete Pools[type] }
        for (const type of PoolTypes) { if(!Pools[type]) Pools[type] = [] }
        
        return OK;
    }

    // 获取任务池
    private getPool(type: task["type"]) {
        const memory = Memory.MissionPools[this.name];
        if(!memory) return null;
        if(memory[type]) return memory[type];
        console.log(`房间 ${this.name} 的任务池 ${type} 不存在`);
        return null;
    }
    
    // 添加任务到任务池
    private pushTaskToPool(type: task["type"], task: task) {
        Memory.MissionPools[this.name][type].push(task);
    }

    // 生成一个16进制id
    private generateId() {
        const Gametime = Game.time.toString(16);
        const Random = Math.random().toString(16).slice(2,11);
        return Gametime + Random;
    }

    // 添加任务到任务池
    public addMissionToPool(type: task["type"], pos: task["pos"], level: task["level"], data: task["data"]) {
        const id = this.generateId(); // 生成id
        let task: task = {id, type, pos, level, data, lock: false, bind: []}
        const tasks = this.getPool(type);
        if (!tasks) { return; }
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
    public getMissionFromPool(type: task["type"], pos?: task["pos"], checkFunc?: (task: task) => boolean) {
        const tasks = this.getPool(type);
        if (!tasks) { return; }
        if (tasks.length === 0) return null; // 如果没有任务，返回null

        // 筛选未锁且有效的任务
        const unlockedTasks = tasks.filter(task => !task.lock && (checkFunc ? checkFunc(task) : true));

        if (unlockedTasks.length === 0) return null; // 如果没有可用任务，返回null
        if (unlockedTasks.length === 1) return unlockedTasks[0]; // 如果只有一个任务，返回该任务
        
        return unlockedTasks.reduce((prev, curr) => {
            // 任务等级相同时，如果传入了pos，那么根据距离返回任务
            if (prev.level !== curr.level || !pos) return prev.level <= curr.level ? prev : curr;
            const prevDistance = this.getDistance(prev.pos, pos);
            const currDistance = this.getDistance(curr.pos, pos);
            return prevDistance <= currDistance ? prev : curr;
        });
    }

    // 不考虑优先级，直接获取第一个任务
    public getMissionFromPoolFirst(type: task["type"], checkFunc?: (task: task) => boolean) {
        const tasks = this.getPool(type).filter(task => !task.lock && (checkFunc ? checkFunc(task) : true));
        if (!tasks) { return; }
        if (tasks.length === 0) return null; // 如果没有任务，返回null
        return tasks[0];
    }

    // 获取随机一个任务
    public getMissionFromPoolRandom(type: task["type"]) {
        const tasks = this.getPool(type);
        if (!tasks) { return; }
        if (tasks.length === 0) return null; // 如果没有任务，返回null
        return tasks[Math.floor(Math.random() * tasks.length)];
    }

    // 获取全部任务
    public getAllMissionFromPool(type: task["type"]) {
        return this.getPool(type);
    }

    // 用id获取任务池中的任务
    public getMissionFromPoolById(type: task["type"], id: task["id"]) {
        const tasks = this.getPool(type);
        if (!tasks) { return; }
        if (tasks.length === 0) return null; // 如果没有任务，返回null
        return tasks.find(t => t.id === id);
    }

    // 检查是否有相同任务
    public checkSameMissionInPool(type: task["type"], data: task["data"]) {
        const tasks = this.getPool(type);
        if (!tasks) { return; }
        if (!tasks.length) return null; // 如果没有任务，返回null

        for(const task of tasks) {
            const sameInPool = Object.keys(data).every(key => data[key] === task.data[key]);
            if (!sameInPool) continue;
            return task.id; // 如果存在相同任务，返回任务的id
        }
        return null
    }

    // 检查任务池中是否存在任务
    public checkMissionInPool(type: task["type"]) {
        const tasks = this.getPool(type);
        return tasks && tasks.length > 0
    }

    // 获取任务池中的任务数量
    public getMissionNumInPool(type: task["type"]) {
        const tasks = this.getPool(type);
        return tasks ? tasks.length : 0;
    }

    // 锁定任务池中的任务
    public lockMissionInPool(type: task["type"], id: task["id"]) {
        const tasks = Memory.MissionPools[this.name][type];
        if (!tasks) { return; }
        if (tasks.length === 0) return; // 如果没有任务，不处理

        const task = tasks.find(t => t.id === id);
        if (!task) { console.log(`任务${id}不存在`);return;}

        task.lock = true
        return OK;
    }

    // 解锁任务池中的任务
    public unlockMissionInPool(type: task["type"], id: task["id"]) {
        const tasks = Memory.MissionPools[this.name][type];
        if (!tasks) { return; }
        if (!tasks.length) return; // 如果没有任务，不处理

        const task = tasks.find(t => t.id === id)
        if (task) {console.log(`任务${id}不存在`);return;}

        task.lock = false
        task.bind = []
        return OK;
    }

    // 更新任务池中的任务
    public updateMissionPool(type: task["type"], id: task["id"], {pos, level, data}) {
        const tasks = Memory.MissionPools[this.name][type];
        if (!tasks) { return; }
        if (!tasks.length) return; // 如果没有任务，不处理

        const task = tasks.find(t => t.id === id);
        if (!task) { console.log(`任务 ${id} 不存在`); return;}

        if (pos) task.pos = pos
        if (level) task.level = level
        if (data) {
            for(const key in data){
                task.data[key] = data[key];
            }
        }
        return OK;
}

    // 删除任务池中的任务
    public deleteMissionFromPool(type: task["type"], id: task["id"]) {
        const tasks = Memory.MissionPools[this.name][type];
        if (!tasks) { return; }
        if (!tasks.length) return; // 如果没有任务，不处理

        const index = tasks.findIndex(t => t.id === id);
        if (index === -1) {return;}

        tasks.splice(index, 1)
        return OK
    }

    // 检查任务池中的任务是否已完成、过期、失效
    public checkMissionPool(type: task["type"], checkFunc: (t: task) => boolean) {
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
    public submitMissionComplete(type: task["type"], id: task["id"], bindid: task["bind"][number], data: task["data"], deleteFunc: (t: any) => boolean) {
        // 定位任务
        const tasks = Memory.MissionPools[this.name][type];
        if (!tasks) { return; }
        if (!tasks.length) return; // 如果没有任务，不处理
        const task = tasks.find(t => t.id === id);

        // 更新数据
        for(const key in data){
            task.data[key] = data[key];
        }

        // 去除绑定
        const index = task.bind.findIndex(id => id === bindid);
        if(index !== -1) {
            task.bind.splice(index, 1);
            task.lock = false;
        }

        // 判断任务是否该被删除
        if(deleteFunc(task.data)) this.deleteMissionFromPool(type, id);
        return OK;
    }
}
