

export default {
    terminal: {
        // 立即发送资源
        send(room?: string, target?: string, type?: any, amount?: number){
            if(room && target && type && amount) {
                const terminal = Game.rooms[room].terminal;
                if (!terminal || terminal.cooldown !== 0) {
                    return Error(`${room} 的终端不存在或处于冷却。`);
                };
                const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;
                type = RESOURCE_ABBREVIATIONS[type] || type;
                amount = Math.min(amount, terminal.store[type] || 0);
                if(!amount) {console.log(`${room} 的终端没有足够的 ${type}。`); return;}
                const cost = Game.market.calcTransactionCost(amount, room, target);
                if(type == RESOURCE_ENERGY) {
                    amount = amount + cost > terminal.store[type] ? 
                            terminal.store[type] - cost : amount;
                }
                const result = terminal.send(type, amount, target);
                if(result === OK) {
                    console.log(`成功将 ${amount} 单位的 ${type} 从 ${room} 发送到 ${target}, 传输成本 ${cost}`);
                } else {
                    console.log(`${room} 发送资源失败，错误代码：${result}`);
                }
                return result;
            }
            if(!room && target && type && amount) {
                let total = amount;
                const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;
                type = RESOURCE_ABBREVIATIONS[type] || type;
                for (const room of Object.values(Game.rooms)) {
                    if (room.name == target) continue;
                    const terminal = room.terminal;
                    if (!terminal || terminal.cooldown !== 0) continue;
                    let amount = Math.min(total, terminal.store[type] || 0);
                    if(!amount) continue;
                    const cost = Game.market.calcTransactionCost(amount, room.name, target);
                    if(type == RESOURCE_ENERGY) {
                        amount = amount + cost > terminal.store[type] ? 
                                terminal.store[type] - cost : amount;
                    }
                    const result = terminal.send(type, amount, target);
                    if(result === OK) {
                        console.log(`成功将 ${amount} 单位的 ${type} 从 ${room.name} 发送到 ${target}, 传输成本 ${cost}`);
                        total -= amount;
                        if(total <= 0) break;
                    }
                    else {
                        console.log(`${room.name} 发送资源失败，错误代码：${result}`);
                    }
                }
                return OK;
            }
            return ERR_INVALID_ARGS;
        },
        // 显示终端资源
        show({roomName, type}) {
            if(roomName && type) {
                const terminal = Game.rooms[roomName].terminal;
                if (!terminal) {
                    console.log(`${roomName} 的终端不存在。`); return;
                };
                const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;
                const res = RESOURCE_ABBREVIATIONS[type] || type;
                console.log(`${roomName} 的终端有 ${terminal.store[res] || 0} 单位的 ${res}`);
            }

            if(!roomName && type) {
                for (const room of Object.values(Game.rooms)) {
                    const terminal = room.terminal;
                    if (!terminal) continue;
                    const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;
                    const res = RESOURCE_ABBREVIATIONS[type] || type;
                    console.log(`${room.name} 的终端有 ${terminal.store[res] || 0} 单位的 ${res}`);
                }
            }

            if(roomName && !type) {
                const terminal = Game.rooms[roomName].terminal;
                if (!terminal) {
                    console.log(`${roomName} 的终端不存在。`); return;
                }
                console.log(`${roomName} 的终端有 ${JSON.stringify(terminal.store)}`);
            }

            if(!roomName && !type) {
                for (const room of Object.values(Game.rooms)) {
                    const terminal = room.terminal;
                    if (!terminal) continue;
                    console.log(`${room.name} 的终端有 ${JSON.stringify(terminal.store)}`);
                }
            }
        },
    },
    resmanage: {
        show: {
            all() {
                const botmem = Memory['ResourceManage'];
                for (const res in botmem) {
                    console.log(`资源${res}:`);
                    console.log(`   -需求房间: ${botmem[res][0]||'无'}`);
                    console.log(`   -供应房间: ${botmem[res][1]||'无'}`);
                }
                return OK;
            },
            res(res: string) {
                if (!res) return Error('必须指定资源');
                const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;
                res = RESOURCE_ABBREVIATIONS[res] || res;
                const botmem = Memory['ResourceManage'];
                console.log(`资源${res}:`);
                console.log(`   -需求房间: ${botmem[res][0]||'无'}`);
                console.log(`   -供应房间: ${botmem[res][1]||'无'}`);
                return OK;
            },
            room(roomName: string) {
                if (!roomName) return Error('必须指定房间');
                const botmem = Memory['ResourceManage'];
                const reslist = {0: [], 1: []};
                for (const res in botmem) {
                    if (botmem[res][0]?.includes(roomName)) reslist[0].push(res);
                    if (botmem[res][1]?.includes(roomName)) reslist[1].push(res);
                }
                console.log(`房间${roomName}的资源需求: ${reslist[0]||'无'}`);
                console.log(`房间${roomName}的资源供应: ${reslist[1]||'无'}`);
                return OK;
            }
        },
        set(roomName: string, resource: string, type: 0 | 1) {
            const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            resource = RESOURCE_ABBREVIATIONS[resource] || resource;
            if (type != 0 && type != 1) return Error('第三参数type 必须是:0、1, 分别代表:需求、供应');
            const botmem = Memory['ResourceManage'];
            if (!botmem[resource]) botmem[resource] = {};
            if (!botmem[resource][type]) botmem[resource][type] = [];
            const index = botmem[resource][type].indexOf(roomName);
            if (index >= 0) {
                botmem[resource][type].splice(index, 1);
                console.log(`已将${roomName}从${resource}的${type==1?'供应':'需求'}列表中去除。`)
            } else {
                botmem[resource][type].push(roomName);
                console.log(`已将${roomName}添加到${resource}的${type==1?'供应':'需求'}列表中。`)
            }
            return OK;
        }
    }
}

