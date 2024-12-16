import {LabMap,LabRes,Goods} from '@/constant/ResourceConstant'

export const ResourceManage = {
    tick: () => {
        if (Game.time % 10) return;
        const botmem = Memory['ResourceManage'];
        
        const THRESHOLD = {
            source: { energy: 150000, default: 8000 },
            target: { energy: 100000, default: 6000 }}
        LabRes.concat(Object.keys(LabMap)).forEach((r) => { THRESHOLD.source[r] = 10000; THRESHOLD.target[r] = 8000 } );
        Goods.forEach((r) => { THRESHOLD.source[r] = 2000; THRESHOLD.target[r] = 1000 } );
        
        const sendOK = {};
        for (const res in botmem) {
            // 供给
            const supply = (botmem[res][1]||[]).filter((roomName: string) => {
                if(sendOK[roomName]) return false;
                const room = Game.rooms[roomName];
                if (!room) return false;
                const terminal = room.terminal;
                if (!terminal) return false;
                if (terminal.cooldown) return false;
                const ResAmount = room.getResourceAmount(res);
                // 小于阈值不供给
                if (ResAmount < (THRESHOLD.source[res] || THRESHOLD.source.default)) return false;
                return true;
            }) as string[];
            // 需求
            const demand = (botmem[res][0]||[]).filter((roomName: string) => {
                const room = Game.rooms[roomName];
                if (!room) return false;
                const terminal = room.terminal;
                if (!terminal) return false;
                const ResAmount = room.getResourceAmount(res);
                // 大于阈值不需求
                if (ResAmount >= (THRESHOLD.source[res] || THRESHOLD.source.default)) return false;
                return true;
            }) as string[];
            if (!supply.length || !demand.length) continue;
            // 降序排序
            supply.sort((a, b) => {
                const roomA = Game.rooms[a];
                const roomB = Game.rooms[b];
                const ResAmountA = roomA.getResourceAmount(res);
                const ResAmountB = roomB.getResourceAmount(res);
                return ResAmountB - ResAmountA;
            })
            // 升序排序
            demand.sort((a, b) => {
                const roomA = Game.rooms[a];
                const roomB = Game.rooms[b];
                const ResAmountA = roomA.getResourceAmount(res);
                const ResAmountB = roomB.getResourceAmount(res);
                return ResAmountA - ResAmountB;
            })
            
            let Its = 0;
            let Itd = 0;
            // 高的发给少的
            while (Its < supply.length && Itd < demand.length) {
                const resource = res as ResourceConstant;
                const terminal = Game.rooms[supply[Its]].terminal;
                const amount = terminal.store[resource];
                // 能发数量不够1000就不发
                if (amount < 1000) {Its++;continue;}
                terminal.send(resource, amount, demand[Itd]);
                // 标记该房间已发送过
                sendOK[supply[Its]] = true;
                console.log(`[ResourceManage] ${supply[Its]} -> ${demand[Itd]} ${amount} ${resource}`);
                Its++;Itd++;
            }
        }
        
    }
}