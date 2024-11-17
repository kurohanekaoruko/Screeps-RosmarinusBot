export default class MoveFunction extends Creep {
    moveToRoom(roomName: string, options = { visualizePathStyle: { stroke: '#aa00ff' } }) {
        if (this.memory.lastTargetPos?.roomName === roomName) {
            const lastTargetPos = this.memory.lastTargetPos;
            return this.moveTo(new RoomPosition(lastTargetPos.x, lastTargetPos.y, roomName), options);
        }
        if(Memory.rooms[roomName]?.centralPos){
            const centralPos = Memory.rooms[roomName].centralPos;
            return this.moveTo(new RoomPosition(centralPos.x, centralPos.y, roomName), options);
        }

        const centerX = 25;
        const centerY = 25;
        const range = 10;
        const randomX = Math.floor(Math.random() * (range * 2 + 1)) + (centerX - range);
        const randomY = Math.floor(Math.random() * (range * 2 + 1)) + (centerY - range);
        this.memory.lastTargetPos = { x: randomX, y: randomY, roomName };

        return this.moveTo(new RoomPosition(randomX, randomY, roomName), options);
    }
    /**
     * 移动到主房间
     */
    moveHomeRoom(): boolean {
        if(!this.memory.home) { return true; }
        if(this.room.name === this.memory.home) { return true; }
        this.moveToRoom(this.memory.home, { visualizePathStyle: { stroke: '#ff0000' } });
        return false;
    }
    /**
     * 二人小队移动
     */
    double_move(target: RoomPosition, color: string='#ffffff'): void {
        const bindCreep = Game.getObjectById(this.memory.bind) as Creep;
        if(!bindCreep) return;
        if (this.pos.isNear(bindCreep.pos)) {
            // 疲劳时不移动
            if(this.fatigue + bindCreep.fatigue > 0) return;
            // 同时移动
            const result = this.moveTo(target, { visualizePathStyle: { stroke: color } });
            if(result ===  OK) bindCreep.moveTo(this);
        }
        // 如果距离拉远了，那么等待
        else {
            if(this.pos.x === 0 || this.pos.x === 49 || this.pos.y === 0 || this.pos.y === 49) {
                this.moveTo(target, { visualizePathStyle: { stroke: color } });    // 位于房间边缘时不等
            }
            this.pull(bindCreep);
            bindCreep.moveTo(this);
        }
    }

    /**
     * 向指定结构转移资源
     */
    transferOrMoveTo(target: AnyCreep | Structure, resoureType: ResourceConstant, amount?: number): boolean {
        if (!target) return false; // 如果没有目标，返回 false
        if (this.pos.isNearTo(target)) {
            this.transfer(target, resoureType, amount);
        } else {
            this.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return true;
    };
    /**
     * 从指定结构中提取资源
     */
    withdrawOrMoveTo(target: Structure | Tombstone | Ruin, resoureType: ResourceConstant, amount?: number): boolean {
        if (!target) return false; // 如果没有目标，返回 false
        if (this.pos.isNearTo(target)) {
            this.withdraw(target, resoureType, amount);
        } else {
            this.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
        return true;
    };
    /**
     * 拾取掉落资源
     */
    pickupOrMoveTo(target: Resource): boolean {
        if (!target) return false; // 如果没有目标，返回 false
        if (this.pos.isNearTo(target)) {
            this.pickup(target);
        } else {
            this.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
        return true;
    }
    repairOrMoveTo(target: Structure): boolean {
        if (!target) return false; // 如果没有目标，返回 false
        if (this.pos.inRangeTo(target, 3)) {
            this.repair(target);
        } else {
            this.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
        return true;
    }
    buildOrMoveTo(target: ConstructionSite) {
        if (!target) return false; // 如果没有目标，返回 false
        if (this.pos.inRangeTo(target, 3)) {
            this.build(target);
        } else {
            this.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
        return true;
    }
}