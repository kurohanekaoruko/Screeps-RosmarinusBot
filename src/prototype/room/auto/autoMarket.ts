export default class AutoMarket extends Room {
    // 自动市场交易
    autoMarket() {
        if (Game.time % 50 !== 0) return;
        const autoMaket = Memory['AutoData']['AutoMarketData'][this.name];
        if(!autoMaket) return;
        for(const item of autoMaket) {
            if(item.orderType == 'buy') {
                AutoBuy(this.name, item);
            }
            else if(item.orderType == 'sell') {
                AutoSell(this.name, item);
            }
            else if(item.orderType == 'dealbuy') {
                AutoDealBuy(this.name, item);
            }
            else if(item.orderType == 'dealsell') {
                AutoDealSell(this.name, item);
            }
        }
    }
}


function AutoBuy(roomName: string, item: any) {
    const amount = item.amount, type = item.type;
    const room = Game.rooms[roomName];
    const resourceType = global.BaseConfig.RESOURCE_ABBREVIATIONS[type] || type;

    // 检查房间资源储备
    const terminal = room.terminal;
    const storage = room.storage;
    if (!terminal) return;

    const terminalAmount = (terminal.store[resourceType] || 0);
    const storageAmount = (room.storage?.store[resourceType] || 0);

    let totalAmount = 0;
    if (!storage || !terminal.pos.inRangeTo(storage, 2)) {
        totalAmount = terminalAmount
    } else {
        totalAmount = terminalAmount + storageAmount
    }
    
    if (totalAmount >= amount) return;

    // 计算需要购买的数量
    const totalBuyAmount = amount - totalAmount;  // 总购买量
    if(totalBuyAmount <= 0) return;

    // 根据资源类型确定单次订单数量
    const orderAmount = (() => {
        if (resourceType !== RESOURCE_ENERGY) return 3000;
        return 50000;
    })()    // 单次订单量   

    // 检查是否已有同类型订单未完成
    const existingOrders = Game.market.orders;
    let existingOrder = null;
    for (const order of Object.values(existingOrders)) {
        if (order.roomName === room.name && 
            order.resourceType === resourceType && 
            order.type === ORDER_BUY &&
            order.remainingAmount > 0
        ) {
            existingOrder = order;
            break;
        }
    }

    // 如果已有同类型订单未完成，则更新价格
    if (existingOrder) {
        const price = global.order.getPrice(existingOrder.resourceType, ORDER_BUY);
        if(price > existingOrder.price + 0.1 || price < existingOrder.price - 1) {
            Game.market.changeOrderPrice(existingOrder.id, price);
            return OK;
        }
        return;
    }

    // 创建订单
    const result = global.order.buy({
        roomName: room.name,
        type: resourceType,
        amount: orderAmount,
        show: false
    });

    return result;
}

function AutoSell(roomName: string, item: any) {
    const amount = item.amount, type = item.type;
    const room = Game.rooms[roomName];
    const resourceType = global.BaseConfig.RESOURCE_ABBREVIATIONS[type] || type;

    // 检查房间资源储备
    const terminal = room.terminal;
    if (!terminal) return;

    const terminalAmount = !item.store || item.store == 'terminal' ?
                            (terminal.store[resourceType] || 0) : 0;
    const storageAmount = room.storage && (!item.store || item.store == 'storage') ?
                            (room.storage.store[resourceType] || 0) : 0;
    const totalAmount = terminalAmount + storageAmount;
    
    if (totalAmount < amount) return;

    // 计算需要出售的数量
    const sellAmount = totalAmount - amount;
    if(sellAmount <= 0) return;

    // 根据资源类型确定单次订单数量
    const orderAmount = resourceType === RESOURCE_ENERGY ? 10000 : 3000;    // 单次订单量
    if(sellAmount < orderAmount) return;    // 如果出售的资源量小于单次订单数量，则不创建订单

    // 检查是否已有同类型订单未完成
    const existingOrders = Game.market.orders;
    let existingOrder = null;
    for (const order of Object.values(existingOrders)) {
        if (order.roomName === room.name && 
            order.resourceType === resourceType && 
            order.type === ORDER_SELL &&
            order.remainingAmount > 0
        ) {
            existingOrder = order;
            break;
        }
    };

    if (existingOrder) {
        const price = global.order.getPrice(existingOrder.resourceType, ORDER_SELL);
        if(price > existingOrder.price + 0.1 || price < existingOrder.price - 1) {
            Game.market.changeOrderPrice(existingOrder.id, price);
        }
        return OK;
    }

    // 创建订单
    const result = global.order.sell({
        roomName: room.name,
        type: resourceType,
        amount: orderAmount,
        show: false
    });

    return result;
}

