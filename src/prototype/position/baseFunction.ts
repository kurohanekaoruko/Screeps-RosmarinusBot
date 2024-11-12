export default class BaseFunction extends RoomPosition {
    // 切比雪夫距离
    getDistance(pos: RoomPosition): number {
        const { x: x1, y: y1, roomName: roomName1} = this;
        const { x: x2, y: y2, roomName: roomName2 } = pos;
        if (roomName1 !== roomName2) return Infinity;
        return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
    }
    // 是否位置相同
    isEqual(pos: RoomPosition): boolean {
        const { x: x1, y: y1, roomName: roomName1 } = this;
        const { x: x2, y: y2, roomName: roomName2 } = pos;
        return x1 === x2 && y1 === y2 && roomName1 === roomName2;
    }
    // 是否相邻
    isNear(pos: RoomPosition): boolean {
        const { x: x1, y: y1, roomName: roomName1} = this;
        const { x: x2, y: y2, roomName: roomName2 } = pos;
        if (roomName1 !== roomName2) return false;
        return Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1;
    }
    // 是否在指定距离内
    inRange(pos: RoomPosition, range: number): boolean {
        return this.getDistance(pos) <= range;
    }
}