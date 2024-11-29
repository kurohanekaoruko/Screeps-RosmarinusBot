import { harvester, carrier, transport, manage, upgrader, builder, repair, miner, 
         harvest_carry, SpeedUpgrader, logistics, claimer, lclaimer } from '@/roles'
import { outScout, outHarvest, outCarry, outBuild, outClaim, outDefend, outInvader, outAttack } from '@/roles';
import { power_attack, power_heal, power_carry, power_defend } from '@/roles';
import { deposit_harvest, deposit_transport } from '@/roles';
import { one_tough } from '@/roles';
import { double_attack, double_dismantle, double_carry, double_heal, double_tough, double_defender } from '@/roles'


interface RoleConfig {
    [key: string]: {
        num: number,         // 默认数量
        ability: number[],   // 默认body个数 [work,carry,move,attack,ranged_attack,heal,claim,tough] 总数别超过50
        adaption?: boolean,  // 自适应体型
        must?: boolean,      // 是否无论战争还是和平都得孵化
        level?: number,      // 孵化优先级
        code?: string,        // 每种爬虫的代号
        work?: {
            prepare?: (creep: Creep) => boolean,
            source: (creep: Creep) => boolean,
            target: (creep: Creep) => boolean,
        },  // 爬虫的执行函数, 在两种工作状态之间切换，以固定工作为主
        mission?: (creep: Creep) => void,  // 爬虫的执行函数，单一工作逻辑，以任务为主
        action?: (creep: Creep) => void,  // 爬虫的执行函数，受指挥行动
    }
}