function AutoDealBuy(roomName: string, item: any) {
    let resourceType = item.type;  // 资源类型
    const amount = item.amount; // 资源数量, 自动出售阈值
    const price = item.price;   // 限制价格
    const room = Game.rooms[roomName];

    resourceType = global.BaseConfig.RESOURCE_ABBREVIATIONS[resourceType] || resourceType;

    // 检查房间资源储备
    const terminal = room.terminal;
    if (!terminal || terminal.cooldown > 0) return;

    const terminalAmount = terminal.store[resourceType] || 0;
    const storageAmount = room.storage ? (room.storage.store[resourceType] || 0) : 0;
    const totalAmount = terminalAmount + storageAmount;
    
    if (totalAmount >= amount) return;

    // 计算需要购买的数量
    const totalBuyAmount = amount - totalAmount;  // 总购买量
    if(totalBuyAmount <= 0) return;

    AutoDeal(room.name, resourceType, totalBuyAmount, ORDER_SELL, 10, price)

}

function AutoDealSell(roomName: string, item: any) {
    let resourceType = item.type;  // 资源类型
    const amount = item.amount; // 资源数量, 自动出售阈值
    const price = item.price;   // 限制价格
    const room = Game.rooms[roomName];

    resourceType = global.BaseConfig.RESOURCE_ABBREVIATIONS[resourceType] || resourceType;

    // 检查房间资源储备
    const terminal = room.terminal;
    if (!terminal || terminal.cooldown > 0) return;
    const terminalAmount = terminal.store[resourceType] || 0;
    const storageAmount = room.storage ? (room.storage.store[resourceType] || 0) : 0;
    const totalAmount = terminalAmount + storageAmount;
    
    if (totalAmount <= amount) return;

    // 计算需要出售的数量
    const sellAmount = Math.min(totalAmount - amount, terminalAmount);
    if(sellAmount <= 0) return;

    AutoDeal(room.name, resourceType, sellAmount, ORDER_BUY, 10, price);
}


function AutoDeal(roomName: string, res: ResourceConstant, amount: number, orderType: ORDER_BUY | ORDER_SELL, length: number, price: number) {
    const room = Game.rooms[roomName];
    if(!room || !room.terminal) return ERR_NOT_FOUND;

    const orders = Game.market.getAllOrders({type: orderType, resourceType: res});
    if(orders.length === 0) return ERR_NOT_FOUND;

    // 按照单价排序
    orders.sort((a, b) => {
        if (orderType === ORDER_SELL) {
            return a.price - b.price;
        } else {
            return b.price - a.price;
        }
    });

    let ecost = Game.market.getHistory(RESOURCE_ENERGY)[0].avgPrice;

    let bestOrder = null;
    let bestCost = (orderType === ORDER_SELL) ? Infinity : 0;
    let bestDealAmount = 0;
    let bestTransferEnergyCost = 0;
    let bestResourceCost = 0;
    const maxOrders = Math.min(orders.length, length);
    for (let i = 0; i < maxOrders; i++) {
        const order = orders[i];    // 订单
        if(orderType === ORDER_SELL && order.price > price) continue;
        else if(orderType === ORDER_BUY && order.price < price) continue;

        const dealAmount = Math.min(amount, order.amount);  // 交易数量
        const transferEnergyCost = Game.market.calcTransactionCost(dealAmount, roomName, order.roomName);  // 交易能量成本
        const resourceCost = dealAmount * order.price;  // 交易金额
        const ENERGY_COST_FACTOR = ecost;

        let cost = 0;
        if(res === RESOURCE_ENERGY) {
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
    }

    if (!bestOrder) return;

    const order = bestOrder;
    const dealAmount = bestDealAmount;
    const transferEnergyCost = bestTransferEnergyCost;
    const resourceCost = bestResourceCost;
    const id = order.id;
    const result = Game.market.deal(id, dealAmount, roomName);

    if (result === OK) {
        console.log(`房间 ${roomName} 成功${orderType === ORDER_SELL ? '从' : '向'} ${order.roomName} ${orderType === ORDER_SELL ? '购买' : '出售'} ${dealAmount} 单位的 ${res}。`);
        console.log(`交易金额：${resourceCost} 能量成本：${transferEnergyCost} 综合单价：${bestCost}`);
    } else {
        console.log(`房间 ${roomName} ${orderType === ORDER_SELL ? '从' : '向'} ${order.roomName} ${orderType === ORDER_SELL ? '购买' : '出售'} ${res} 失败，错误代码：${result}`);
    }

    return result;
}