
// 导入其他角色函数
import harvester from './mainRole/harvester';
import carrier from './mainRole/carrier';
import transport from './mainRole/transport';
import manage from './mainRole/manage';
import upgrader from './mainRole/upgrader';
import builder from './mainRole/builder';
import repair from './mainRole/repair';
import miner from './mainRole/miner';

import logistics from './logistics';
import harvest_carry from './harvest_carry';
import SpeedUpgrader from './spup';
import claimer from './claimer';
import lclaimer from './lclaimer';

import double_attack from './doubleSquadRole/double_attack';
import double_dismantle from './doubleSquadRole/double_dismantle';
import double_carry from './doubleSquadRole/double_carry';
import double_heal from './doubleSquadRole/double_heal';
import double_tough from './doubleSquadRole/double_tough';
import double_defender from './doubleSquadRole/double_defender';

import outScout from './outCollect/outScout';
import outHarvest from './outCollect/outHarvest';
import outCarry from './outCollect/outCarry';
import outBuild from './outCollect/outBuild';
import outClaim from './outCollect/outClaim';
import outDefend from './outCollect/outDefend';
import outInvader from './outCollect/outInvader';
import outAttack from './outCollect/outAttack';

import power_attack from './powerCollect/power-attack';
import power_heal from './powerCollect/power-heal';
import power_carry from './powerCollect/power-carry';
import power_defend from './powerCollect/power-defend';

import deposit_harvest from './depositCollect/deposit-harvest';
import deposit_transport from './depositCollect/deposit-transport';

import one_tough from './oneBody/one_tough';




export {harvester, carrier, transport, manage, upgrader, builder, repair, miner, logistics, 
        harvest_carry, SpeedUpgrader, claimer, lclaimer};
export { one_tough };
export {double_attack, double_dismantle, double_carry, double_heal, double_tough, double_defender};
export {outScout, outHarvest, outCarry, outBuild, outClaim, outDefend, outInvader, outAttack};
export {power_attack, power_heal, power_carry, power_defend};
export {deposit_harvest, deposit_transport};