export default class MoveFunction extends Creep {
    moveToRoom(roomName: string, options = { visualizePathStyle: { stroke: '#aa00ff' } }) {
        if (this.room.name === roomName) {
            if (this.pos.x === 0) return this.move(RIGHT);
            if (this.pos.x === 49) return this.move(LEFT);
            if (this.pos.y === 0) return this.move(BOTTOM);
            if (this.pos.y === 49) return this.move(TOP);
            return OK;
        }
        
        if (this.memory.lastTargetPos?.roomName === roomName) {
            const lastTargetPos = this.memory.lastTargetPos;
            return this.moveTo(new RoomPosition(lastTargetPos.x, lastTargetPos.y, roomName), options);
        }
        const center = global.BotMem('rooms', roomName, 'center');
        if(center) {
            return this.moveTo(new RoomPosition(center.x, center.y, roomName), options);
        }
        const centerX = 25;
        const centerY = 25;
        const range = 10;
        const randomX = Math.floor(Math.random() * (range * 2 + 1)) + (centerX - range);
        const randomY = Math.floor(Math.random() * (range * 2 + 1)) + (centerY - range);
        this.memory.lastTargetPos = { x: randomX, y: randomY, roomName };
        return this.moveTo(new RoomPosition(randomX, randomY, roomName), options);
    }
    // 移动到主房间
    moveHomeRoom(): boolean {
        if(!this.memory.home) { return true; }
        if(this.room.name === this.memory.home) { return true; }
        this.moveToRoom(this.memory.home, { visualizePathStyle: { stroke: '#ff0000' } });
        return false;
    }
    // 二人小队移动
    double_move(target: RoomPosition, color: string='#ffffff'): void {
        const bindCreep = Game.getObjectById(this.memory.bind) as Creep;
        if(!bindCreep) return;
        if (this.pos.isNear(bindCreep.pos)) {
            // 疲劳时不移动
            if(this.fatigue + bindCreep.fatigue > 0) return;
            // 同时移动
            const result = this.moveTo(target, { visualizePathStyle: { stroke: color } });
            if(result === OK) {
                this.pull(bindCreep);
                bindCreep.move(this);
            }
        }
        // 如果距离拉远了，那么等他过来
        else {
            if(this.pos.x === 0 || this.pos.x === 49 || this.pos.y === 0 || this.pos.y === 49) {
                this.moveTo(target, { visualizePathStyle: { stroke: color } });    // 位于房间边缘时不等
            }
            bindCreep.moveTo(this);
        }
    }
}