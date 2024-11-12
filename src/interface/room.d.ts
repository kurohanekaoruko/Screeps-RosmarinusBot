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
    /** 房间中的tower对象 */
    tower: StructureTower[];
    /** 房间中的nuker对象 */
    nuker: StructureNuker;
    /** 房间中的lab数组 */
    lab: StructureLab[];
    /** 房间中的link数组 */
    link: StructureLink[];
    /** 房间中的container对象 */
    container: StructureContainer[];
    /** 房间中的extractor对象 */
    extractor: StructureExtractor;
    /** 得到包括此房间所有（按此顺序：）storage、terminal、factory、container的数组 */
    mass_stores: (StructureStorage | StructureTerminal | StructureFactory | StructureContainer)[];
    /** 房间等级 */
    level: number;

    // 房间初始化
    init(): void;
    // 房间建筑缓存更新
    update(): void;
    // 房间运行
    run(): void;
    /** 自动市场交易 */
    autoMarket(): void;
    // Creep数量检查
    CheckCreeps(): void;
    // 处理孵化队列
    SpawnCreeps(): void;
    // 停机检查
    ShutdownInspection(): void;
    // 添加孵化任务到队列
    SpawnQueueAdd(name: string, bodys: number[], memory: any): void;
    // 计算孵化所需能量
    CalculateEnergy(abilityList: any[]): number;
    // 计算角色孵化所需能量
    CalculateRoleEnergy(role: string): number;
    allStructureWork(): void;
    CacheCenterPos(): void;
    // 计算房间内所有结构体能量
    AllEnergy(): number;
    // 返回一个等级, 取决于spawn总容量
    getEffectiveRoomLevel(): number;
    // 生成creep body
    GenerateBodys(abilityList: any[]): any[];
    // 获取房间内最近的source
    closestSource(creep: Creep): Source;
}

interface RoomMemory {
    /** 是否自动从storage运送资源到terminal */
    AUTO_S2T: boolean;
    /** 是否自动从terminal运送资源到storage */
    AUTO_T2S: boolean;
    /** 房间内所有spawn、extension的id */
    spawn_extensions: Array<Id<StructureExtension>|Id<StructureSpawn>>;
    
    /** 房间内所有lab的id */
    labs: Id<StructureLab>[];
    /** 底物lab A */
    labA: Id<StructureLab>;
    /** 底物lab B */
    labB: Id<StructureLab>;
    /** labA 的资源类型 */
    labAtype: ResourceConstant;
    /** labB 的资源类型 */
    labBtype: ResourceConstant;
    /** lab进行boost的资源类型 */
    labsBoostType: { [id: Id<StructureLab>]: ResourceConstant };
    
    /** manage的中心点 */
    centralPos: {x: number, y: number};
    /** 是否启动lab自动合成 */
    lab: boolean;
    /** 是否开启factory生产 */
    factory: boolean;
    /** 是否开启powerSpawn */
    powerSpawn: boolean;


    // /** 房间内所有tower的id */
    // towers: Id<StructureTower>[];
    // /** 房间内所有spawn的id */
    // spawns: Id<StructureSpawn>[];
    // /** 房间内所有extension的id */
    // extensions: Id<StructureExtension>[];
    // /** 房间内extractor的id */
    // extractor: Id<StructureExtractor> | '';
    // /** 房间内所有container的id */
    // containers: Id<StructureContainer>[];
    // /** 房间内所有sourceContainer的id */
    // sourceContainers: { [id: Id<Source>]: Id<StructureContainer>[] };
    // /** 房间内mineralContainer的id */
    // mineralContainer: Id<StructureContainer> | '';
    // /** 房间内controllerContainer的id */
    // controllerContainer: Id<StructureContainer> | '';
    // /** 房间内所有link的id */
    // links: Id<StructureLink>[];
    // /** 房间内所有sourcelink的id */
    // sourceLinks: { [id: Id<Source>]: Id<StructureLink>[] };
    // /** 房间内controllerLink的id */
    // controllerLink: Id<StructureLink> | '';
    // /** 房间内manageLink的id */
    // manageLink: Id<StructureLink> | '';
    // /** 房间内nuker的id */
    // nuker: Id<StructureNuker> | '';
    // /** 房间内所有ruin的id */
    // ruins: Id<StructureRuin>[];

    /** 防御模式 */
    defender: boolean;
    /** factory等级 */
    factoryLevel: number;
    /** 工厂生产类型 */
    factoryTask: ResourceConstant;
    /** 房间运行模式 */
    mode: string;

}