
export default {
    BotMem(...args: any[]): BotMemory {
        let memory = Memory[global.BOT_NAME];
        if(!memory) {
            Memory[global.BOT_NAME] = {};
            memory = Memory[global.BOT_NAME];
        }
        for(const arg of args) {
            memory = memory[arg];
            if(!memory) return null;
        }
        return memory;
    },
    removeBotMem(...args: any[]): OK | Error {
        let memory = Memory[global.BOT_NAME];
        for(let i = 0; i < args.length - 1; i++) {
            memory = memory[args[i]];
            if(!memory) return Error("Memory not found");
        }
        delete memory[args[args.length - 1]];
        return OK;
    }
}