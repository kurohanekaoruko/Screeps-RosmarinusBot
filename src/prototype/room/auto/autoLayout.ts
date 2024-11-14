import rosLayout from "@/layout/static/ros"

export default class AutoLayout extends Room {
    // 自动建筑
    autoLayout() {
        if(Game.time % 100) return;
        const memory = Memory[global.BOT_NAME]['rooms'][this.name];
        if(!memory) return;
        if(!memory.autolayout) return;
        const center = Memory[global.BOT_NAME]['rooms'][this.name].center;
        if(memory.layout == 'ros') {
            rosLayout(this, center, true)
        }
    }
}

