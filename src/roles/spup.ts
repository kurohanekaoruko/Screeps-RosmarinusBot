import { compress, decompress} from '@/utils';

const upgrade = function (creep: Creep) {
    if (!creep.pos.inRangeTo(creep.room.controller, 3)) {
        creep.moveTo(creep.room.controller.pos, {
            visualizePathStyle: { stroke: '#ffffff' },
            range: 3,
            maxRooms: 1,
        });
    }
    if (creep.pos.inRangeTo(creep.room.controller, 3)) {
        creep.upgradeController(creep.room.controller)
        const botMem = global.BotMem('rooms', creep.room.name);
        const sign = botMem.sign ?? '';
        if(Game.time % 10 && creep.room.controller && (creep.room.controller.sign?.text ?? '') != sign) {
            if (creep.pos.inRangeTo(creep.room.controller, 1)) {
                creep.signController(creep.room.controller, sign);
            }
        }
    }
    const link = creep.room.link.find(l => l.pos.inRangeTo(creep.room.controller, 2))
    if(creep.store[RESOURCE_ENERGY] < 50) {
        const target = [link, creep.room.storage, creep.room.terminal]
            .find(l => l && l.store[RESOURCE_ENERGY] > 0 && creep.pos.inRangeTo(l, 1));
        if(target) {
            creep.withdraw(target, RESOURCE_ENERGY);
        }
    }

    if (Game.time % 50 == 0 &&
        !creep.pos.inRangeTo(creep.room.controller, 1) &&
        creep.pos.inRangeTo(creep.room.controller, 3)){
        nearController(creep);
    }
    return;
}

const nearController = function(creep: Creep) {
    const controller = creep.room.controller;
    const terminal = creep.room.terminal;
    const storage = creep.room.storage;
    if (!terminal && !storage) return;
    const terrain = new Room.Terrain(creep.room.name);
    const posT = terminal?.pos;
    const posS = storage?.pos;
    const posC = creep.pos;
    
    if (!global.spup_terminal_noCreep_area) global.spup_terminal_noCreep_area = {};
    if (!global.spup_terminal_noCreep_area[creep.room.name] ||
        global.spup_terminal_noCreep_area[creep.room.name].time != Game.time
    ) {
        let posTs = [], posSs = [];
        if (posT) posTs = [
            [posT.x - 1, posT.y],[posT.x + 1, posT.y],[posT.x, posT.y - 1],[posT.x, posT.y + 1],
            [posT.x - 1, posT.y - 1],[posT.x - 1, posT.y + 1],[posT.x + 1, posT.y - 1],[posT.x + 1, posT.y + 1],
        ]
        if (posS) posSs = [
            [posS.x - 1, posS.y],[posS.x + 1, posS.y],[posS.x, posS.y - 1],[posS.x, posS.y + 1],
            [posS.x - 1, posS.y - 1],[posS.x - 1, posS.y + 1],[posS.x + 1, posS.y - 1],[posS.x + 1, posS.y + 1],
        ]
        const noCreep = [...posTs, ...posSs].filter((p) => {
            return terrain.get(p[0], p[1]) !== TERRAIN_MASK_WALL &&
            (new RoomPosition(p[0], p[1], creep.room.name)).lookFor(LOOK_CREEPS).length === 0;
        }).map((p) => compress(p[0], p[1]));
        global.spup_terminal_noCreep_area[creep.room.name] = {
            time: Game.time,
            noCreep: noCreep,
        }
    }

    const noCreep = global.spup_terminal_noCreep_area[creep.room.name].noCreep;

    for (const p of noCreep) {
        const [x,y] = decompress(p);
        const pos = new RoomPosition(x, y, creep.room.name);
        if (creep.pos.isNearTo(pos) &&
            getDistance(pos, controller.pos) < getDistance(posC, controller.pos)) {
            creep.moveTo(pos);
            return;
        }
    }
}

const getDistance = function(pos1: RoomPosition, pos2: RoomPosition) {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

const SpeedUpgrader = {
    prepare: function (creep: Creep) {
        return creep.goBoost(['XGH2O', 'GH2O', 'GH']);
    },

    target: function (creep: Creep) {   // 升级控制器
        if(!creep.memory.ready) return false;
        if(!creep.moveHomeRoom()) return;
        if(creep.ticksToLive < 10 && creep.body.some(part => part.boost)) {
            if(creep.unboost()) creep.suicide();
            return false;
        }
        upgrade(creep);
        if (creep.store.getUsedCapacity() === 0) {
            creep.say('🔄');
            return true;
        } else { return false; }
    },
    
    source: function (creep: Creep) {   // 获取能量
        if(!creep.memory.ready) return false;
        if(!creep.moveHomeRoom()) return;
        if(creep.ticksToLive < 10 && creep.body.some(part => part.boost)) {
            if(creep.unboost()) creep.suicide();
            return false;
        }
        const link = creep.room.link.find(l => l.pos.inRangeTo(creep.room.controller, 2)) || null;
        const container = creep.room.container.find(l => l.pos.inRangeTo(creep.room.controller, 2)) ?? null;
        const terminal = [creep.room.terminal].find(l => l && l.pos.inRangeTo(creep.room.controller, 3)) ?? null;
        const storage = [creep.room.storage].find(l => l && l.pos.inRangeTo(creep.room.controller, 3)) ?? null;
        if (terminal || storage) {
            const target = [terminal, storage].find(t => {
                return t && t.store[RESOURCE_ENERGY] > 0 &&
                    creep.room.lookForAtArea(LOOK_CREEPS, t.pos.y - 1, t.pos.x - 1, t.pos.y + 1, t.pos.x + 1, true).length < 8;
            }) ?? null;
            if (target) {
                creep.withdrawOrMoveTo(target, RESOURCE_ENERGY);
            } else {
                creep.withdrawEnergy(false);
            }
        }
        else if (link && link.store[RESOURCE_ENERGY] > 0) {
            creep.withdrawOrMoveTo(link, RESOURCE_ENERGY);
        }
        else if(container && container.store[RESOURCE_ENERGY] > 0) {
            creep.withdrawOrMoveTo(container, RESOURCE_ENERGY);
        }
        else {
            creep.withdrawEnergy(false);
        }

        if (creep.store.getFreeCapacity() === 0) {
            creep.say('⚡');
            return true;
        } else { return false; }
    },
}

export default SpeedUpgrader;

