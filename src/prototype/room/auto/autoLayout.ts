import {rosLayout, rosBuild} from "@/layout/static/ros"

export default class AutoLayout extends Room {
    // 自动建筑
    autoLayout() {
        if(Game.time % 100) return;
        const memory = global.BotMem('rooms', this.name);
        if(!memory) return;
        if(!memory.autolayout) return;
        const center = memory.center;
        if(!center) return;

        if(memory.layout == 'ros' || memory.layout == 'ros2') {
            if (!global.BotMem('layoutMemory', this.name))
                rosLayout(this, center, memory.layout);
            rosBuild(this, center);
        }
    }
}
