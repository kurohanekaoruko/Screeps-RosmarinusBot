/**
 * PowerCreep 工作模块
 */
export const powerRunner = function (pc: any) {
    if (!pc) return;
    if (!pc.ticksToLive) {
        if (Game.time % 100) return;
        const pcMem = global.BotMem('powerCreep');
        if (!pcMem[pc.name]) return;
        if (pc.spawnCooldownTime > Date.now()) return;
        const powerSpawn = Game.rooms[pcMem[pc.name]].powerSpawn;
        if (powerSpawn) pc.spawn(powerSpawn);
        return;
    }


    if (pc.run) return pc.run()
}