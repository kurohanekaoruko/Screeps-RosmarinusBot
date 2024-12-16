import {getDirection} from '@/utils'

export default class MoveFunction extends Creep {
    moveToRoom(roomName: string, options = { visualizePathStyle: { stroke: '#aa00ff' } }) {
        if (this.fatigue > 0) return ERR_TIRED;
        if (this.room.name === roomName) {
            if (this.pos.x === 0) return this.move(RIGHT);
            if (this.pos.x === 49) return this.move(LEFT);
            if (this.pos.y === 0) return this.move(BOTTOM);
            if (this.pos.y === 49) return this.move(TOP);
            return OK;
        }

        options['range'] = 10;
        
        if (this.memory.lastTargetPos?.roomName === roomName) {
            const lastTargetPos = this.memory.lastTargetPos;
            return this.moveTo(new RoomPosition(lastTargetPos.x, lastTargetPos.y, roomName), options);
        }

        const centerX = 25;
        const centerY = 25;
        const range = 10;
        const randomX = Math.floor(Math.random() * (range * 2 + 1)) + (centerX - range);
        const randomY = Math.floor(Math.random() * (range * 2 + 1)) + (centerY - range);
        this.memory.lastTargetPos = { x: randomX, y: randomY, roomName };
        return this.moveTo(new RoomPosition(randomX, randomY, roomName), options);
    }
    // 移动到所属房间
    moveHomeRoom(): boolean {
        if(!this.memory.home) { return true; }
        if(this.room.name === this.memory.home) { return true; }
        this.moveToRoom(this.memory.home, { visualizePathStyle: { stroke: '#ff0000' } });
        return false;
    }
    // 双人小队移动
    doubleMove(target: RoomPosition, color='#ffffff', ignoreCreeps=null): boolean {
        const bindCreep = Game.getObjectById(this.memory.bind) as Creep;
        if(!bindCreep) return;

        const ops = { visualizePathStyle: { stroke: color }}
        if (ignoreCreeps != null) ops['ignoreCreeps'] = ignoreCreeps;

        if (this.pos.isNear(bindCreep.pos)) {
            // 疲劳时不移动
            if(this.fatigue > 0) return;
            // 同时移动
            const result = this.moveTo(target, ops);
            if(result === OK) {
                // 如果移动成功，那么绑定creep跟随
                this.pull(bindCreep);
                bindCreep.move(this);
                return true;
            }
        }
        // 如果距离拉远了，那么等他过来
        else {
            // 位于房间边缘时不等
            if(this.pos.isRoomEdge()) this.moveTo(target, ops);
            bindCreep.moveTo(this);
            return true;
        }
        return false;
    }
    // 双人小队移动到目标房间
    doubleMoveToRoom(roomName: string, color: string='#ffffff'): boolean {
        const bindcreep = Game.getObjectById(this.memory.bind) as Creep;
        if(!bindcreep) return;
        // 移动到目标房间
        if(this.room.name !== roomName) {
            this.doubleMove(new RoomPosition(25, 25, roomName), '#ff0000')
            return true;
        }
        // 躲边界
        else if(this.pos.isRoomEdge()) {
            this.move(getDirection(this.pos, new RoomPosition(25, 25, this.room.name)))
            bindcreep.moveTo(this);
            return true;
        }
        // bindcreep躲边界
        else if(this.room.name == bindcreep.room.name && bindcreep.pos.isRoomEdge()) {
            const terrain = this.room.getTerrain();
            const Pos = [
                [this.pos.x - 1, this.pos.y - 1], [this.pos.x - 1, this.pos.y], [this.pos.x - 1, this.pos.y + 1],
                [this.pos.x, this.pos.y - 1], [this.pos.x, this.pos.y + 1],
                [this.pos.x + 1, this.pos.y - 1], [this.pos.x + 1, this.pos.y], [this.pos.x + 1, this.pos.y + 1]
            ].find(pos => {
                if (pos[0] <= 0 || pos[0] >= 49 || pos[1] <= 0 || pos[1] >= 49) return false;
                if (!bindcreep.pos.isNearTo(pos[0], pos[1])) return false;
                if (terrain.get(pos[0], pos[1]) === TERRAIN_MASK_WALL) return false;
                return true;
            })
            const toPos = new RoomPosition(Pos[0], Pos[1], this.room.name)
            bindcreep.move(getDirection(bindcreep.pos, toPos));
        }
        return false;
    }
}