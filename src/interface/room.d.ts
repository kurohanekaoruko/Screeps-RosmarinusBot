interface Room {
    /** 房间中的source数组 */
    source: Source[];
    /** 房间中的mineral对象 */
    mineral: Mineral;
    /** 房间中的spawn数组 */
    spawn: StructureSpawn[];
    /** 房间中的extension数组 */
    extension: StructureExtension[];
    /** 房间中的powerSpawn对象 */
    powerSpawn: StructurePowerSpawn;
    /** 房间中的factory对象 */
    factory: StructureFactory;
    /** 房间中的tower数组 */
    tower: StructureTower[];
    /** 房间中的nuker对象 */
    nuker: StructureNuker;
    /** 房间中的lab数组 */
    lab: StructureLab[];
    /** 房间中的link数组 */
    link: StructureLink[];
    /** 房间中的container数组 */
    container: StructureContainer[];
    /** 房间中的extractor对象 */
    extractor: StructureExtractor;
    /** 房间中的observer对象 */
    observer: StructureObserver;
    /** 得到包括此房间所有（按此顺序：）storage、terminal、factory、container的数组 */
    mass_stores: (StructureStorage | StructureTerminal | StructureFactory | StructureContainer)[];
    /** 房间中的powerBank数组 */
    powerBank: StructurePowerBank[];
    /** 房间中的deposit数组 */
    deposit: StructureDeposit[];
    /** 房间等级 */
    level: number;
    /** 房间是否为自己所有 */
    my: boolean;

    // 房间初始化
    init(): void;
    // 房间建筑缓存更新
    update(type?: StructureConstant): void;
    // 房间运行
    run(): void;
    
    // Creep数量检查
    CheckCreeps(): void;
    // 处理孵化队列
    SpawnCreeps(): void;
    // 停机检查
    ShutdownInspection(): void;
    // 计算孵化所需能量
    CalculateEnergy(abilityList: any[]): number;
    // 计算角色孵化所需能量
    CalculateRoleEnergy(role: string): number;
    // 主动防御
    activeDefend(): void;
    // 全部建筑工作
    StructureWork(): void;
    // 计算中心点
    CacheCenterPos(): void;
    // 计算房间内所有结构体能量
    AllEnergy(): number;
    // 获取房间指定资源储备
    getResourceAmount(type: ResourceConstant | string): number;
    // 获取属于该房间的creep数量
    getCreepNum(): { [role: string]: number };
    // 返回一个等级, 取决于spawn总容量
    getEffectiveRoomLevel(): number;
    // 动态生成体型, 压缩形式
    DynamicBodys(role): number[];
    // 生成creep body
    GenerateBodys(abilityList: any[], role?: string): BodyPartConstant[];
    // 获取房间内最近的source
    closestSource(creep: Creep): Source;
    // 自动按照预设布局建造建筑
    autoBuild(): void;
    // 自动市场交易
    autoMarket(): void;
    // 自动lab合成
    autoLab(): void;
    // 自动工厂生产
    autoFactory(): void;
    // 外矿采集模块
    outMine(): void;
}

interface RoomMemory {
    /** 是否自动从storage运送资源到terminal */
    AUTO_S2T: boolean;
    /** 是否自动从terminal运送资源到storage */
    AUTO_T2S: boolean;
    /** 房间内所有spawn、extension的id */
    spawn_extensions: Array<Id<StructureExtension>|Id<StructureSpawn>>;
    
    /** source周边的最大可用位置数 */
    sourcePosCount: { [source_id: string]: number };
    
    /** 房间布局的中心点 */
    centralPos: {x: number, y: number};
    /** 是否启动lab自动合成 */
    lab: boolean;
    /** 是否开启factory生产 */
    factory: boolean;
    /** 是否开启powerSpawn */
    powerSpawn: boolean;

    /** 防御模式 */
    defend: boolean;
    /** factory等级 */
    factoryLevel: number;
    /** 工厂生产产物 */
    factoryProduct: ResourceConstant;
    /** 房间运行模式 */
    mode: string;

}