export const RoleData: RoleConfig = {
    /* 基本房间运营 */
    'harvester': { num: 0, ability: [1, 1, 2, 0, 0, 0, 0, 0], adaption: true, level: 3, code: 'H', work: harvester },  // 采集
    'carrier': { num: 0, ability: [0, 3, 3, 0, 0, 0, 0, 0], adaption: true, level: 4, code: 'C', work: carrier },  // 矿点搬运
    'transport': { num: 0, ability: [0, 2, 2, 0, 0, 0, 0, 0], adaption: true, level: 2, code: 'T', mission: transport }, // 资源运输填充
    'manage': { num: 0, ability: [0, 1, 1, 0, 0, 0, 0, 0], adaption: true, level: 1, code: 'M', mission: manage }, // 中央搬运
    'upgrader': { num: 0, ability: [1, 1, 2, 0, 0, 0, 0, 0], adaption: true, level: 10, code: 'U', work: upgrader }, // 升级
    'builder': { num: 0, ability: [1, 1, 2, 0, 0, 0, 0, 0], adaption: true, level: 10, code: 'B', work: builder }, // 建造
    'repair': { num: 0, ability: [1, 1, 1, 0, 0, 0, 0, 0], adaption: true, level: 8, code: 'R', work: repair }, //维修、刷墙
    'miner': { num: 0, ability: [1, 1, 2, 0, 0, 0, 0, 0], adaption: true, level: 6, code: 'MR', work: miner }, // 矿工

    /* 特殊用途 */
    'har-car': { num: 0, ability: [1, 1, 2, 0, 0, 0, 0, 0], level: 0, code: 'HC', work: harvest_carry }, // 采集搬运一体机，处理停摆状况，以及房间早期没有container时孵化
    'speedup-upgrad': { num: 0, ability: [2, 1, 1, 0, 0, 0, 0, 0], adaption: true, level: 11, code: 'SU', work: SpeedUpgrader }, // 加速升级
    'speedup-repair': { num: 0, ability: [25, 5, 15, 0, 0, 0, 0, 0], level: 11, code: 'SR', work: repair }, // 加速刷墙
    'logistics': { num: 0, ability: [0, 2, 2, 0, 0, 0, 0, 0], adaption: true, level: 1, code: 'L', work: logistics }, // 长途运输
    
    /* 占领房间 */
    'claimer': { num: 0, ability: [0, 0, 4, 0, 0, 0, 4, 0], level: 11, adaption: true, work: claimer },
    'lclaimer': { num: 0, ability: [0, 0, 10, 0, 0, 9, 1, 0], level: 11, code: 'LC', action: lclaimer },

    /* 战斗相关 */
    /* 二人队 */
    'double-attack': { num: 0, ability: [0, 0, 10, 28, 0, 0, 0, 12], level: 10, code: '2A', action: double_attack},
    'double-dismantle': { num: 0, ability: [28, 0, 10, 0, 0, 0, 0, 12], level: 10, code: '2D', action: double_dismantle},
    'double-carry': { num: 0, ability: [0, 28, 10, 0, 0, 0, 0, 12], level: 10, code: '2C', action: double_carry},
    'double-heal': { num: 0, ability: [0, 0, 10, 0, 0, 28, 0, 12], level: 10, code: '2H', action: double_heal},
    'double-tough': { num: 0, ability: [0, 0, 10, 0, 0, 0, 0, 20], level: 10, code: '2T', action: double_tough},

    /* 一体机 */
    'one-tough': { num: 0, ability: [0, 0, 20, 0, 0, 14, 0, 6], level: 10, code: '1T', action: one_tough},
    'one-ranged': { num: 0, ability: [0, 0, 10, 0, 5, 23, 0, 12], level: 10, code: '1R', action: null},
    
    /* 主动防御 */
    'defend-attack': { num: 0, ability: [0, 0, 10, 40, 0, 0, 0, 0], level: 8, code: "DA", must: true },
    'defend-range': { num: 0, ability: [0, 0, 10, 0, 40, 0, 0, 0], level: 8, code: "DR", must: true },
    'defend-2Attack': { num: 0, ability: [0, 0, 10, 25, 0, 0, 0, 15], level: 7, code: "D2A", action: double_defender },
    'defend-2Heal': { num: 0, ability: [0, 0, 10, 0, 0, 30, 0, 10], level: 7, code: "D2H", action: double_heal },

    /* 外矿 */
    'out-scout': { num: 0, ability: [0, 0, 1, 0, 0, 0, 0, 0], level: 11, work: outScout },
    'out-claim': { num: 0, ability: [0, 0, 5, 0, 0, 0, 5, 0], level: 11, adaption: true, work: outClaim },
    'out-harvest': { num: 0, ability: [4, 2, 4, 0, 0, 0, 0, 0], level: 12, adaption: true, work: outHarvest },
    'out-miner': { num: 0, ability: [4, 2, 4, 0, 0, 0, 0, 0], level: 12, adaption: true, work: outHarvest },
    'out-car': { num: 0, ability: [1, 5, 6, 0, 0, 0, 0, 0], level: 13, adaption: true, work: outCarry},
    'out-carry': { num: 0, ability: [0, 5, 5, 0, 0, 0, 0, 0], level: 13, adaption: true, work: outCarry},
    'out-build': { num: 0, ability: [1, 5, 6, 0, 0, 0, 0, 0], level: 13, adaption: true, work: outBuild },
    'out-defend': { num: 0, ability: [0, 0, 5, 5, 0, 5, 0, 0], level: 8, adaption: true, work: outDefend},
    'out-invader': { num: 0, ability: [0, 0, 5, 5, 0, 6, 0, 0], level: 10, adaption: true, work: outInvader},
    'out-attack': { num: 0, ability: [0, 0, 25, 19, 0, 6, 0, 0], level: 9, work: outAttack},

    /* 沉积物 */
    'deposit-harvest': { num: 0, ability: [20, 10, 20, 0, 0, 0, 0, 0], level: 11, adaption: true, work: deposit_harvest },
    'deposit-transport': { num: 0, ability: [0, 25, 25, 0, 0, 0, 0, 0], level: 11, adaption: true, work: deposit_transport },

    /* power */
    'power-attack': { num: 0, ability: [0, 0, 25, 20, 0, 0, 0, 5], level: 10, code: 'PA', work: power_attack },
    'power-heal': { num: 0, ability: [0, 0, 25, 0, 0, 25, 0, 0], level: 10, code: 'PH', work: power_heal },
    'power-carry': { num: 0, ability: [0, 25, 25, 0, 0, 0, 0, 0], level: 10, code: 'PC', work: power_carry },
    'power-defend': { num: 0, ability: [0, 0, 25, 0, 10, 10, 0, 5], level: 10, code: 'PD', work: power_defend },

}

