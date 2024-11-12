interface RoomPosition {
    // 切比雪夫距离
    getDistance(pos: RoomPosition): number;
    // 是否位置相同
    isEqual(pos: RoomPosition): boolean;
    // 是否相邻
    isNear(pos: RoomPosition): boolean;
    // 是否在指定距离内
    inRange(pos: RoomPosition, range: number): boolean;
}