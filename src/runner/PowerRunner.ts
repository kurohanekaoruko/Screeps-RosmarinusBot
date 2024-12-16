/**
 * PowerCreep 工作模块
 */
export const powerRunner = function (pc: any) {
    if (!pc) return;
    if (!pc.ticksToLive) {
        if (Game.time % 20) return;
        const pcMem = pc.memory;
        if (pc.spawnCooldownTime > Date.now()) return;
        const powerSpawn = Game.rooms[pcMem['spawnRoom']].powerSpawn;
        if (powerSpawn) {
            const result = pc.spawn(powerSpawn);
            if (result === OK) {
                console.log(`PowerCreep ${pc.name} 在 ${pcMem['spawnRoom']} 孵化`);
            } else {
                console.log(`PowerCreep ${pc.name} 在 ${pcMem['spawnRoom']} 孵化失败: ${result}`);
            }
        }
        return;
    }


    if (pc.run) return pc.run()
}