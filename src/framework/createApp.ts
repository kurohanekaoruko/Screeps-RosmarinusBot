import { errorMapper } from './errorMapper.js'
import { BaseConfig } from '@/constant/config.js'

/**
 * 基本框架，用于管理游戏循环，挂载各种模块
 */
export const createApp = () => {
    const name = BaseConfig.BOT_NAME;
    const shards = BaseConfig.shards;
    const events = {init: [], tickStart: [], tick: [], tickEnd: []}
    
    let runRoom = () => {};
    let runCreep = () => {};
    let runPowerCreep = () => {};

    const set = (type: any, runner: any) => {
        const runnerWithErrorMapper = (entity: any) => errorMapper(runner, entity);
        switch (type) {
            case 'room':
                runRoom = () => Object.values(Game.rooms).forEach(runnerWithErrorMapper);
                break;
            case 'creep':
                runCreep = () => Object.values(Game.creeps).forEach(runnerWithErrorMapper);
                break;
            case 'powerCreep':
                runPowerCreep = () => Object.values(Game.powerCreeps).forEach(runnerWithErrorMapper);
                break;
        }
    }

    const mount = (func: () => void) => {
        func();
        if (Game.shard.name != 'sim') console.log(`原型拓展已挂载。`)
    }

    const on = (callbacks: any) => {
        Object.keys(callbacks).forEach(type => {
            events[type].push(callbacks[type])
        })
    };

    const init = () => {
        if (!shards.includes(Game.shard.name)) return;
        events.init.forEach(callback => errorMapper(callback))
        const initEntities = (entity: any) => {
            Object.values(entity).forEach((item: any) => item.init()); 
        };
        if (Room.prototype.init) initEntities(Game.rooms);
        if (Creep.prototype.init) initEntities(Game.creeps);
        if (PowerCreep.prototype.init) initEntities(Game.powerCreeps);
        if (Game.shard.name != 'sim') console.log(`全局初始化完成。`)
    };

    const tickStart = () => events.tickStart.forEach(callback => errorMapper(callback));

    const tick = () => {
        runRoom();
        runCreep();
        runPowerCreep();
        events.tick.forEach(callback => errorMapper(callback));
    };

    const tickEnd = () => events.tickEnd.forEach(callback => errorMapper(callback));

    const run = () => {
        if (!shards.includes(Game.shard.name)) return;
        tickStart();
        tick();
        tickEnd();
    };

    return { name, set, mount, on, init, run }
};
