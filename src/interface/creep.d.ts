interface Creep {
    init(): void;

    takeEnergy(): void;
    boost(boostTypes: string[]): boolean;
    unboost(): boolean;
    double_move(target: any, color?: string): void;
}

interface CreepMemory {
    
    /**creep 的角色*/
    role: string;
    dontPullMe: boolean;
    mission: task;
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
}