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
