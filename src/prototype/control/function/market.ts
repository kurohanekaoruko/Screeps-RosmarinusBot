export default {
    // 创建市场订单
    order: {
        buy(data: { roomName: any; type: any; amount: any; price: any; show: any; }) {
            const {roomName, type, amount, price, show} = data;

            // 如果没有提供价格，获取市场订单并设置最优价格
            let finalPrice = price;
            if (!finalPrice) {
                finalPrice = this.getPrice(type, ORDER_BUY);
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
                finalPrice = this.getPrice(type, ORDER_SELL);
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
        },
        getPrice(type: any, orderType: any): any {
            let finalPrice = 1;
            const orders = Game.market.getAllOrders({type: orderType, resourceType: type});
            if (!orders || orders.length === 0) return finalPrice;
            orders.sort((a, b) => {
                if (orderType === ORDER_BUY) {
                    return b.price - a.price; // 按价格从高到低排序
                } else {
                    return a.price - b.price; // 按价格从低到高排序
                }
            });
            const topOrders = orders.filter(order => {
                if (order.price < 1) return false;
                if (order.price < orders[0].price * 0.8) return false;
                if (order.price > orders[0].price * 1.2) return false;
                return true;
            }).slice(0, 10);
            // 计算这些订单的平均价格
            const averagePrice = topOrders.reduce((sum, order) => sum + order.price, 0) / topOrders.length;
            if (orderType === ORDER_BUY) {
                // 过滤掉高于平均价格太多的订单
                const filteredOrders = topOrders.filter(order => order.price <= averagePrice * 1.05);
                if (filteredOrders.length > 0) {
                    // 选择过滤后的最高价格稍微降低一点作为求购价格
                    finalPrice = filteredOrders[0].price - 0.1;
                    return finalPrice;
                }
            } else if (orderType === ORDER_SELL) {
                // 过滤掉低于平均价格太多的订单
                const filteredOrders = topOrders.filter(order => order.price >= averagePrice * 0.95);
                if (filteredOrders.length > 0) {
                    // 选择过滤后的最低价格作为出售价格，并稍微提高一点以确保订单能被接受
                    finalPrice = filteredOrders[0].price + 0.1;
                    return finalPrice;
                }
            }
            return finalPrice;
        }
    },
    market: {
        // 市场交易
        deal: {
            buy(roomName: any, type: any, amount: any, show=true, length=20, ecost= 10) {
                type = global.BaseConfig.RESOURCE_ABBREVIATIONS[type] || type;
                if (INTERSHARD_RESOURCES.includes(type)) {
                    return interShardMarket(type, amount, 'buy', show);
                }
                return handleMarketTransaction(roomName, type, amount, ORDER_SELL, length, show, ecost);
            },
            sell(roomName: any, type: any, amount: any, show=true, length=20, ecost=10) {
                type = global.BaseConfig.RESOURCE_ABBREVIATIONS[type] || type;
                if (INTERSHARD_RESOURCES.includes(type)) {
                    return interShardMarket(type, amount, 'sell', show);
                }
                return handleMarketTransaction(roomName, type, amount, ORDER_BUY, length, show, ecost);
            },
        },
        // Id交易
        dealid: {
            buy(orderId: string, maxAmount: number=10000) {
                const order = Game.market.getOrderById(orderId);
                if (!order) return Error(`订单ID无效：${orderId}`);
                if (order.type != ORDER_SELL) return Error(`订单不是卖单`);

                let totalAmount = Math.min(maxAmount, order.amount);
                for (const room of Object.values(Game.rooms)) {
                    if (!room.terminal || room.terminal.cooldown > 0) continue;
                    let amount = Math.min(totalAmount, room.terminal.store.getFreeCapacity());
                    const cost = Game.market.calcTransactionCost(amount, room.name, order.roomName);
                    if (room.terminal.store[RESOURCE_ENERGY] < cost) {
                        amount = Math.floor(room.terminal.store[RESOURCE_ENERGY] / cost);
                    }
                    // if (amount <= 0) continue;
                    const result = Game.market.deal(orderId, amount, room.name);
                    if (result !== OK) {
                        console.log(`房间 ${room.name} 交易失败：${result}`);
                        continue;
                    }
                    totalAmount -= amount;
                    console.log(`房间 ${room.name} 购买了 ${amount} 单位的 ${order.resourceType}, 传输成本${Game.market.calcTransactionCost(amount, room.name, order.roomName)}`);
                    if (totalAmount <= 0) break;
                }
                totalAmount = Math.min(maxAmount, order.amount) - totalAmount;
                console.log(`总共成功交易了${totalAmount}, 订单剩余${order.amount-totalAmount}`)
                return OK;
            },
            sell(orderId: string, maxAmount: number=10000) {
                const order = Game.market.getOrderById(orderId);
                if (!order) return Error(`订单ID无效：${orderId}`);
                if (order.type != ORDER_BUY) return Error(`订单不是买单`);
                let totalAmount = Math.min(maxAmount, order.amount);
                for (const room of Object.values(Game.rooms)) {
                    if (!room.terminal || room.terminal.cooldown !== 0) continue;
                    const amount = Math.min(totalAmount, room.terminal.store[order.resourceType]);
                    if (amount <= 0) continue;
                    const result = Game.market.deal(orderId, amount, room.name);
                    if (result !== OK) continue;
                    totalAmount -= amount;
                    console.log(`房间 ${room.name} 出售了 ${amount} 单位的 ${order.resourceType}`);
                    if (totalAmount <= 0) break;
                }
                totalAmount = Math.min(maxAmount, order.amount) - totalAmount;
                console.log(`总共成功交易了${totalAmount}, 订单剩余${order.amount-totalAmount}`)
            }
        },
        // 自动市场交易
        auto: {
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
                    return OK;
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
                return OK;
            },
            remove(roomName: string, type: string, orderType: string) {
                const BOT_NAME = global.BOT_NAME;
                if(!Memory[BOT_NAME]['autoMarket'][roomName]) {
                    console.log(`房间 ${roomName} 没有开启自动交易`);
                    return OK;
                }
                const autoMarket = Memory[BOT_NAME]['autoMarket'][roomName];
                const index = autoMarket.findIndex((item: any) => item.type === type && item.orderType === orderType);
                if(index === -1) {
                    console.log(`房间 ${roomName} 没有开启自动交易：${type}，${orderType}`);
                    return OK;
                }
                autoMarket.splice(index, 1);
                console.log(`已关闭房间 ${roomName} 自动交易：${type}，${orderType}`);
                return OK;
            },
            buy(roomName: any, type: any, amount: any, store?: string) {
                const BOT_NAME = global.BOT_NAME;
                if(!Memory[BOT_NAME]['autoMarket'][roomName]) {
                    Memory[BOT_NAME]['autoMarket'][roomName] = [];
                }
                const autoMarket = Memory[BOT_NAME]['autoMarket'][roomName];
                const autoOrder = autoMarket.find((item: any) => item.type === type && item.orderType === 'buy');
                if(!autoOrder) {
                    const item = {type, amount, orderType: 'buy'};
                    if(store) item['store'] = store;
                    autoMarket.push(item);
                    console.log(`已在房间 ${roomName} 开启自动求购${type}，购买阈值${amount}`);
                } else {
                    autoOrder['amount'] = amount;
                    if(store) autoOrder['store'] = store;
                    else delete autoOrder['store'];
                    console.log(`房间 ${roomName} 已存在自动求购${type}，已修改为:${JSON.stringify(autoOrder)}`);
                }
                return OK;
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
                return OK;
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
                return OK;
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
                return OK;
            }
        }
    },
    // 清理无效订单
    orderClear() {
        const TIME_THRESHOLD = 50000; // 时间阈值
        const MAX_ORDERS = 200; // 最大允许订单数
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
            ordersToDelete.forEach(orderId => Game.market.cancelOrder(orderId));
            console.log(`已清理 ${ordersToDelete.length} 个已完成的订单`);
        }
    },
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

    let bestOrder = null;        // 最优订单
    let bestPrice = (orderType === ORDER_SELL) ? Infinity : 0;
    let bestDealAmount = 0;    // 最优订单的交易数量
    let bestTransferCost = 0; // 最优订单的传输能量成本
    let bestDealCredit = 0;    // 最优订单的交易金额
    const maxOrders = Math.min(orders.length, length);
    for (let i = 0; i < maxOrders; i++) {
        // 订单对象
        const order = orders[i];
        // 交易数量
        const dealAmount = Math.min(amount, order.amount);
        // 传输成本
        const transferEnergyCost = Game.market.calcTransactionCost(dealAmount, roomName, order.roomName);
        // 交易金额
        const dealCredit = dealAmount * order.price;
        // 能量估算单价
        const ENERGY_COST = eCost;

        let price = 0;  // 综合单价
        if(type === RESOURCE_ENERGY) {
            if(orderType === ORDER_SELL) {
                // 购买能量：交易金额 ÷ (交易数量 - 传输消耗) = 实际综合单价
                price = dealCredit / (dealAmount - transferEnergyCost);
            } else {
                // 出售能量：交易金额 ÷ (交易数量 + 传输消耗) = 实际综合单价
                price = dealCredit / (dealAmount + transferEnergyCost);
            }
        } else {
            if(orderType === ORDER_SELL) {
                // 购买资源：(交易金额 + 能量估算成本) ÷ 实际到账数量 = 实际综合单价
                price = (dealCredit + transferEnergyCost * ENERGY_COST) / dealAmount;  
            } else {
                // 出售资源：(交易金额 - 能量估算成本) ÷ 实际消耗数量 = 实际综合单价
                price = (dealCredit - transferEnergyCost * ENERGY_COST) / dealAmount;
            }
        }

        if ((orderType === ORDER_SELL && price < bestPrice) ||
            (orderType === ORDER_BUY && price > bestPrice)) {
            bestOrder = order;
            bestPrice = price;
            bestDealCredit = dealCredit;
            bestDealAmount = dealAmount;
            bestTransferCost = transferEnergyCost;
        }

        if(show) console.log(`订单：${order.id} 交易数量：${dealAmount} 交易金额：${bestDealCredit.toFixed(4)}` +
                        `交易能量成本：${transferEnergyCost} 单价：${order.price} 综合单价：${price.toFixed(4)}` +
                        `订单余量：${order.amount} 目标房间：${order.roomName}`);
    }

    if (!bestOrder) {
        console.log(`房间 ${roomName} 无法找到合适的${orderType === ORDER_SELL ? '出售' : '求购'} ${type} 订单`);
        return;
    }
    else {
        console.log(`房间 ${roomName} 找到合适的${orderType === ORDER_SELL ? '出售' : '求购'} ${type} 订单：${bestOrder.id} 
            交易数量：${bestDealAmount} 交易总金额：${bestDealCredit.toFixed(4)} 单价：${bestOrder.price}
            目标房间：${bestOrder.roomName} 能量成本：${bestTransferCost} 综合单价：${bestPrice.toFixed(4)}
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
    const transferEnergyCost = bestTransferCost;
    const dealCredit = bestDealCredit;
    const id = order.id;
    const result = Game.market.deal(id, dealAmount, roomName);

    if (result === OK) {
        console.log(`房间 ${roomName} 成功${orderType === ORDER_SELL ? '从' : '向'} ${order.roomName} ${orderType === ORDER_SELL ? '购买' : '出售'} ${dealAmount} 单位的 ${type}。`);
        console.log(`交易金额：${dealCredit}`);
        console.log(`能量成本：${transferEnergyCost}`);
        console.log(`综合单价：${bestPrice}`);
    } else {
        console.log(`房间 ${roomName} ${orderType === ORDER_SELL ? '从' : '向'} ${order.roomName} ${orderType === ORDER_SELL ? '购买' : '出售'} ${type} 失败，错误代码：${result}`);
    }
    return result;
}

// 特殊资源市场交易
function interShardMarket(type: any, amount: number, order: string, show: boolean) {
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
        if (!bestOrder || (orderType === ORDER_SELL && order.price < bestPrice) ||
            (orderType === ORDER_BUY && order.price > bestPrice)){
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
}