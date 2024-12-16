
// 导入其他角色函数
import harvester from './mainRole/harvester';
import carrier from './mainRole/carrier';
import transport from './mainRole/transport';
import manage from './mainRole/manage';
import upgrader from './mainRole/upgrader';
import builder from './mainRole/builder';
import repair from './mainRole/repair';
import miner from './mainRole/miner';

import logistic from './logistic';
import harvest_carry from './harvest_carry';
import SpeedUpgrader from './spup';
import SpeedRepair from './spre'
import claimer from './claimRole/claimer';
import lclaimer from './claimRole/lclaimer';
import aclaimer from './claimRole/aclaimer';
import dismantle from './dismantle';
import bigCarry from './bigCarry';
import cleaner from './cleaner';

import double_attack from './doubleSquadRole/double_attack';
import double_dismantle from './doubleSquadRole/double_dismantle';
import double_heal from './doubleSquadRole/double_heal';
import double_defender from './doubleSquadRole/double_defender';

import scout from './scout';
import outHarvest from './outCollect/outHarvest';
import outCarry from './outCollect/outCarry';
import outBuild from './outCollect/outBuild';
import outClaim from './outCollect/outClaim';
import outDefend from './outCollect/outDefend';
import outInvader from './outCollect/outInvader';
import outAttack from './outCollect/outAttack';
import outMiner from './outCollect/outMiner';

import power_attack from './powerCollect/power-attack';
import power_heal from './powerCollect/power-heal';
import power_carry from './powerCollect/power-carry';
import power_ranged from './powerCollect/power-ranged';

import deposit_harvest from './depositCollect/deposit-harvest';
import deposit_transfer from './depositCollect/deposit-transfer';
import deposit_ranged from './depositCollect/deposit-ranged';
import deposit_attack from './depositCollect/deposit-attack';

import one_tough from './oneBody/one_tough';
import one_ranged from './oneBody/one_ranged';

import defend_attack from './defend/defend-attack';
import defend_range from './defend/defend-range';




export {harvester, carrier, transport, manage, upgrader, builder, repair, miner}
export {claimer, lclaimer, aclaimer};
export {logistic, harvest_carry, SpeedUpgrader, SpeedRepair, dismantle, bigCarry, cleaner};
export {one_tough, one_ranged};
export {double_attack, double_dismantle, double_heal, double_defender};
export {scout, outHarvest, outCarry, outBuild, outClaim, outDefend, outInvader, outAttack, outMiner};
export {power_attack, power_heal, power_carry, power_ranged};
export {deposit_harvest, deposit_transfer,deposit_ranged,deposit_attack};
export {defend_attack,defend_range};
