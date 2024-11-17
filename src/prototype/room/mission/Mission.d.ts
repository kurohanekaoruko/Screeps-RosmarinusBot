interface Room {
    // 任务池初始化
    initMissionPool(): OK | void;
    // 添加任务到任务池
    addMissionToPool(type: task["type"], pos: task["pos"], level: task["level"], data: task["data"]): OK | void;
    // 获取任务池中的任务
    getMissionFromPool(type: task["type"], pos?: task["pos"], checkFunc?: (task: task) => boolean): task | null;
    // 获取任务池中的第一个任务
    getMissionFromPoolFirst(type: task["type"], checkFunc?: (task: task) => boolean): task | null;
    // 获取任务池中的随机一个任务
    getMissionFromPoolRandom(type: task["type"]): task | null;
    // 获取任务池中的所有任务
    getAllMissionFromPool(type: task["type"]): task[] | null;
    // 用id获取任务池中的任务
    getMissionFromPoolById(type: task["type"], id: task["id"]): task | null;
    // 检查是否有相同任务
    checkSameMissionInPool(type: task["type"], data: task["data"]): task['id'] | null;
    // 检查任务池中是否存在任务
    checkMissionInPool(type: task["type"]): boolean;
    // 检查任务池中的任务数量
    getMissionNumInPool(type: task["type"]): number;
    // 锁定任务池中的任务
    lockMissionInPool(type: task["type"], id: task["id"]): OK | void;
    // 解锁任务池中的任务
    unlockMissionInPool(type: task["type"], id: task["id"]): OK | void;
    // 更新任务池中的任务
    updateMissionPool(type: task["type"], id: task["id"], 
        {pos, level, data, lock, bind}: 
        {pos?: task["pos"], level?: task["level"], data?: task["data"], lock?: task["lock"], bind?: task["bind"]}): OK | void;
    // 删除任务池中的任务
    deleteMissionFromPool(type: task["type"], id: task["id"]): OK | void;
    // 检查任务池中的任务是否已完成、过期、失效
    checkMissionPool(type: task["type"], checkFunc: (t: task) => boolean): OK | void;
    // 提交任务完成信息
    submitMissionComplete(type: task["type"], id: task["id"], bindid: task["bind"][number], data: task["data"], deleteFunc: (t: any) => boolean): OK | void;


    // 添加中央搬运任务
    ManageMissionAdd(source: string, target: string, resourceType: any, amount: number): void;
    // 添加建造与维修任务
    BuildRepairMissionAdd(type: 'build' | 'repair' | 'walls', pos: string, level: number, data: any): void;
    // 添加运输任务
    TransportMissionAdd(pos: string, level: number, data: TransportTask): OK | void;
    // 添加资源发送任务
    SendMissionAdd(target: string, resourceType: string | ResourceConstant, amount: number): OK | void;

    // 获取运输任务
    getTransportMission(creep: Creep): task | null;
    // 获取建造或维修任务
    getBuildMission(creep: Creep): task | null;
    // 获取维修或刷墙任务
    getRepairMission(creep: Creep): task | null;
    // 获取发送任务的总发送数量
    getSendMissionTotalAmount(): {[type: string]: number};
    
    // 提交任务完成信息
    doneTransportMission(id: task['id'], amount: TransportTask['amount'], creepid: Id<Creep>): void;

    // 任务更新
    MissionUpdate(): void;
}

interface Memory {
    MissionPools: {
        [roomName: string]: MissionPool
    };
}

interface MissionPool {
    [type: string]: task[]
};

interface task {
    id: string, // 任务id
    type: 'transport' | 'manage' | 'build' | 'repair' | 'walls' | 'send',  // 任务类型
    pos: string,  // 任务位置，x/y/roomName
    level: number,  // 优先级
    data: TransportTask | BuildRepairTask | ManageTask | SendTask  // 任务数据
    lock?: boolean, // 任务是否被锁定
    bind?: Array<Id<Creep>>,   // 任务绑定creep
}

interface TransportTask {
    source: Id<Structure>,  // 资源来源
    target: Id<Structure>,  // 资源目标
    resourceType: ResourceConstant, // 资源类型
    amount: number, // 资源数量
}

interface BuildRepairTask {
    target: Id<Structure> | Id<ConstructionSite>,
    hits?: number,
}

interface ManageTask {
    source: 'storage' | 'terminal' | 'link' | 'factory',  // 资源来源
    target: 'storage' | 'terminal' | 'link' | 'factory',  // 资源目标
    resourceType: ResourceConstant,
    amount: number,
}

interface SendTask {
    targetRoom: string,
    resourceType: ResourceConstant,
    amount: number,
}