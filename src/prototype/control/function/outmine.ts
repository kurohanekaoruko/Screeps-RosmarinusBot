// 外矿设置
export default {
    outmine: {
        add(roomName: string, targetRoom: string) {
            if (!roomName || !targetRoom) return -1;
            const BotMem = global.BotMem('outmine');
            if (!BotMem[roomName]) BotMem[roomName] = {};
            const Mem = BotMem[roomName];
            const isCenterRoom = /^[EW]\d*[456][NS]\d*[456]$/.test(targetRoom); // 中间房间
            const isNotHighway = /^[EW]\d*[1-9][NS]\d*[1-9]$/.test(targetRoom); // 非过道房间
            // 普通房间
            if(!isCenterRoom && isNotHighway) {
                if (!Mem['energy']) Mem['energy'] = [];
                if (Mem['energy'].indexOf(targetRoom) === -1) {
                    Mem['energy'].push(targetRoom);
                    console.log(`房间 ${targetRoom} 已添加到 ${roomName} 的外矿列表。 `);
                    return OK;
                } else {
                    console.log(`房间 ${targetRoom} 已存在于 ${roomName} 的外矿列表中。 `);
                    return OK;
                }
            }
            // 过道房间
            else if(!isNotHighway) {
                if (!Mem['highway']) Mem['highway'] = [];
                if (Mem['highway'].indexOf(targetRoom) === -1) {
                    Mem['highway'].push(targetRoom);
                    console.log(`过道房间 ${targetRoom} 已添加到 ${roomName} 的监控列表`);
                    return OK;
                } else {
                    console.log(`过道房间 ${targetRoom} 已存在于 ${roomName} 的监控列表中。`);
                    return OK;
                }
            }
            // 中间房间
            else {
                if (!Mem['center']) Mem['center'] = [];
                if (Mem['center'].indexOf(targetRoom) === -1) {
                    Mem['center'].push(targetRoom);
                    console.log(`中间房间 ${targetRoom} 已添加到 ${roomName} 的采矿列表`);
                    return OK;
                } else {
                    console.log(`中间房间 ${targetRoom} 已存在于 ${roomName} 的采矿列表中。`);
                    return OK;
                }
            }
        },
        // 删除外矿
        remove(roomName: string, targetRoom: string) {
            if (!roomName || !targetRoom) return -1;
            const BotMem = global.BotMem('outmine');
            if (!BotMem[roomName]) return ERR_NOT_FOUND;
            const Mem = BotMem[roomName];
            const isCenterRoom = /^[EW]\d*[456][NS]\d*[456]$/.test(targetRoom); // 中间房间
            const isNotHighway = /^[EW]\d*[1-9][NS]\d*[1-9]$/.test(targetRoom); // 非过道房间
            // 普通房间
            if(!isCenterRoom && isNotHighway) {
                if (!Mem['energy']) return ERR_NOT_FOUND;
                if (Mem['energy'].indexOf(targetRoom) === -1) return ERR_NOT_FOUND;
                else {
                    Mem['energy'].splice(Mem['energy'].indexOf(targetRoom), 1);
                    delete Memory.rooms[targetRoom]['road'];
                    console.log(`房间 ${targetRoom} 从 ${roomName} 的外矿列表中删除。`);
                    return OK;
                }
            }
            // 过道房间
            else if(!isNotHighway) {
                if (!Mem['highway']) return ERR_NOT_FOUND;
                if (Mem['highway'].indexOf(targetRoom) === -1) return ERR_NOT_FOUND;
                else {
                    Mem['highway'].splice(Mem['highway'].indexOf(targetRoom), 1);
                    console.log(`过道房间 ${targetRoom} 从 ${roomName} 的监控列表中删除。`);
                    return OK;
                }
            }
            // 中间房间
            else {
                if (!Mem['center']) return ERR_NOT_FOUND;
                if (Mem['center'].indexOf(targetRoom) === -1) return ERR_NOT_FOUND;
                else {
                    Mem['center'].splice(Mem['center'].indexOf(targetRoom), 1);
                    console.log(`中间房间 ${targetRoom} 从 ${roomName} 的外矿列表中删除。`);
                    return OK;
                }
            }
        },
        // 获取外矿列表
        get(roomName: string) {
            if (!roomName) return -1;
            const BotMem = global.BotMem('outmine');
            if (!BotMem[roomName]) return ERR_NOT_FOUND;
            return `energy: ${BotMem[roomName]['energy'] || []}\n` +
                   `highway: ${BotMem[roomName]['highway'] || []}\n` +
                   `center: ${BotMem[roomName]['center'] || []}`;
        },
        // 清空外矿road缓存
        clearRoad(roomName: string) {
            delete Memory.rooms[roomName]['road'];
            console.log(`房间 ${roomName} 的外矿road缓存已清空。`);
            return OK;
        },
        setpower(roomName: string) {
            const BotMem = global.BotMem('rooms', roomName);
            BotMem['outminePower'] = !BotMem['outminePower'];
            console.log(`房间 ${roomName} 的自动采集Power已设置为 ${BotMem['outminePower']}。`);
            return OK;
        },
        setdeposit(roomName: string) {
            const BotMem = global.BotMem('rooms', roomName);
            BotMem['outmineDeposit'] = !BotMem['outmineDeposit'];
            console.log(`房间 ${roomName} 的自动采集Deposit已设置为 ${BotMem['outmineDeposit']}。`);
            return OK;
        },
        // 立即开始到指定房间开采power
        power(roomName: string, targetRoom: string, num: number, boostLevel?: number) {
            if (!roomName || !targetRoom || !num) return -1;
            const room = Game.rooms[roomName];
            if (!room) return;
            if (!room.memory['powerMine']) room.memory['powerMine'] = {};
            room.memory['powerMine'][targetRoom] = {
                creep: num,      // creep队伍数
                max: num,            // 最大孵化数量
                count: 0,          // 已孵化数量
                boostLevel: boostLevel || 0,     // 强化等级
            };
            console.log(`房间 ${roomName} 即将向 ${targetRoom} 派出 ${num} 数量的Power开采队。`);
            return OK;
        },
        // 立即开始到指定房间开采deposit
        deposit(roomName: string, targetRoom: string, num: number) {
            if (!roomName || !targetRoom || !num) return -1;
            const room = Game.rooms[roomName];
            if (!room) return;
            if (!room.memory['depositMine']) room.memory['depositMine'] = {};
            room.memory['depositMine'][targetRoom] = num;
            console.log(`房间 ${roomName} 即将向 ${targetRoom} 派出 ${num} 数量的Deposit开采队。`);
            return OK;
        },
        // 取消指定房间的开采
        cancel(roomName: string, targetRoom: string, type: 'power' | 'deposit') {
            const room = Game.rooms[roomName];
            if (!room) return;
            const spawnmission = room.getAllMissionFromPool('spawn');
            if ((!type || type == 'power') && room.memory['powerMine'])
                delete room.memory['powerMine'][targetRoom]
            if ((!type || type == 'deposit') && room.memory['depositMine'])
                delete room.memory['depositMine'][targetRoom]
            if (!spawnmission) return OK;
            for (const mission of spawnmission) {
                const data = mission.data;
                if (data.memory.targetRoom == targetRoom) {
                    room.deleteMissionFromPool('spawn', mission.id);
                }
            }
            console.log(`房间 ${roomName} 的 ${targetRoom} 开采已取消。`);
            return OK;
        }
    },
}