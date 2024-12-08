/**
 * 清理模块
 */
export const ClearModule = {
    tickEnd: () => {
        if(Game.time % 20 == 0) {
            // 全局 Memory 清理
            memoryClear();
        };
        if(Game.time % 100 == 0) {
            // 清除过期与已完成订单
            global.orderClear();   
        }
        
    },
}

function  memoryClear() {
    // 清理不存在的 creeps 的 memory
    for (let name in Memory.creeps) {
        if (Game.creeps[name]) continue;
        delete Memory.creeps[name];
    }
    // 清理不存在的 powerCreeps 的 memory
    for (let name in Memory.powerCreeps) {
        if (Game.powerCreeps[name]) continue;
        delete Memory.powerCreeps[name];
    }
    // 清理不存在的 flags 的 memory
    for (let name in Memory.flags) {
        if (Game.flags[name]) continue;
        delete Memory.flags[name];
    }
}
