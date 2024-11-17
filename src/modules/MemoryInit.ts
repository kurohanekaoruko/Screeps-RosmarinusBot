export const MemoryInit = {
    init: () => {
        const BotMemory =  global.BotMem() as BotMemory;
        if(!BotMemory.rooms) BotMemory.rooms = {};
        if(!BotMemory.structures) BotMemory.structures = {};
        if(!BotMemory.layoutMemory) BotMemory.layoutMemory = {};
        if(!BotMemory.autoMarket) BotMemory.autoMarket = {};
        if(!BotMemory.autoSend) BotMemory.autoSend = {};
    }
}
