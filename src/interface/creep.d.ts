interface Creep {
    init(): void;

    moveHomeRoom(): boolean;
    moveToRoom(roomName: string, options?:{[key: string]: any}): any;
    double_move(target: any, color?: string): void;

    withdrawEnergy(): void;
    goBoost(boostTypes: string[]): number;
    boost(boostTypes: string[]): boolean;
    unboost(): boolean;
    transferOrMoveTo(target: AnyCreep | Structure, resoureType: ResourceConstant, amount?: number): boolean;
    withdrawOrMoveTo(target: any | Tombstone | Ruin, resoureType?: ResourceConstant, amount?: number): boolean;
    pickupOrMoveTo(target: any, ...args: any[]): boolean;
    repairOrMoveTo(target: any, ...args: any[]): boolean;
    buildOrMoveTo(target: any, ...args: any[]): boolean;
}

interface CreepMemory {
    role: string;
    dontPullMe: boolean;
    mission: Task;
    cache: { [key: string]: any };
    ready: boolean;
    lastTargetPos: any;
    home: string;
    targetSourceId: string;
    working: boolean;
    homeRoom: string;
    targetRoom: string;
    bind: any;
    notified: boolean;
    boosted: boolean;
    squad: string;
    boostAttempts: any;
    Rerunt: number;
    sayText: string[];
}