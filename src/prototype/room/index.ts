import { assignPrototype } from "@/prototype/base"
import BaseFunction from "./function/baseFunction"
import StructureWork from "./function/structureWork"
import OutMine from "./function/outMine"
import ActiveDefend from "./function/activeDefend"
import RoomInit from "./init"

import AutoMarket from "./auto/autoMarket"
import AutoBuild from "./auto/autoBuild"
import AutoLab from "./auto/autoLab"
import AutoFactory from "./auto/autoFactory"

import Mission from "./mission"
import MissionPools from "./mission/pool/MissionPools"
import MissionAdd from "./mission/pool/MissionAdd"
import MissionGet from "./mission/pool/MissionGet"
import MissionSubmit from "./mission/pool/MissionSubmit"


const plugins = [
    BaseFunction,   // 基础函数
    StructureWork,  // 建筑物工作
    OutMine,        // 外矿采集
    
    AutoMarket,     // 自动市场交易
    AutoBuild,      // 自动建筑
    AutoLab,        // 自动Lab合成
    AutoFactory,    // 自动Factory生产
    
    MissionPools,   // 任务池
    MissionAdd,     // 添加任务
    MissionGet,     // 获取任务
    MissionSubmit,  // 提交任务
    Mission,        // 任务模块

    ActiveDefend,   // 房间防御
    RoomInit,        // 房间运行
]

export default () => plugins.forEach(plugin => assignPrototype(Room, plugin))


