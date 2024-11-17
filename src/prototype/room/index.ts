import { assignPrototype } from "../base"
import BaseFunction from "./baseFunction"
import RoomRun from "./run"
import CreepSpawn from "./creepSpawn"
import StructureWork from "./structureWork"

import AutoMarket from "./auto/autoMarket"
import AutoLayout from "./auto/autoLayout"


import Mission from "./mission"
import MissionPools from "./mission/MissionPools"
import MissionAdd from "./mission/MissionAdd"
import MissionGet from "./mission/MissionGet"


const plugins = [
    BaseFunction,   // 基础函数
    CreepSpawn,     // 处理Creep的孵化
    StructureWork,  // 建筑物工作
    
    AutoMarket,     // 自动市场交易
    AutoLayout,     // 自动布局

    MissionPools,   // 任务池
    MissionAdd,     // 添加任务
    MissionGet,     // 获取任务
    Mission,        // 任务模块

    RoomRun,        // 房间运行
]

export default () => plugins.forEach(plugin => assignPrototype(Room, plugin))


