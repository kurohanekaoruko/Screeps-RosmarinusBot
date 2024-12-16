interface PowerCreep {
    init(): void;
    PowerEnabled(): boolean;
    transferOPS(): boolean;
    withdrawOPS(): boolean;
    transferPower(): boolean;
    ToRenew(): boolean;
    
    Generate_OPS(): boolean;    // 生成OPS
    Operate_Factory(): boolean; // 工厂
    Operate_Spawn(): boolean;    // spawn
    Operate_Power(): boolean;      // powerSpawn
    Operate_Extension(): boolean;   // extension
    Operate_Storage(): boolean;    // storage
    Operate_Tower(): boolean;    // tower
    Operate_LAB(): boolean;    // lab
    Regen_Source(): boolean;       // source
    Shield(pos: RoomPosition): boolean;
    
}