/**
 * creep 工作模块，具体工作由原型拓展定义
 */
export const creepRunner = function (creep: any) {
    if (!creep || creep.spawning) return;

    if (creep.run)
        creep.run();    // 运行
    if (creep.randomSay)
        creep.randomSay();  // 随机说话
}