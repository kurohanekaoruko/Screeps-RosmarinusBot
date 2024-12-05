import {LabMap} from '@/constant/ResourceConstant'

export default {
    lab: {
        // 开启lab
        open(roomName: string) {
            const room = Game.rooms[roomName];
            if(!room || !room.my) {
                global.log(`房间 ${roomName} 不存在或未添加。`);
                return;
            }
            const BotMemStructures =  global.BotMem('structures');
            if(!BotMemStructures[roomName]) BotMemStructures[roomName] = {};
            BotMemStructures[roomName]['lab'] = true;
            global.log(`[${roomName}] 已开启lab合成。`);
            return OK;
        },
        // 关闭lab
        stop(roomName: string) {
            const room = Game.rooms[roomName];
            if(!room || !room.my) {
                global.log(`房间 ${roomName} 不存在或未添加。`);
                return;
            }
            const BotMemStructures =  global.BotMem('structures');
            if(!BotMemStructures[roomName]) BotMemStructures[roomName] = {};
            BotMemStructures[roomName]['lab'] = false;
            global.log(`[${roomName}] 已关闭lab合成。`);
            return OK;
        },
        // 设置lab合成底物
        set(roomName: string, A: string, B: string, amount: number = 0) {
            const RES = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            const room = Game.rooms[roomName];
            if(!room || !room.my) {
                global.log(`房间 ${roomName} 不存在或未拥有。`);
                return;
            }
            A = RES[A] || A; B = RES[B] || B;
            if (!REACTIONS[A] || !REACTIONS[A][B]) {
                global.log(`资源 ${RES[A] || A} 或 ${RES[B] || B} 不存在有效合成。`);
                return;
            }
            const BotMemStructures =  global.BotMem('structures');
            if(!BotMemStructures[roomName]) BotMemStructures[roomName] = {};
            if (A && B) {
                BotMemStructures[roomName]['labAtype'] = A;
                BotMemStructures[roomName]['labBtype'] = B;
                BotMemStructures[roomName]['labAmount'] = Math.max(0, amount);
                global.log(`[${roomName}] 已设置lab合成底物为 ${A} 和 ${B}。`);
            }
            const labAflag = Game.flags[`labA`] || Game.flags[`lab-A`];
            const labBflag = Game.flags[`labB`] || Game.flags[`lab-B`];
            if(labAflag && labBflag && labAflag.pos.roomName === roomName && labBflag.pos.roomName === roomName) {
                const labA = labAflag.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_LAB);
                const labB = labBflag.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_LAB);
                BotMemStructures[roomName]['labA'] = labA.id;
                BotMemStructures[roomName]['labB'] = labB.id;
                global.log(`[${roomName}] 已设置底物lab为 ${labA.id} 和 ${labB.id}。`);
                labAflag.remove();
                labBflag.remove();
            }
            BotMemStructures[roomName]['lab'] = true;
            global.log(`[${roomName}] 已开启lab合成。`);
            return OK;
        },
        setboost(roomName: string, res?: string) {
            const room = Game.rooms[roomName];
            if(!room || !room.my) {
                global.log(`房间 ${roomName} 不存在或未拥有。`);
                return;
            }
            const BotMemStructures = global.BotMem('structures');
            if(!BotMemStructures[roomName]) BotMemStructures[roomName] = {};
            if(!BotMemStructures[roomName]['boostTypes']) BotMemStructures[roomName]['boostTypes'] = {};
            for(const id of Object.keys(BotMemStructures[roomName]['boostTypes'])) {
                const lab = Game.getObjectById(id) as StructureLab;
                if(!lab) delete BotMemStructures[roomName]['boostTypes'][id];
            }
            for(const flag of Game.rooms[roomName].find(FIND_FLAGS)) {
                const labsetMatch = flag.name.match(/^labset[-#/ ](\w+)(?:[-#/ ].*)?$/);
                if(!labsetMatch) continue;
                const RES = global.BaseConfig.RESOURCE_ABBREVIATIONS;
                let resourceType = RES[labsetMatch[1]] || labsetMatch[1];
                if (!LabMap[resourceType]) resourceType = RES[res] || res;
                const lab = flag.pos.lookFor(LOOK_STRUCTURES).find(structure => structure.structureType === STRUCTURE_LAB);
                if (!lab) continue;
                if (!resourceType || !LabMap[resourceType]) {
                    delete BotMemStructures[roomName]['boostTypes'][lab.id];
                    flag.remove();
                    console.log(`在房间 ${roomName} 删除了 lab(${lab.id}) 的强化资源设置`);
                    continue;
                }
                BotMemStructures[roomName]['boostTypes'][lab.id] = resourceType;
                console.log(`在房间 ${roomName} 设置了 lab(${lab.id}) 的强化资源: ${resourceType}`);
                flag.remove();
            }
            return OK;
        },
        auto(roomName: string, res: string, amount: number=10000) {
            const room = Game.rooms[roomName];
            if(!room || !room.my) {
                global.log(`房间 ${roomName} 不存在或未拥有。`);
                return;
            }
            if(!LabMap[res]) {
                global.log(`资源 ${res} 不存在。`);
                return;
            }
            const BotMemStructures =  global.BotMem('autoLab');
            if(!BotMemStructures[roomName]) BotMemStructures[roomName] = {};

            if(amount >= 0) {
                BotMemStructures[roomName][res] = amount;
                global.log(`已设置 ${roomName} 的自动lab合成: ${res} - ${amount}`);
            } else {
                delete BotMemStructures[roomName][res];
                global.log(`已删去 ${roomName} 的自动lab合成: ${res}`);
            }
            return OK;
        },
        autolist(roomName: string) {
            const BotMemAutoFactory = global.BotMem('autoLab');
            if(roomName) {
                const autoLab = BotMemAutoFactory[roomName];
                if(!autoLab || autoLab.length == 0) {
                    global.log(`[${roomName}]没有开启自动lab合成`);
                }
                else {
                    global.log(`[${roomName}]自动lab合成有: ${autoLab}`);
                }
                return OK;
            }

            if(!BotMemAutoFactory || Object.keys(BotMemAutoFactory).length == 0) {
                global.log(`没有房间开启自动lab合成`);
            }
            for(const room in BotMemAutoFactory) {
                if(!BotMemAutoFactory[room] || BotMemAutoFactory[room].length == 0) {
                    continue;
                }
                global.log(`[${room}]自动lab合成有: ${BotMemAutoFactory[room]}`);
            }
            return OK;
        }

    }
}