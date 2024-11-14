export const MemoryInit = {
    init: () => {
        const BOT_NAME = global.BOT_NAME;
        if(!Memory[BOT_NAME]) Memory[BOT_NAME] = {};
        if(!Memory[BOT_NAME].rooms) Memory[BOT_NAME].rooms = {};
        if(!Memory[BOT_NAME].autoMarket) Memory[BOT_NAME].autoMarket = {};
        if(!Memory[BOT_NAME].autoManage) Memory[BOT_NAME].autoManage = {};
        if(!Memory[BOT_NAME].autoFactory) Memory[BOT_NAME].autoFactory = {};
    }
}
