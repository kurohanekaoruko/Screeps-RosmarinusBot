import {UpdateBuildRepairMission,
        UpdateWallRepairMission,
        BuildRepairMissionCheck} from './update/buildRepairMission'
import {UpdateTransportMission,
        TransportMissionCheck} from './update/transportMission'
import {UpdateManageMission} from './update/manageMission'
import {UpdateSpawnMission} from './update/spawnMission'

/**
 * 任务模块
 */
export default class Mission extends Room {    
    MissionUpdate() {
        if(Game.time % 50 === 0) UpdateBuildRepairMission(this);  // 更新建造与维修任务
        if(Game.time % 100 === 1) UpdateWallRepairMission(this);  // 更新刷墙任务
        if(Game.time % 200 === 2) BuildRepairMissionCheck(this);  // 检查建造与维修任务是否有效
        if(Game.time % 10 === 0) UpdateTransportMission(this);  // 更新运输任务
        if(Game.time % 100 === 1) TransportMissionCheck(this);  // 检查运输任务是否有效
        if(Game.time % 30 === 2) UpdateManageMission(this);  // 更新中央搬运任务
        if(Game.time % 10 === 3) UpdateSpawnMission(this);  // 更新孵化任务
    }
}