export const RoleLevelData = {
    'harvester': {
        1: { bodypart: [2, 1, 1, 0, 0, 0, 0, 0], num: 2 },
        2: { bodypart: [3, 1, 1, 0, 0, 0, 0, 0], num: 2 },
        3: { bodypart: [5, 1, 3, 0, 0, 0, 0, 0], num: 2 },
        4: { bodypart: [6, 1, 3, 0, 0, 0, 0, 0], num: 2 },
        5: { bodypart: [7, 2, 4, 0, 0, 0, 0, 0], num: 2 },
        6: { bodypart: [10, 2, 3, 0, 0, 0, 0, 0], num: 2 },
        7: { bodypart: [10, 2, 3, 0, 0, 0, 0, 0], num: 2 },
        8: { bodypart: [10, 2, 5, 0, 0, 0, 0, 0], num: 2, upbodypart: [20, 4, 10, 0, 0, 0, 0, 0] },
    },
    'carrier': {
        1: { bodypart: [0, 2, 2, 0, 0, 0, 0, 0], num: 2 },
        2: { bodypart: [0, 3, 3, 0, 0, 0, 0, 0], num: 2 },
        3: { bodypart: [0, 6, 6, 0, 0, 0, 0, 0], num: 2 },
        4: { bodypart: [0, 10, 10, 0, 0, 0, 0, 0], num: 2 },
        5: { bodypart: [0, 10, 10, 0, 0, 0, 0, 0], num: 2 },
        6: { bodypart: [0, 15, 15, 0, 0, 0, 0, 0], num: 1 },
        7: { bodypart: [0, 20, 20, 0, 0, 0, 0, 0], num: 0 },
        8: { bodypart: [0, 10, 10, 0, 0, 0, 0, 0], num: 0 },
    },
    'transport': {
        1: { bodypart: [0, 1, 1, 0, 0, 0, 0, 0], num: 0 },
        2: { bodypart: [0, 1, 1, 0, 0, 0, 0, 0], num: 0 },
        3: { bodypart: [0, 2, 2, 0, 0, 0, 0, 0], num: 0 },
        4: { bodypart: [0, 5, 5, 0, 0, 0, 0, 0], num: 1 },
        5: { bodypart: [0, 10, 10, 0, 0, 0, 0, 0], num: 1 },
        6: { bodypart: [0, 15, 15, 0, 0, 0, 0, 0], num: 1 },
        7: { bodypart: [0, 24, 12, 0, 0, 0, 0, 0], num: 2 },
        8: { bodypart: [0, 30, 15, 0, 0, 0, 0, 0], num: 1 },
    },
    'manage': {
        1: { bodypart: [0, 1, 1, 0, 0, 0, 0, 0], num: 0 },
        2: { bodypart: [0, 1, 1, 0, 0, 0, 0, 0], num: 0 },
        3: { bodypart: [0, 2, 2, 0, 0, 0, 0, 0], num: 0 },
        4: { bodypart: [0, 2, 2, 0, 0, 0, 0, 0], num: 0 },
        5: { bodypart: [0, 10, 5, 0, 0, 0, 0, 0], num: 1 },
        6: { bodypart: [0, 20, 5, 0, 0, 0, 0, 0], num: 1 },
        7: { bodypart: [0, 25, 5, 0, 0, 0, 0, 0], num: 1 },
        8: { bodypart: [0, 30, 5, 0, 0, 0, 0, 0], num: 1 },
    },
    'upgrader': {
        1: { bodypart: [1, 1, 2, 0, 0, 0, 0, 0], num: 3 },
        2: { bodypart: [2, 2, 4, 0, 0, 0, 0, 0], num: 3 },
        3: { bodypart: [3, 3, 6, 0, 0, 0, 0, 0], num: 3 },
        4: { bodypart: [4, 4, 8, 0, 0, 0, 0, 0], num: 2 },
        5: { bodypart: [6, 6, 6, 0, 0, 0, 0, 0], num: 2 },
        6: { bodypart: [7, 7, 7, 0, 0, 0, 0, 0], num: 1 },
        7: { bodypart: [10, 2, 5, 0, 0, 0, 0, 0], num: 1 },
        8: { bodypart: [15, 4, 8, 0, 0, 0, 0, 0], num: 1 },
    },
    'builder': {
        1: { bodypart: [1, 1, 2, 0, 0, 0, 0, 0], num: 0 },
        2: { bodypart: [2, 2, 4, 0, 0, 0, 0, 0], num: 0 },
        3: { bodypart: [3, 3, 6, 0, 0, 0, 0, 0], num: 0 },
        4: { bodypart: [4, 4, 8, 0, 0, 0, 0, 0], num: 0 },
        5: { bodypart: [4, 10, 7, 0, 0, 0, 0, 0], num: 0 },
        6: { bodypart: [10, 10, 10, 0, 0, 0, 0, 0], num: 0 },
        7: { bodypart: [10, 20, 15, 0, 0, 0, 0, 0], num: 0 },
        8: { bodypart: [15, 15, 15, 0, 0, 0, 0, 0], num: 0 },
    },
    
    'repair': {
        1: { bodypart: [1, 1, 2, 0, 0, 0, 0, 0], num: 0 },
        2: { bodypart: [1, 1, 2, 0, 0, 0, 0, 0], num: 0 },
        3: { bodypart: [2, 2, 4, 0, 0, 0, 0, 0], num: 0 },
        4: { bodypart: [2, 2, 4, 0, 0, 0, 0, 0], num: 0 },
        5: { bodypart: [5, 5, 5, 0, 0, 0, 0, 0], num: 0 },
        6: { bodypart: [8, 8, 8, 0, 0, 0, 0, 0], num: 0 },
        7: { bodypart: [10, 10, 10, 0, 0, 0, 0, 0], num: 0 },
        8: { bodypart: [20, 10, 15, 0, 0, 0, 0, 0], num: 0 },
    },
    'miner': {
        1: { bodypart: [2, 1, 1, 0, 0, 0, 0, 0], num: 0 },
        2: { bodypart: [3, 1, 1, 0, 0, 0, 0, 0], num: 0 },
        3: { bodypart: [5, 1, 3, 0, 0, 0, 0, 0], num: 0 },
        4: { bodypart: [6, 1, 3, 0, 0, 0, 0, 0], num: 0 },
        5: { bodypart: [7, 2, 4, 0, 0, 0, 0, 0], num: 0 },
        6: { bodypart: [10, 2, 3, 0, 0, 0, 0, 0], num: 0 },
        7: { bodypart: [10, 2, 3, 0, 0, 0, 0, 0], num: 0 },
        8: { bodypart: [10, 2, 5, 0, 0, 0, 0, 0], num: 0, upbodypart: [20, 4, 10, 0, 0, 0, 0, 0] },
    },
    'logistics': {
        1: { bodypart: [0, 1, 1, 0, 0, 0, 0, 0], num: 0 },
        2: { bodypart: [0, 2, 2, 0, 0, 0, 0, 0], num: 0 },
        3: { bodypart: [0, 3, 3, 0, 0, 0, 0, 0], num: 0 },
        4: { bodypart: [0, 5, 5, 0, 0, 0, 0, 0], num: 0 },
        5: { bodypart: [0, 10, 10, 0, 0, 0, 0, 0], num: 0 },
        6: { bodypart: [0, 15, 15, 0, 0, 0, 0, 0], num: 0 },
        7: { bodypart: [0, 20, 20, 0, 0, 0, 0, 0], num: 0 },
        8: { bodypart: [0, 25, 25, 0, 0, 0, 0, 0], num: 0 },
    },
    "claimer": {
        1: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        2: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        3: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        4: { bodypart: [0, 0, 1, 0, 0, 0, 1, 0], num: 0 },
        5: { bodypart: [0, 0, 1, 0, 0, 0, 1, 0], num: 0 },
        6: { bodypart: [0, 0, 2, 0, 0, 0, 2, 0], num: 0 },
        7: { bodypart: [0, 0, 3, 0, 0, 0, 3, 0], num: 0 },
        8: { bodypart: [0, 0, 4, 0, 0, 0, 4, 0], num: 0 },
    },
    "out-claim": {
        1: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        2: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        3: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        4: { bodypart: [0, 0, 1, 0, 0, 0, 1, 0], num: 0 },
        5: { bodypart: [0, 0, 2, 0, 0, 0, 2, 0], num: 0 },
        6: { bodypart: [0, 0, 2, 0, 0, 0, 2, 0], num: 0 },
        7: { bodypart: [0, 0, 3, 0, 0, 0, 3, 0], num: 0 },
        8: { bodypart: [0, 0, 5, 0, 0, 0, 5, 0], num: 0 },
    },
    "out-harvest": {
        1: { bodypart: [1, 1, 1, 0, 0, 0, 0, 0], num: 0 },
        2: { bodypart: [1, 1, 1, 0, 0, 0, 0, 0], num: 0 },
        3: { bodypart: [1, 1, 1, 0, 0, 0, 0, 0], num: 0 },
        4: { bodypart: [2, 1, 1, 0, 0, 0, 0, 0], num: 0 },
        5: { bodypart: [5, 1, 3, 0, 0, 0, 0, 0], num: 0 },
        6: { bodypart: [6, 2, 3, 0, 0, 0, 0, 0], num: 0 },
        7: { bodypart: [8, 2, 4, 0, 0, 0, 0, 0], num: 0 },
        8: { bodypart: [10, 2, 6, 0, 0, 0, 0, 0], num: 0 },
    },
    "out-miner": {
        1: { bodypart: [1, 1, 1, 0, 0, 0, 0, 0], num: 0 },
        2: { bodypart: [1, 1, 1, 0, 0, 0, 0, 0], num: 0 },
        3: { bodypart: [1, 1, 1, 0, 0, 0, 0, 0], num: 0 },
        4: { bodypart: [2, 1, 1, 0, 0, 0, 0, 0], num: 0 },
        5: { bodypart: [5, 1, 3, 0, 0, 0, 0, 0], num: 0 },
        6: { bodypart: [6, 2, 3, 0, 0, 0, 0, 0], num: 0 },
        7: { bodypart: [8, 2, 4, 0, 0, 0, 0, 0], num: 0 },
        8: { bodypart: [10, 2, 6, 0, 0, 0, 0, 0], num: 0 },
    },
    'out-build': {
        1: { bodypart: [1, 1, 2, 0, 0, 0, 0, 0], num: 1 },
        2: { bodypart: [2, 2, 4, 0, 0, 0, 0, 0], num: 1 },
        3: { bodypart: [3, 3, 6, 0, 0, 0, 0, 0], num: 1 },
        4: { bodypart: [4, 4, 8, 0, 0, 0, 0, 0], num: 1 },
        5: { bodypart: [4, 10, 7, 0, 0, 0, 0, 0], num: 1 },
        6: { bodypart: [5, 15, 20, 0, 0, 0, 0, 0], num: 1 },
        7: { bodypart: [10, 20, 15, 0, 0, 0, 0, 0], num: 1 },
        8: { bodypart: [15, 15, 15, 0, 0, 0, 0, 0], num: 1 },
    },
    "out-car": {
        1: { bodypart: [1, 1, 2, 0, 0, 0, 0, 0], num: 0 },
        2: { bodypart: [1, 2, 2, 0, 0, 0, 0, 0], num: 0 },
        3: { bodypart: [1, 2, 3, 0, 0, 0, 0, 0], num: 0 },
        4: { bodypart: [1, 7, 4, 0, 0, 0, 0, 0], num: 0 },
        5: { bodypart: [1, 21, 11, 0, 0, 0, 0, 0], num: 0 },
        6: { bodypart: [1, 21, 11, 0, 0, 0, 0, 0], num: 0 },
        7: { bodypart: [2, 26, 14, 0, 0, 0, 0, 0], num: 0 },
        8: { bodypart: [2, 30, 16, 0, 0, 0, 0, 0], num: 0 },
    },
    "out-carry": {
        1: { bodypart: [0, 2, 2, 0, 0, 0, 0, 0], num: 0 },
        2: { bodypart: [0, 3, 3, 0, 0, 0, 0, 0], num: 0 },
        3: { bodypart: [0, 4, 4, 0, 0, 0, 0, 0], num: 0 },
        4: { bodypart: [0, 8, 4, 0, 0, 0, 0, 0], num: 0 },
        5: { bodypart: [0, 20, 10, 0, 0, 0, 0, 0], num: 0 },
        6: { bodypart: [0, 22, 11, 0, 0, 0, 0, 0], num: 0 },
        7: { bodypart: [0, 26, 13, 0, 0, 0, 0, 0], num: 0 },
        8: { bodypart: [0, 30, 15, 0, 0, 0, 0, 0], num: 0 },
    },
    "out-defend": {
        1: { bodypart: [0, 0, 1, 0, 0, 1, 0, 0], num: 0 },
        2: { bodypart: [0, 0, 1, 0, 0, 1, 0, 0], num: 0 },
        3: { bodypart: [0, 0, 1, 0, 0, 1, 0, 0], num: 0 },
        4: { bodypart: [0, 0, 3, 0, 2, 2, 0, 0], num: 0 },
        5: { bodypart: [0, 0, 6, 0, 3, 3, 0, 0], num: 0 },
        6: { bodypart: [0, 0, 8, 0, 4, 4, 0, 0], num: 0 },
        7: { bodypart: [0, 0, 16, 0, 8, 8, 0, 0], num: 0 },
        8: { bodypart: [0, 0, 25, 5, 10, 10, 0, 0], num: 0 },
    },
    "out-invader": {
        1: { bodypart: [0, 0, 1, 0, 0, 1, 0, 0], num: 0 },
        2: { bodypart: [0, 0, 1, 0, 0, 1, 0, 0], num: 0 },
        3: { bodypart: [0, 0, 1, 0, 0, 1, 0, 0], num: 0 },
        4: { bodypart: [0, 0, 3, 3, 0, 0, 0, 0], num: 0 },
        5: { bodypart: [0, 0, 6, 6, 0, 0, 0, 0], num: 0 },
        6: { bodypart: [0, 0, 8, 8, 0, 0, 0, 0], num: 0 },
        7: { bodypart: [0, 0, 15, 15, 0, 0, 0, 0], num: 0 },
        8: { bodypart: [0, 0, 15, 15, 0, 0, 0, 0], num: 0 },
    },
    'speedup-upgrad': {
        1: { bodypart: [1, 1, 2, 0, 0, 0, 0, 0], num: 0 },
        2: { bodypart: [2, 2, 4, 0, 0, 0, 0, 0], num: 0 },
        3: { bodypart: [3, 3, 6, 0, 0, 0, 0, 0], num: 0 },
        4: { bodypart: [4, 4, 8, 0, 0, 0, 0, 0], num: 0 },
        5: { bodypart: [10, 5, 5, 0, 0, 0, 0, 0], num: 0 },
        6: { bodypart: [16, 2, 10, 0, 0, 0, 0, 0], num: 0 },
        7: { bodypart: [35, 5, 10, 0, 0, 0, 0, 0], num: 0 },
        8: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 }
    },
    'deposit-harvest': {
        1: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        2: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        3: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        4: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        5: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        6: { bodypart: [10, 10, 10, 0, 0, 0, 0, 0], num: 0 },
        7: { bodypart: [20, 10, 20, 0, 0, 0, 0, 0], num: 0 },
        8: { bodypart: [20, 10, 20, 0, 0, 0, 0, 0], num: 0 },
    },
    'deposit-transport': {
        1: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        2: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        3: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        4: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        5: { bodypart: [0, 0, 0, 0, 0, 0, 0, 0], num: 0 },
        6: { bodypart: [0, 20, 20, 0, 0, 0, 0, 0], num: 0 },
        7: { bodypart: [0, 25, 25, 0, 0, 0, 0, 0], num: 0 },
        8: { bodypart: [0, 25, 25, 0, 0, 0, 0, 0], num: 0 },
    }
}
