

export default {
    // 发送资源
    send(room?: string, target?: string, type?: any, amount?: number){
        if(room && target && type && amount) {
            const terminal = Game.rooms[room].terminal;
            if (!terminal || terminal.cooldown !== 0) {
                console.log(`${room} 的终端不存在或处于冷却。`); return;
            };
            const RESOURCE_ABBREVIATIONS = global.BaseConfig.RESOURCE_ABBREVIATIONS;
            type = RESOURCE_ABBREVIATIONS[type] || type;
            amount = Math.min(terminal.store[type] || 0, amount);
            if(!amount) {console.log(`${room} 的终端没有足够的 ${type}。`); return;}
            const cost = Game.market.calcTransactionCost(amount, room, target);
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
                const amount = Math.min(total, terminal.store[type] || 0);
                if(!amount) continue;
                const cost = Game.market.calcTransactionCost(amount, room.name, target);
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
    showTerminal({roomName, type}) {
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
    // 创建市场订单
    createOrder: {
        buy(data: { roomName: any; type: any; amount: any; price: any; show: any; }) {
            const {roomName, type, amount, price, show} = data;

            // 如果没有提供价格，获取市场订单并设置最优价格
            let finalPrice = price;
            if (!finalPrice) {
                const orders = Game.market.getAllOrders({type: ORDER_BUY, resourceType: type});
                if (orders.length > 0) {
                    // 按价格从高到低排序
                    orders.sort((a, b) => b.price - a.price);
                    // 只考虑前10个订单
                    const topOrders = orders.filter(order => 
                                    order.price > orders[0].price * 0.8)
                                    .slice(0, 10);
                    // 计算这些订单的平均价格
                    const averagePrice = topOrders.reduce((sum, order) => sum + order.price, 0) / topOrders.length;
                    // 过滤掉高于平均价格1.2倍的订单
                    const filteredOrders = topOrders.filter(order => order.price <= averagePrice * 1.2);
                    if (filteredOrders.length > 0) {
                        // 选择过滤后的最高价格稍微降低一点作为求购价格
                        finalPrice = filteredOrders[0].price * 0.99;
                    } else {
                        console.log(`${type} 的市场求购订单价格异常，无法创建求购订单。`);
                        return ERR_NOT_FOUND;
                    }
                } else {
                    console.log(`没有找到 ${type} 的市场求购订单，无法创建求购订单。`);
                    return ERR_NOT_FOUND;
                }
            }

            // 创建购买订单
            const result = Game.market.createOrder({
                type: ORDER_BUY,
                resourceType: type,
                price: finalPrice,
                totalAmount: amount,
                roomName: roomName
            });

            if (result === OK && show) {
                console.log(`成功创建购买订单：房间 ${roomName}，资源 ${type}，数量 ${amount}，价格 ${finalPrice}`);
            } else if (show) {
                console.log(`创建购买订单失败，错误代码：${result}`);
            }

            return result;
        },
        sell(data: { roomName: any; type: any; amount: any; price: any; show: any; }) {
            const {roomName, type, amount, price, show} = data;

            // 如果没有提供价格，获取市场订单并设置最优价格
            let finalPrice = price;
            if (!finalPrice) {
                const orders = Game.market.getAllOrders({type: ORDER_SELL, resourceType: type});
                if (orders.length > 0) {
                    // 按价格从低到高排序
                    orders.sort((a, b) => a.price - b.price);
                    // 只考虑前10个订单
                    const topOrders = orders.filter(order =>
                                    order.price <= orders[0].price * 1.2)
                                    .slice(0, 10);
                    // 计算这些订单的平均价格
                    const averagePrice = topOrders.reduce((sum, order) => sum + order.price, 0) / topOrders.length;
                    // 过滤掉低于平均价格0.8倍的订单
                    const filteredOrders = topOrders.filter(order => order.price >= averagePrice * 0.8);
                    if (filteredOrders.length > 0) {
                        // 选择过滤后的最低价格作为出售价格，并稍微提高一点以确保订单能被接受
                        finalPrice = filteredOrders[0].price * 1.01;
                    } else {
                        console.log(`${type} 的市场出售订单价格异常，无法创建出售订单。`);
                        return ERR_NOT_FOUND;
                    }
                } else {
                    console.log(`没有找到 ${type} 的市场出售订单，无法创建出售订单。`);
                    return ERR_NOT_FOUND;
                }
            }

            // 创建销售订单
            const result = Game.market.createOrder({
                type: ORDER_SELL,
                resourceType: type,
                price: finalPrice,
                totalAmount: amount,
                roomName: roomName
            });


            if (result === OK && show !== false && show !== 0) {
                console.log(`成功创建出售订单：房间 ${roomName}，资源 ${type}，数量 ${amount}，价格 ${finalPrice}`);
            } else if (show !== false && show !== 0) {
                console.log(`创建出售订单失败，错误代码：${result}`);
            }

            return result;
        }
    },
    // 市场交易
    market: {
        buy(roomName: any, type: any, amount: any, length=20, show=true, ecost= 10) {
            if (INTERSHARD_RESOURCES.includes(type)) {
                return global.interShardMarket(type, amount, 'buy', !!show);
            }
            return handleMarketTransaction(roomName, type, amount, ORDER_SELL, length, show, ecost);
        },
        sell(roomName: any, type: any, amount: any, length=20, show=true, ecost=10) {
            if (INTERSHARD_RESOURCES.includes(type)) {
                return global.interShardMarket(type, amount, 'sell', show);
            }
            return handleMarketTransaction(roomName, type, amount, ORDER_BUY, length, show, ecost);
        }
    },
    // 特殊资源市场交易
    interShardMarket(type: any, amount: number, order: string, show: boolean) {
        const orderType = order == 'buy' ? ORDER_SELL : ORDER_BUY;
        const orders = Game.market.getAllOrders({type: orderType, resourceType: type});

        let bestOrder = null;
        let bestDealAmount = 0;
        let bestPrice = 0;

        const maxOrders = Math.min(orders.length, 50);
        for(let i = 0; i < maxOrders; i++){
            const order = orders[i];
            if(show){
                console.log(`订单：${order.id} 单价${order.price} 订单余量：${order.amount}`);
            }
            if(!bestOrder || (orderType === ORDER_SELL && order.price < bestPrice) || (orderType === ORDER_BUY && order.price > bestPrice)){
                bestOrder = order;
                bestDealAmount = Math.min(amount, order.amount);
                bestPrice = order.price;
            }
        }

        if (!bestOrder) {
            console.log(`没有找到合适的${orderType === ORDER_SELL ? '出售': '求购'} ${type} 订单`);
            return ERR_NOT_FOUND;
        }
        console.log(`找到合适的${orderType === ORDER_SELL ? '出售': '求购'} ${type} 订单：${bestOrder.id} 单价${bestPrice} 订单余量：${bestDealAmount}`);

        if(show) return true;

        const result = Game.market.deal(bestOrder.id, bestDealAmount);
        if(result === OK){
            console.log(`成功${orderType === ORDER_SELL ? '购买': '出售'} ${bestDealAmount} 单位的 ${type}，单价${bestPrice}`);
            console.log(`交易金额：${bestDealAmount * bestPrice}`);
        }
        else{
            console.log(`${orderType === ORDER_SELL ? '购买': '出售'} ${type} 失败，错误代码：${result}`);
        }
        return result;
    },
    // 清理无效订单
    orderClear() {
        const TIME_THRESHOLD = 50000; // 时间阈值
        const MAX_ORDERS = 200; // 最大订单数
        const TARGET_ORDERS = 100; // 清理到
    
        const orders = Object.values(Game.market.orders);
        if (orders.length < MAX_ORDERS) return;
    
        const currentTime = Game.time;
        const completedOrders = orders.filter(order => order.remainingAmount === 0)
            .sort((a, b) => a.created - b.created);
    
        const ordersToDelete = completedOrders.filter((order, index) =>
            (currentTime - order.created > TIME_THRESHOLD) || (index < orders.length - TARGET_ORDERS)
        ).map(order => order.id);
    
        if (ordersToDelete.length > 0) {
            console.log(`正在清理 ${ordersToDelete.length} 个已完成的订单`);
            ordersToDelete.forEach(orderId => Game.market.cancelOrder(orderId));
        }
    },
    // 自动市场交易
    autoMarket: {
        list(roomName: string) {
            const BOT_NAME = global.BOT_NAME;
            if(roomName) {
                const autoMarket = Memory[BOT_NAME]['autoMarket'][roomName];
                if(!autoMarket || autoMarket.length == 0) {
                    console.log(`房间 ${roomName} 没有开启自动交易`);
                }
                else {
                    console.log(`房间 ${roomName} 的自动交易列表：`);
                }
                for(const item of autoMarket) {
                    console.log(` - ${item.type}，触发阈值${item.amount}，订单类型${item.orderType}`);
                }
                return true;
            }

            const autoMarket = Memory[BOT_NAME]['autoMarket']
            if(!autoMarket || Object.keys(autoMarket).length == 0) {
                console.log(`没有房间开启自动交易`);
            }
            for(const room in autoMarket) {
                if(!autoMarket[room] || autoMarket[room].length == 0) {
                    continue;
                }
                console.log(`房间 ${room} 的自动交易列表：`);
                for(const item of autoMarket[room]) {
                    console.log(` - ${item.type}，触发阈值${item.amount}，订单类型${item.orderType}`);
                }
            }
            return true;
        },
        remove(roomName: string, type: string, orderType: string) {
            const BOT_NAME = global.BOT_NAME;
            if(!Memory[BOT_NAME]['autoMarket'][roomName]) {
                console.log(`房间 ${roomName} 没有开启自动交易`);
                return true;
            }
            const autoMarket = Memory[BOT_NAME]['autoMarket'][roomName];
            const index = autoMarket.findIndex((item: any) => item.type === type && item.orderType === orderType);
            if(index === -1) {
                console.log(`房间 ${roomName} 没有开启自动交易：${type}，${orderType}`);
                return true;
            }
            autoMarket.splice(index, 1);
            console.log(`已关闭房间 ${roomName} 自动交易：${type}，${orderType}`);
            return true;
        },
        buy(roomName: any, type: any, amount: any, ) {
            const BOT_NAME = global.BOT_NAME;
            if(!Memory[BOT_NAME]['autoMarket'][roomName]) {
                Memory[BOT_NAME]['autoMarket'][roomName] = [];
            }
            const autoMarket = Memory[BOT_NAME]['autoMarket'][roomName];
            if(!autoMarket.find((item: any) => item.type === type && item.orderType === 'buy')) {
                autoMarket.push({type, amount, orderType: 'buy'});
                console.log(`已在房间 ${roomName} 开启自动求购${type}，购买阈值${amount}`);
            } else {
                console.log(`房间 ${roomName} 已存在自动求购${type}，购买阈值${amount}`);
            }
            return true;
        },
        sell(roomName: any, type: any, amount: any, ) {
            const BOT_NAME = global.BOT_NAME;
            if(!Memory[BOT_NAME]['autoMarket'][roomName]) {
                Memory[BOT_NAME]['autoMarket'][roomName] = [];
            }
            const autoMarket = Memory[BOT_NAME]['autoMarket'][roomName];
            if(!autoMarket.find((item: any) => item.type === type && item.orderType === 'sell')) {
                autoMarket.push({type, amount, orderType: 'sell'});
                console.log(`已在房间 ${roomName} 开启自动出售${type}，出售阈值${amount}`);
            } else {
                console.log(`房间 ${roomName} 已存在自动出售${type}，出售阈值${amount}`);
            }
            return true;
        },
        dealbuy(roomName: string, type: string, amount: number) {
            const BOT_NAME = global.BOT_NAME;
            const autoMarket = Memory[BOT_NAME]['autoMarket'][roomName];
            if(!autoMarket.find((item: any) => item.type === type && item.orderType === 'dealbuy')) {
                autoMarket.push({type, amount, orderType: 'dealbuy'});
                console.log(`已在房间 ${roomName} 开启自动购买交易${type}，购买阈值${amount}`);
            } else {
                console.log(`房间 ${roomName} 已存在自动购买交易${type}，购买阈值${amount}`);
            }
            return true;
        },
        dealsell(roomName: string, type: string, amount: number) {
            const BOT_NAME = global.BOT_NAME;
            const autoMarket = Memory[BOT_NAME]['autoMarket'][roomName];
            if(!autoMarket.find((item: any) => item.type === type && item.orderType === 'dealsell')) {
                autoMarket.push({type, amount, orderType: 'dealsell'});
                console.log(`已在房间 ${roomName} 开启自动出售交易${type}，出售阈值${amount}`);
            } else {
                console.log(`房间 ${roomName} 已存在自动出售交易${type}，出售阈值${amount}`);
            }
            return true;
        }
    }
}

function handleMarketTransaction(roomName: string, type: any, amount: number, orderType: string, length: number, show: boolean, eCost: number) {
    const orders = Game.market.getAllOrders({type: orderType, resourceType: type});
    // 按照单价排序
    orders.sort((a, b) => {
        if (orderType === ORDER_SELL) {
            return a.price - b.price;  // 对于购买订单，按照价格从低到高排序
        } else {
            return b.price - a.price;  // 对于出售订单，按照价格从高到低排序
        }
    });

    let bestOrder = null;
    let bestCost = (orderType === ORDER_SELL) ? Infinity : 0;
    let bestDealAmount = 0;
    let bestTransferEnergyCost = 0;
    let bestResourceCost = 0;
    const maxOrders = Math.min(orders.length, length);
    for (let i = 0; i < maxOrders; i++) {
        const order = orders[i];    // 订单
        const dealAmount = Math.min(amount, order.amount);  // 交易数量
        const transferEnergyCost = Game.market.calcTransactionCost(dealAmount, roomName, order.roomName);  // 交易能量成本
        const resourceCost = dealAmount * order.price;  // 交易金额
        const ENERGY_COST_FACTOR = eCost;

        let cost = 0;
        if(type === RESOURCE_ENERGY) {
            if(orderType === ORDER_SELL) {
                cost = resourceCost / (dealAmount - transferEnergyCost);  // 购买能量：交易金额÷(交易数量-传输消耗)=实际价格
            } else {
                cost = resourceCost / (dealAmount + transferEnergyCost);  // 出售能量：交易金额÷(交易数量+传输消耗)=实际价格
            }
        } else {
            if(orderType === ORDER_SELL) {
                cost = (resourceCost + transferEnergyCost * ENERGY_COST_FACTOR) / dealAmount;  // 购买资源：(交易金额+能量估算成本)÷实际到账数量=实际价格
            } else {
                cost = (resourceCost - transferEnergyCost * ENERGY_COST_FACTOR) / dealAmount;  // 出售资源：(交易金额-能量估算成本)÷实际消耗数量=实际价格
            }
        }

        if((orderType === ORDER_SELL && cost < bestCost) || (orderType === ORDER_BUY && cost > bestCost)) {
            bestOrder = order;
            bestCost = cost;
            bestResourceCost = resourceCost;
            bestDealAmount = dealAmount;
            bestTransferEnergyCost = transferEnergyCost;
        }

        if(show) console.log(`订单：${order.id} 交易数量：${dealAmount} 交易金额：${resourceCost.toFixed(4)} 交易能量成本：${transferEnergyCost} 单价：${order.price} 综合单价：${cost.toFixed(4)} 订单余量：${order.amount} 目标房间：${order.roomName}`);
    }

    if (!bestOrder) {
        console.log(`房间 ${roomName} 无法找到合适的${orderType === ORDER_SELL ? '出售' : '求购'} ${type} 订单`);
        return;
    }
    else {
        console.log(`房间 ${roomName} 找到合适的${orderType === ORDER_SELL ? '出售' : '求购'} ${type} 订单：${bestOrder.id} 
            交易数量：${bestDealAmount} 交易总金额：${bestResourceCost.toFixed(4)} 单价：${bestOrder.price}
            目标房间：${bestOrder.roomName} 能量成本：${bestTransferEnergyCost} 综合单价：${bestCost.toFixed(4)}
            订单余量：${bestOrder.amount}`);
    }

    if(show) return true;    // 只看不买

    const room = Game.rooms[roomName];
    if(!room || !room.terminal) {
        console.log(`房间 ${roomName} 没有终端，无法进行交易`);
        return ERR_NOT_FOUND;
    }

    const order = bestOrder;
    const dealAmount = bestDealAmount;
    const transferEnergyCost = bestTransferEnergyCost;
    const resourceCost = bestResourceCost;
    const id = order.id;
    const result = Game.market.deal(id, dealAmount, roomName);

    if (result === OK) {
        console.log(`房间 ${roomName} 成功${orderType === ORDER_SELL ? '从' : '向'} ${order.roomName} ${orderType === ORDER_SELL ? '购买' : '出售'} ${dealAmount} 单位的 ${type}。`);
        console.log(`交易金额：${resourceCost}`);
        console.log(`能量成本：${transferEnergyCost}`);
        console.log(`综合单价：${bestCost}`);
    } else {
        console.log(`房间 ${roomName} ${orderType === ORDER_SELL ? '从' : '向'} ${order.roomName} ${orderType === ORDER_SELL ? '购买' : '出售'} ${type} 失败，错误代码：${result}`);
    }
    return result;
}
