export default class PowerCreepRun extends PowerCreep {
    run() {
        if(!this.room) return;
        const name = this.name;

        const flag = Game.flags[`${name}-move`];
        if(flag && !this.pos.inRangeTo(flag, 0)) {
            this.Generate_OPS();
            this.moveTo(Game.flags[`${name}-move`], {visualizePathStyle: {stroke: '#ff0000'}});
            return;
        }

        // 房间开启power
        if(this.PowerEnabled()) return;
        // 生成ops
        if(this.Generate_OPS())  return;
        // 转移ops
        if(this.transferOPS())  return;
        // 续命
        if(this.ToRenew()) return;

        const role = name.match(/(\w+)-\d+/)[1];

        PowerCreepAction[role](this);
    }
}

const PowerCreepAction = {
    'F': function(pc: PowerCreep) {
        if(pc.transferPower())  return;      // 填充power
        if(pc.withdrawOPS())  return;      // 取出ops
        if(pc.Operate_Factory())  return;    // 操作工厂
    },
    'O': function(pc: PowerCreep) {
        if(pc.withdrawOPS())  return;      // 取出ops
        if(pc.Regen_Source())  return;  // 生成能量
        if(pc.Operate_Power())  return;  // 提高Power处理速率
        if(pc.Operate_Extension())  return;  // 填充扩展
        if(pc.Operate_Spawn())  return;        // 加速spawn
    },
}
