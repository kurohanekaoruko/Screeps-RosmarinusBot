import { RoleData } from '@/constant/CreepConstant';
import { sayConstant, attackSayConstant } from '@/constant/sayConstant';

export default class CreepRun extends Creep {
    run() {
        const role = this.memory.role;
        if(!this.memory.cache) { this.memory.cache = {} };
        const roledata = RoleData[role]
        if(!roledata) return;

        // 根据固定优先级行动
        if(roledata.work) {
            const func = roledata.work;
            if (func.prepare && !this.memory.ready){
                this.memory.ready = func.prepare(this);
            }

            let stateChange = false;
            if (this.memory.working)
                 stateChange = func.target(this);
            else stateChange = func.source(this);

            if (stateChange) {
                this.memory.working = !this.memory.working;
                this.memory.cache = {}; // 清空临时缓存
            }
            return true;
        }

        // 根据接取任务内容行动
        else if(roledata.mission) {
            return roledata.mission(this);
        }

        // 根据接收命令行动
        else if(roledata.action) {
            return roledata.action(this);
        }

        return false;
    }

    randomSay() {
        if (this.memory.sayText && this.memory.sayText.length > 0) {
            const text = this.memory.sayText.shift();
            if(text) this.say(text, true);
            return;
        }

        if (Math.random() > 0.008) return;
        this.memory.sayText = [];

        let text = [];
        if (this.room.my || !this.room.controller || !this.room.controller.owner ||
            Memory['whitelist']?.includes(this.room.controller.owner.username)) {
            text = sayConstant[Math.floor(Math.random() * sayConstant.length)];
        } else {
            text = attackSayConstant[Math.floor(Math.random() * sayConstant.length)];
        }

        if(!text) return;

        if(typeof text === "string") {
            this.say(text, true);
        } else {
            text.forEach((t:string) => {
                this.memory.sayText.push(t)
            })
            this.memory.sayText.push('');
        }
    }

}