import { BaseFlag } from './flags/BaseFlag';


/**
 * 使用旗帜触发的功能
 */
export const FlagsModule = {
    tickEnd: function() {
        for(const flagName in Game.flags) {
            if(BaseFlag(flagName)) continue;    // 基础功能
        }
    },
}


