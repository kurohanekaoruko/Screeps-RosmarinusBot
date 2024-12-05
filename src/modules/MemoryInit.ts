export const MemoryInit = {
    init: () => {
        const BotMemory =  global.BotMem();
        if(!BotMemory['rooms']) BotMemory['rooms'] = {};
        if(!BotMemory['structures']) BotMemory['structures'] = {};
        if(!BotMemory['layout']) BotMemory['layout'] = {};
        if(!BotMemory['outmine']) BotMemory['outmine'] = {};
        if(!BotMemory['autoMarket']) BotMemory['autoMarket'] = {};
        if(!BotMemory['autoSend']) BotMemory['autoSend'] = {};
        if(!BotMemory['autoLab']) BotMemory['autoLab'] = {};
        if(!BotMemory['autoFactory']) BotMemory['autoFactory'] = {};
        
    }
}
