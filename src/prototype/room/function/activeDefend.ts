export default class ActiveDefend extends Room {
    activeDefend() {
        // 关于主动防御的检查
        if (Game.time % 20) return;
        let hostiles = this.find(FIND_HOSTILE_CREEPS, {
            filter: hostile => 
                !Memory['whitelist'].includes(hostile.owner.username) &&
                hostile.owner.username != 'Source Keeper' &&
                hostile.owner.username != 'Invader' &&
                (hostile.getActiveBodyparts(ATTACK) > 0 || 
                hostile.getActiveBodyparts(RANGED_ATTACK) > 0 ||
                hostile.getActiveBodyparts(HEAL) > 0 ||
                hostile.getActiveBodyparts(WORK) > 0)
        });
        if (hostiles.length > 0) {
            if(!global.Hostiles) global.Hostiles = {};
            global.Hostiles[this.name] = hostiles.map(hostile => hostile.id);
            this.memory.defend = true;    // 进入防御模式
            const doubleDefender = Object.values(Game.creeps)
                    .filter((creep) => creep.memory.role == 'defend-2Attack' && creep.memory.targetRoom == this.name);
            const doubleHeal = Object.values(Game.creeps)
                    .filter((creep) => creep.memory.role == 'defend-2Heal' && creep.memory.targetRoom == this.name);
            const queuenum = global.SpawnMissionNum[this.name]
            if(doubleDefender.length + (queuenum?.['defend-2Attack']||0) < 1) {
                this.SpawnMissionAdd('', [], -1, 'defend-2Attack', {squad: 'defender', targetRoom: this.name} as any)
            }
            if(doubleHeal.length + (queuenum?.['defend-2Heal']||0) < 1) {
                this.SpawnMissionAdd('', [], -1, 'defend-2Heal', {squad: 'defender', targetRoom: this.name} as any)
            }
        }
        else {
            if(!global.Hostiles) global.Hostiles = {};
            global.Hostiles[this.name] = [];
            this.memory.defend = false;   // 离开防御模式
        }
    }
}