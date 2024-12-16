// 坐标压缩函数
export function compress(x: number, y: number): number {
    return (x << 6) | y;
}

// 坐标解压函数
export function decompress(value: number) {
    const x = value >> 6;      // 高 6 位是 x
    const y = value & 0b111111; // 低 6 位是 y
    return [x, y];
}

// 批量压缩坐标
export function compressBatch(coords: number[][]) {
    return coords.map(([x, y]) => compress(x, y));
}

// 批量解压坐标
export function decompressBatch(values: number[]) {
    return values.map(decompress);
}

// 获取相邻点的方向
export function getDirection(fromPos, toPos) {
    if (fromPos.roomName == toPos.roomName) {
        if (toPos.x > fromPos.x) {    // 下一步在右边
            if (toPos.y > fromPos.y) {    // 下一步在下面
                return BOTTOM_RIGHT;
            } else if (toPos.y == fromPos.y) { // 下一步在正右
                return RIGHT;
            }
            return TOP_RIGHT;   // 下一步在上面
        } else if (toPos.x == fromPos.x) { // 横向相等
            if (toPos.y > fromPos.y) {    // 下一步在下面
                return BOTTOM;
            } else if (toPos.y < fromPos.y) {
                return TOP;
            }
        } else {  // 下一步在左边
            if (toPos.y > fromPos.y) {    // 下一步在下面
                return BOTTOM_LEFT;
            } else if (toPos.y == fromPos.y) {
                return LEFT;
            }
            return TOP_LEFT;
        }
    } else {  // 房间边界点
        if (fromPos.x == 0 || fromPos.x == 49) {  // 左右相邻的房间，只需上下移动（左右边界会自动弹过去）
            if (toPos.y > fromPos.y) {   // 下一步在下面
                return BOTTOM;
            } else if (toPos.y < fromPos.y) { // 下一步在上
                return TOP
            } // else 正左正右
            return fromPos.x ? RIGHT : LEFT;
        } else if (fromPos.y == 0 || fromPos.y == 49) {    // 上下相邻的房间，只需左右移动（上下边界会自动弹过去）
            if (toPos.x > fromPos.x) {    // 下一步在右边
                return RIGHT;
            } else if (toPos.x < fromPos.x) {
                return LEFT;
            }// else 正上正下
            return fromPos.y ? BOTTOM : TOP;
        }
    }
}