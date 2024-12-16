// 基础与杂项
export default {
    log(text: string, ...args: any[]): OK | Error {
        if (text[0] == '[') {
            console.log(`[${global.BOT_NAME}]${text}`, ...args);
        } else {
            console.log(`[${global.BOT_NAME}] ${text}`, ...args);
        }
        return OK;
    },
    whitelist: {
        add(id: string): OK | Error {
            if(!Memory['whitelist']) Memory['whitelist'] = [];
            if(Memory['whitelist'].includes(id)) return Error("白名单中已存在, 无法添加");
            Memory['whitelist'].push(id);
            return OK;
        },
        remove(id: string): OK | Error {
            if(!Memory['whitelist']) return Error("白名单不存在");
            if(!Memory['whitelist'].includes(id)) return Error("白名单中不存在, 无法移除");
            Memory['whitelist'].splice(Memory['whitelist'].indexOf(id), 1);
            return OK;
        },
        show(): string[] {
            return Memory['whitelist'] || [];
        }
    },
    GenPixel() {
        Memory['GenPixel'] = !Memory['GenPixel'];
        console.log(`搓Pixel功能已${Memory['GenPixel'] ? '开启' : '关闭'}`);
        return OK;
    },
    showRoomRes() {
        return global.HelperRoomResource.showRoomRes();
    },
    showAllRes() {
        return global.HelperRoomResource.showAllRes();   
    },
}