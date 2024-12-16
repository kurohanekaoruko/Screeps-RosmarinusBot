import { createApp } from '@/framework/createApp';
import { roomRunner, creepRunner, powerRunner } from '@/runner';
import { PrototypeExtension } from '@/prototype';

import { GlobalInit } from '@/modules/GlobalInit';
import { MemoryInit } from '@/modules/MemoryInit';
import { ClearModule, GeneratePixel, Statistics } from '@/function';

import { DoubleSquad } from '@/modules/actions/DoubleSquad';
import { ClaimModule } from '@/modules/actions/ClaimModule';

import { ResourceManage } from '@/modules/ResourceManage';

import '@/modules/betterMove';    // 超级移动优化
import '@/modules/structureCache';  // 极致建筑缓存
import '@/modules/helper_roomResource';    // 资源统计


const app = createApp();

app.on(GlobalInit);     // 全局变量模块

app.on(MemoryInit);     // 初始化内存

app.set('room', roomRunner);    // 房间运行

app.set('creep', creepRunner);    // creep行动

app.set('powerCreep', powerRunner);  // powerCreep行动

app.mount(PrototypeExtension);    // 原型挂载

app.on(ResourceManage); // 资源调度管理

app.on(ClaimModule);    // 占领模块

app.on(DoubleSquad);    // 双人小队

app.on(ClearModule);    // 过期数据清理

app.on(GeneratePixel);  // 搓像素

app.on(Statistics);     // 统计


export const loop = app.run;

// // 性能开销分析
// global.CPUprint = require('调用栈分析器').print;
// export const loop = require('调用栈分析器').warpLoop(app.run);


// 性能开销分析
// import profiler from './function/screeps-profiler';
// profiler.enable();
// export const loop = function() {
//     profiler.wrap(app.run);
// }
