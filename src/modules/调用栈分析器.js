/**
 *
 * @Author       : MiHack
 * @Date         : 2021-05-02
 * @Description  : CPU调用栈分析工具
 *                 感谢 @MiHack [W49S15] J̶S̶ TS Yes! 提供帮助，完善 html的css 部分
 *                 上面这位大佬重写了ts版本和js版本
 *                 但是生成html的时候，上面的cpu占用超过 100 ，我这个版本占用理论上不会超过5（除非你设置的有问题）
 * @Document     : 使用指南：
                  调用栈分析器

 为了更好的分析代码效率和优化效率，开发了这个调用栈信息耗时的工具
 该工具比较占用cpu 建议上线后关闭此功能 只要 1.挂载 不生效，就没性能影响

 如果包括全部代码和游戏基础的类，性能消耗除去 hard 部分的，在官服测试
 性能消耗比约为1.4-1.5（ 测试 9 hard 19 代码逻辑，加了插件约为24 结果为 14/9 的比例
 如果少挂载一些相对底层的方法，性能会有较大提升



 使用方式

 1.挂载
 module.exports.loop=require("这个js").warpLoop(main); // main就是主函数的loop
 // module.exports.loop=main;

 2.修改挂载
 修改挂载看下面挂载

 3.修改变量
 打印的性能消耗相当于 saveSum/skipTick/10 个cpu（渣代码和渣电脑测试的时候是这样)
 saveSum:1500, // 保存的帧数
 skipTick:10, // 保存的帧数最小单位（n tick存一次）

 4.打印方式
 require("这个js").print()


 挂载参数说明

 挂载的地方
 function Mount //  挂载函数
 function runtimeMount // 没办法挂在prototype时候用Mount


 挂载方式:
 ---单例模式
 registerAnalysis(单例模式,"名称");  支持递归挂载 （对象种包含对象)
 样例:
 let entity=
 {
    randomGet:function (array) {
        return array[Math.floor(array.length*Math.random())]
    },
    entity2:{
        "randomGet2":function (array) {
            return array[Math.floor(array.length*Math.random())]
        },
     }
  }
 registerAnalysis(entity,"entity"); //里面的 randomGet randomGet2 都会记录性能


 ---类对象
 pureFunctionsToWarp 只有cpu计算的,大消耗的
 hardFunctionsToWarp 有固定消耗的
 {name: 'PathFinder.search', parent: PathFinder, val: PathFinder.search},
 {name: 'RoomPosition.findClosestByPath', parent: RoomPosition.prototype, val: RoomPosition.prototype.findClosestByPath},





 打印参数说明：
 total:0, // 全部 cpu
 hardLess:0, // total - hard
 pure:0, // total - child node total 纯当前函数消耗的cpu
 time:0, // 调用次数
 hard:0, // 包含 0.2 cpu 的
 hardOK:0, // 0.2 cpu 成功的调用次数



 更新日志
 v1.0   2020-11-10
 支持无限级树
 已经将大部分逻辑移动到本地运行
 支持多帧同步记录
 v1.1   2020-11-11
 更新了支持原游戏基本对象的修改和测试
 更新了算法支持轮子哥的 移动对穿模块
 修改了硬函数计数累加方式从原来的全部时间 变成0.2cpu
 新增复制 dom 到剪切板，相当于直接下载
 v1.2   2020-11-15
 修改了 空格为 &nbsp; 避免存储下来的html有格式问题
 修改默认的算法
 v1.3  2021-05-02
 添加了Memory初始号的耗时统计
 感谢 @MiHack [W49S15] J̶S̶ TS Yes! 大佬大力支持，提供了css
 改进了html 使得html看起来更美观
 将代码加入了time隔离开大部分函数，防止一个页面有两个html点了上面的改了下面的
 将空格改为 &nbsp; 使得正常显示

 */















// loop的名字
let loopName='loop';

// 硬消耗的函数集合
let hardFunctionsToWarp = [
    {name: 'Game.notify', parent: Game, val: Game.notify},
    {name: 'Game.market.cancelOrder', parent: Game.market, val: Game.market.cancelOrder},
    {name: 'Game.market.changeOrderPrice', parent: Game.market, val: Game.market.changeOrderPrice},
    {name: 'Game.market.createOrder', parent: Game.market, val: Game.market.createOrder},
    {name: 'Game.market.deal', parent: Game.market, val: Game.market.deal},
    {name: 'Game.market.extendOrder', parent: Game.market, val: Game.market.extendOrder},
    {name: 'ConstructionSite.remove', parent: ConstructionSite.prototype, val: ConstructionSite.prototype.remove},
    {name: 'Creep.attack', parent: Creep.prototype, val: Creep.prototype.attack},
    {name: 'Creep.attackController', parent: Creep.prototype, val: Creep.prototype.attackController},
    {name: 'Creep.build', parent: Creep.prototype, val: Creep.prototype.build},
    {name: 'Creep.claimController', parent: Creep.prototype, val: Creep.prototype.claimController},
    {name: 'Creep.dismantle', parent: Creep.prototype, val: Creep.prototype.dismantle},
    {name: 'Creep.drop', parent: Creep.prototype, val: Creep.prototype.drop},
    {name: 'Creep.generateSafeMode', parent: Creep.prototype, val: Creep.prototype.generateSafeMode},
    {name: 'Creep.harvest', parent: Creep.prototype, val: Creep.prototype.harvest},
    {name: 'Creep.heal', parent: Creep.prototype, val: Creep.prototype.heal},
    {name: 'Creep.moveTo', parent: Creep.prototype, val: Creep.prototype.moveTo},
    {name: 'Creep.move', parent: Creep.prototype, val: Creep.prototype.move},
    {name: 'Creep.notifyWhenAttacked', parent: Creep.prototype, val: Creep.prototype.notifyWhenAttacked},
    {name: 'Creep.pickup', parent: Creep.prototype, val: Creep.prototype.pickup},
    {name: 'Creep.rangedAttack', parent: Creep.prototype, val: Creep.prototype.rangedAttack},
    {name: 'Creep.rangedHeal', parent: Creep.prototype, val: Creep.prototype.rangedHeal},
    {name: 'Creep.rangedMassAttack', parent: Creep.prototype, val: Creep.prototype.rangedMassAttack},
    {name: 'Creep.repair', parent: Creep.prototype, val: Creep.prototype.repair},
    {name: 'Creep.reserveController', parent: Creep.prototype, val: Creep.prototype.reserveController},
    {name: 'Creep.signController', parent: Creep.prototype, val: Creep.prototype.signController},
    {name: 'Creep.suicide', parent: Creep.prototype, val: Creep.prototype.suicide},
    {name: 'Creep.transfer', parent: Creep.prototype, val: Creep.prototype.transfer},
    {name: 'Creep.upgradeController', parent: Creep.prototype, val: Creep.prototype.upgradeController},
    {name: 'Creep.withdraw', parent: Creep.prototype, val: Creep.prototype.withdraw},
    {name: 'Flag.remove', parent: Flag.prototype, val: Flag.prototype.remove},
    {name: 'Flag.setColor', parent: Flag.prototype, val: Flag.prototype.setColor},
    {name: 'Flag.setPosition', parent: Flag.prototype, val: Flag.prototype.setPosition},
    {name: 'PowerCreep.delete', parent: PowerCreep.prototype, val: PowerCreep.prototype.delete},
    {name: 'PowerCreep.drop', parent: PowerCreep.prototype, val: PowerCreep.prototype.drop},
    {name: 'PowerCreep.enableRoom', parent: PowerCreep.prototype, val: PowerCreep.prototype.enableRoom},
    {name: 'PowerCreep.move', parent: PowerCreep.prototype, val: PowerCreep.prototype.move},
    {name: 'PowerCreep.moveTo', parent: PowerCreep.prototype, val: PowerCreep.prototype.moveTo},
    {name: 'PowerCreep.notifyWhenAttacked', parent: PowerCreep.prototype, val: PowerCreep.prototype.notifyWhenAttacked},
    {name: 'PowerCreep.pickup', parent: PowerCreep.prototype, val: PowerCreep.prototype.pickup},
    {name: 'PowerCreep.renew', parent: PowerCreep.prototype, val: PowerCreep.prototype.renew},
    {name: 'PowerCreep.spawn', parent: PowerCreep.prototype, val: PowerCreep.prototype.spawn},
    {name: 'PowerCreep.suicide', parent: PowerCreep.prototype, val: PowerCreep.prototype.suicide},
    {name: 'PowerCreep.transfer', parent: PowerCreep.prototype, val: PowerCreep.prototype.transfer},
    {name: 'PowerCreep.upgrade', parent: PowerCreep.prototype, val: PowerCreep.prototype.upgrade},
    {name: 'PowerCreep.usePower', parent: PowerCreep.prototype, val: PowerCreep.prototype.usePower},
    {name: 'PowerCreep.withdraw', parent: PowerCreep.prototype, val: PowerCreep.prototype.withdraw},
    {name: 'Room.createConstructionSite', parent: Room.prototype, val: Room.prototype.createConstructionSite},
    {name: 'Room.createFlag', parent: Room.prototype, val: Room.prototype.createFlag},
    {name: 'Structure.destroy', parent: Structure.prototype, val: Structure.prototype.destroy},
    {name: 'Structure.notifyWhenAttacked', parent: Structure.prototype, val: Structure.prototype.notifyWhenAttacked},
    {name: 'StructureController.activateSafeMode', parent: StructureController.prototype, val: StructureController.prototype.activateSafeMode},
    {name: 'StructureController.unclaim', parent: StructureController.prototype, val: StructureController.prototype.unclaim},
    {name: 'StructureFactory.produce', parent: StructureFactory.prototype, val: StructureFactory.prototype.produce},
    {name: 'StructureLab.boostCreep', parent: StructureLab.prototype, val: StructureLab.prototype.boostCreep},
    {name: 'StructureLab.runReaction', parent: StructureLab.prototype, val: StructureLab.prototype.runReaction},
    {name: 'StructureLab.unboostCreep', parent: StructureLab.prototype, val: StructureLab.prototype.unboostCreep},
    {name: 'StructureLink.transferEnergy', parent: StructureLink.prototype, val: StructureLink.prototype.transferEnergy},
    {name: 'StructureNuker.launchNuke', parent: StructureNuker.prototype, val: StructureNuker.prototype.launchNuke},
    {name: 'StructureObserver.observeRoom', parent: StructureObserver.prototype, val: StructureObserver.prototype.observeRoom},
    {name: 'StructurePowerSpawn.processPower', parent: StructurePowerSpawn.prototype, val: StructurePowerSpawn.prototype.processPower},
    {name: 'StructureRampart.setPublic', parent: StructureRampart.prototype, val: StructureRampart.prototype.setPublic},
    {name: 'StructureSpawn.spawnCreep', parent: StructureSpawn.prototype, val: StructureSpawn.prototype.spawnCreep},
    {name: 'StructureSpawn.recycleCreep', parent: StructureSpawn.prototype, val: StructureSpawn.prototype.recycleCreep},
    {name: 'StructureSpawn.renewCreep', parent: StructureSpawn.prototype, val: StructureSpawn.prototype.renewCreep},
    {name: 'Spawning.cancel', parent: StructureSpawn.Spawning.prototype, val: StructureSpawn.Spawning.prototype.cancel},
    {name: 'Spawning.setDirections', parent: StructureSpawn.Spawning.prototype, val: StructureSpawn.Spawning.prototype.setDirections},
    {name: 'StructureTerminal.send', parent: StructureTerminal.prototype, val: StructureTerminal.prototype.send},
    {name: 'StructureTower.attack', parent: StructureTower.prototype, val: StructureTower.prototype.attack},
    {name: 'StructureTower.heal', parent: StructureTower.prototype, val: StructureTower.prototype.heal},
    {name: 'StructureTower.repair', parent: StructureTower.prototype, val: StructureTower.prototype.repair},
];

// 函数名映射
let functionMap={}
let functionMapReverse={}

// 大消耗的非硬函数
let pureFunctionsToWarp = [
    {name: 'PathFinder.search', parent: PathFinder, val: PathFinder.search},
    {name: 'RoomPosition.findClosestByPath', parent: RoomPosition.prototype, val: RoomPosition.prototype.findClosestByPath},
    {name: 'RoomPosition.findClosestByRange', parent: RoomPosition.prototype, val: RoomPosition.prototype.findClosestByRange},
    {name: 'RoomPosition.findPathTo', parent: RoomPosition.prototype, val: RoomPosition.prototype.findPathTo},
    {name: 'RoomPosition.find', parent: RoomPosition.prototype, val: RoomPosition.prototype.find},
    {name: 'RoomPosition.look', parent: RoomPosition.prototype, val: RoomPosition.prototype.look},
    {name: 'Room.lookAtArea', parent: Room.prototype, val: Room.prototype.lookAtArea},
    {name: 'Room.lookAt', parent: Room.prototype, val: Room.prototype.lookAt},
    {name: 'Room.findPath', parent: Room.prototype, val: Room.prototype.findPath},
    {name: 'Room.findExitTo', parent: Room.prototype, val: Room.prototype.findExitTo},
    {name: 'Game.map.findRoute', parent: Game.map, val: Game.map.findRoute},
    {name: 'Game.map.findExit', parent: Game.map, val: Game.map.findExit},
    {name: 'Game.map.getRoomStatus', parent: Game.map, val: Game.map.getRoomStatus},
    {name: 'Game.market.getAllOrders', parent: Game.market, val: Game.market.getAllOrders}
]
//
// // 运行时 mount
// let runTimePureFunctionsToWarp = [
// ]


/*****************************************************************************************************/


// 当前用的函数栈
let funcStack=[loopName];

// 多次函数栈
let funcMultiStack={};

// 当前tick 函数使用的时间
let currentTick={};

const colours = {
    纯红: '#FF0000',
    猩红: '#DC143C',
    桃红: '#f47983',
    浅粉: '#FFA0AB',

    橙色: '#FFA500',
    橘红: '#FF4500',

    暗黄: '#DAA520',
    金色: '#FFD700',
    纯黄: '#FFFF00',
    浅黄: '#FFFFA0',

    纯绿: '#008000',
    草绿: '#40de5a',
    亮绿: '#22FF22',
    黄绿: '#ADFF2F',

    暗青: '#008B8B',
    青色: '#00e09e',
    青碧: '#7FFFD4',
    天蓝: "#00b0f0",

    亮蓝: '#87CEFA',
    宝蓝: '#4169E1',

    蓝紫: '#8A2BE2',
    纯紫: '#B000B0',
    亮紫: '#FF00FF',

    茶色: '#D2B48C',
    蜜白: '#F0FFF0',
    墨灰: '#758a99',
};

let color2 = [
    "#c00000",
    "#ff0000",
    "#ffc000",
    "#ffff00",
    "#92d050",
    "#00b050",
    "#00b0f0",
    "#ff0374",
];

let color=_.values(colours).concat(color2).sort((a,b)=>{
    return -a[a.length-4]+b[b.length-4]
});

let indexFunc=0;
function mapFunc(name){
    if(functionMap[name]===undefined){
        functionMap[name]=indexFunc;
        functionMapReverse[indexFunc++]=name;
    }
    return functionMap[name];
}

/**
 * 生成对象实体
 * @param entity
 */
function getTickBase(entity) {
    if(entity)return entity;
    return {
        merge:function(another){
            another=getTickBase(another);
            for(let k in this){
                another[k]=another[k]+this[k]
            }
            return another
        },
        add:function(cpu,isHard){
            // if(cpu>0.15&&isHard) this.hard+=cpu;
            if(cpu>0.15&&isHard) this.hard+=0.2;
            this.total+=cpu;
            this.time+=1;
            if(cpu>0.15&&isHard)
                this.hardOK+=1;
        },
        total:0,
        hardLess:0, // total - hard
        pure:0, // total - child node total
        time:0,
        hard:0, // 0.2 cpu
        hardOK:0, // 0.2 cpu success times
    }
}


function warpAction(name, parent, action, hard){
    let actionName = name.split('.').pop();
    if(actionName.startsWith("$"))return;
    if(parent["$_$"+actionName])return;
    name=mapFunc(name);

    function warppedAction() {
        const start = Game.cpu.getUsed();
        funcStack.push(name);
        let currentName=funcStack.join("->");

        let code = action.apply(this, arguments);

        const end = Game.cpu.getUsed();

        currentTick[currentName]=getTickBase(currentTick[currentName])
        currentTick[currentName].add(end - start,hard&&code==OK);
        funcStack.pop();

        return code;
    }

    parent['$_$' + actionName] = action;
    parent[actionName] = warppedAction;
}


/**
 *
 * @param obj 单例模式的对象
 * @param name 对象的别名（最好一样）
 */
function registerAnalysis(obj,name,deep) {// deep 限制递归，避免爆栈
    if(deep===undefined){
        deep=5;
        name=mapFunc(name);
    }
    for(let key in obj){
        if(key.startsWith("$"))continue;
        if(obj["$_$"+key])continue;
        try{
            if(obj[key] instanceof Function){
                let items = name+"."+mapFunc(key);
                let action = obj[key];
                function warppedAction() {
                    let err;
                    let out;
                    funcStack.push(items);
                    let currentName=funcStack.join("->");
                    const start = Game.cpu.getUsed();
                    try {// 保证报错了能正确统计
                        out = action.apply(this, arguments);
                    }catch (e) {
                        err=e;// 将错误带出来
                    }finally {
                        const end =  Game.cpu.getUsed();
                        currentTick[currentName]=getTickBase(currentTick[currentName]);
                        currentTick[currentName].add(end - start);
                        // console.log(currentName+" "+det);//打印栈信息
                        funcStack.pop();
                    }
                    if(err)throw err;
                    return out;
                }
                obj["$_$"+key]=obj[key];
                obj[key]=warppedAction
            }else if(obj[key] instanceof Object){
                if(deep>0){
                    registerAnalysis(obj[key],name+"."+mapFunc(key),deep-1)
                }
            }
        }catch (e) {
             // console.log(key,typeof obj[key]);
        }
    }
}

// function runtimeMount(){
//     runTimePureFunctionsToWarp.forEach(({name, parent, val}) => warpAction(name, parent, val,true));
// }

MemoryInit = {
    init:function (){
        return Memory
    }
}

function mount(){
    loopName=mapFunc(loopName);
    registerAnalysis(MemoryInit,"Memory");
    hardFunctionsToWarp.forEach(({name, parent, val}) => warpAction(name, parent, val,true));
    // pureFunctionsToWarp.forEach(({name, parent, val}) => warpAction(name, parent, val,false));


    // registerAnalysis(main,"main");
    // registerAnalysis(ManagerCreeps,"ManagerCreeps");
    // registerAnalysis(ManagerFlags,"ManagerFlags");
    // registerAnalysis(ManagerRooms,"ManagerRooms");
    // registerAnalysis(ManagerCrossShard,"ManagerCrossShard");
    // registerAnalysis(ManagerMissions,"ManagerMissions");
    //
    // registerAnalysis(StationHive,"StationHive");
    // registerAnalysis(StationSources,"StationSources");
    // registerAnalysis(StationCarry,"StationStore");
    // registerAnalysis(StationUpgrade,"StationUpgrade");
    // registerAnalysis(StationWork,"StationOther");
    // registerAnalysis(StationTower,"stationTower");
    // registerAnalysis(StationTower,"StationMineral");
    // registerAnalysis(StationLab,"StationLab");
    // registerAnalysis(StationDefense,"StationDefense");
    //
    //
    // registerAnalysis(HelperVisual,"HelperVisual");
    // registerAnalysis(UtilsTask,"UtilsTask");
    //
    // registerAnalysis(ManagerPlanner,"ManagerPlanner");
    // registerAnalysis(StrategyLowLevel,"StrategyLowLevel");
    // registerAnalysis(StrategyHighLevel,"StrategyHighLevel");
    // registerAnalysis(StrategyAtkl2,"StrategyAtkl2");
    // registerAnalysis(StrategyOuterHarvest,"StrategyOuterHarvest");
    // registerAnalysis(StrategyClaim,"StrategyClaim");
    // registerAnalysis(StrategyScouter,"StrategyScouter");
    // registerAnalysis(StrategyResourceBalance,"StrategyResourceBalance");
    // registerAnalysis(StrategyPillage,"StrategyPillage");



    registerAnalysis(Game.market,"Game.market");
    registerAnalysis(RoomPosition.prototype,"Room");
    registerAnalysis(Structure.prototype,"Structure");
    registerAnalysis(Room.prototype,"Room");
    registerAnalysis(Creep.prototype,"Creep");
    registerAnalysis(ConstructionSite.prototype,"ConstructionSite");
    registerAnalysis(StructureFactory.prototype,"StructureFactory");
    registerAnalysis(StructureLab.prototype,"StructureLab");
    registerAnalysis(StructureLink.prototype,"StructureLink");
    registerAnalysis(StructureNuker.prototype,"StructureNuker");
    registerAnalysis(StructureObserver.prototype,"StructureObserver");
    registerAnalysis(StructureSpawn.prototype,"StructureSpawn");
    registerAnalysis(StructureTerminal.prototype,"StructureTerminal");
    registerAnalysis(StructureTower.prototype,"StructureTower");



    // registerAnalysis(Object.getPrototypeOf(new RoomArray()),"RoomArray");
}

/**
 * 网页端代码，请勿加 // 注释 除了 /*  * /
 */
function print(skipTick,funcMultiStack){
return `<div id="A${Game.time}">
<script type="text/javascript" src="https://screeps.com/a/vendor/lodash/lodash.js"/>
<div id="${Game.time}" style="background-color:#2b2b2b;font-family: Monaco, Menlo, 'Ubuntu Mono', Consolas, source-code-pro, monospace;color: #ccc;">hide</div>
<style>
    #table${Game.time} {
        width: 95vw;
        color: #eeeeee;
        font-family: Consolas;
        background-color: #2b2b2b;
        border-collapse: collapse;
    }
    #table${Game.time} tr {
        border: 1px solid #0b0b0b;
    }
    #table${Game.time} tr:hover {
        border-bottom: 1px solid red;
    }
    #table${Game.time} tr:nth-of-type(even) {
        background: #3b3b3b;
    }
</style>
<script type="text/javascript">"";
let funcMultiStack=${JSON.stringify(funcMultiStack)};
let functionMapReverse=${JSON.stringify(functionMapReverse)};
let color=${JSON.stringify(color)};
let current={};

let tickTimes=0;

function getTickBase(entity) {
    if(entity)return entity;
    return {
        total:0,
        hardLess:0, 
        pure:0,
        time:0,
        hard:0,
        hardOK:0, 
    }
}

let merge=function(thisOne,another){
    another=getTickBase(another);
    for(let k in thisOne){
        another[k]=another[k]+thisOne[k]
    }
    return another
};

for(let t in funcMultiStack){
    tickTimes++;
    _.keys(funcMultiStack[t]).forEach(e=>current[e]=merge(funcMultiStack[t][e],current[e]))
}
tickTimes*=${skipTick};

function copyText(){ 
    let tag = document.createElement('input');
    tag.setAttribute('id', 'cp_hgz_input');
    tag.value = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'+document.getElementById('A${Game.time}').innerHTML;
    document.getElementsByTagName('body')[0].appendChild(tag);
    document.getElementById('cp_hgz_input').select();
    document.execCommand('copy');
    document.getElementById('cp_hgz_input').remove();
}

let head=
    "<table  id=\\"table${Game.time}\\" border=\\"0\\" style='width: 95vw'>"
    +"<tr><td>"
    +"统计(AVG) "+tickTimes+" Tick 的数据 当前 Tick 为 ${Game.time}  "+'<span onclick="copyText()">[复制HTML到剪切板]</span>'+"</td><td>"
    +"total</td><td>"
    +"hardLs</td><td>"
    +"pure</td><td>"
    +"tickTimes</td><td>"
    +"hard</td><td>"
    +"hardOK</td><td>"
    +"</td></tr>";
let tail="</table>";


function buildTree(currentTick){
    let tree={};
    let build= function(t,ls){
        let element = ls[0];
        if(ls.length==1){
            t[element]=t[element];
        }else{
            ls.shift(); 
            t[element]=t[element]||{};
            build(t[element],ls)
        }
    };
    _.keys(currentTick).forEach(e=>build(tree,e.split("->")));
    let analysisPure=function (tree,name) { 
        let pure=0;
        let hardLess=0;
        for(let n in tree){
            let fullName = name?name+"->"+n:n;
            pure-=currentTick[fullName].total;
            hardLess-=currentTick[fullName].hard;
            let child=analysisPure(tree[n],fullName);
            hardLess+=child
        }
        if(name){
            currentTick[name].hardLess=currentTick[name].total+hardLess-currentTick[name].hard;
            currentTick[name].pure=currentTick[name].total+pure-currentTick[name].hard;
        }
        return hardLess
    };
    analysisPure(tree);
    return tree;
}

function show(number) {
    if(!number||number<0)
        return "";
    let org=number;
    number=(number/tickTimes).toFixed(3).replace(/[.]?0+$/g,"");
    if(org!=parseInt(org)){
        if(number>10) return '<span style="color:#FF0000">'+number+"</span>";
        if(number>3) return '<span style="color:#F44336">'+number+"</span>";
        if(number>1) return '<span style="color:#EF9A9A">'+number+"</span>";
        if(number>0.1) return '<span style="color:#FFCDD2">'+number+"</span>";
        return number
    }
    if(number>10) return '<span style="color:#FF0000">'+number+"</span>";
    if(number>3) return '<span style="color:#FFA0AB">'+number+"</span>";
    return number
}

let update${Game.time};

let closeMap={};

function change${Game.time}(fullName){
    closeMap[fullName]=!closeMap[fullName];
    update${Game.time}();
}

function getFuncTree${Game.time}(currentTick,tree,name,head="",deep=0){
    if(!tree)tree=buildTree(currentTick);
    let out="";
    let keys = _.keys(tree).sort((a,b)=>currentTick[name?name+"->"+b:b].total-currentTick[name?name+"->"+a:a].total);
    let last = _.last(keys);
    for(let n of keys){
        let fullName = name?name+"->"+n:n;
        let h=head+(name?(last==n?"&nbsp;└─":"&nbsp;├─"):"");
        if(tree[n])h+=('<span onclick="change${Game.time}('+"'"+fullName+"'"+')">['+(closeMap[fullName]?"+":"-")+']</span>');
        else h+="[_]";
        let realName=n.split(".").map(e=>functionMapReverse[e]).join(".");
        out+=(
            "<tr><td>"
            +h+'<span style="color:'+color[deep%color.length]+'"> '+realName+"</span></td><td>"
            +show(currentTick[fullName].total)+"</td><td>"
            +show(currentTick[fullName].hardLess)+"</td><td>"
            +show(currentTick[fullName].pure)+"</td><td>"
            +show(currentTick[fullName].time)+"</td><td>"
            +show(currentTick[fullName].hard)+"</td><td>"
            +show(currentTick[fullName].hardOK)+"</td><td>"
            +"</tr>"
        );
        if(tree[n]&&!closeMap[fullName])out+=getFuncTree${Game.time}(currentTick,tree[n],fullName,head+(name?(last==n?"&nbsp;&nbsp;&nbsp;":"&nbsp;|&nbsp;"):""),deep+1);
    }
    return out
}

update${Game.time}=()=>{document.getElementById("${Game.time}").innerHTML=head+getFuncTree${Game.time}(current)+tail};
update${Game.time}();
"";</script></div>`.replace(/[\r\n]/g, "");

}

let startTime=Game.time;
let pro={
    saveSum:300, // 保存的帧数 ！！！不能在运行时修改
    skipTick:30, // 保存的帧数最小单位（n tick存一次）  ！！！不能在运行时修改
    print:()=>{pro.printAble=true;return "正在生成树状数据"},
    printAble:false,
    alwaysPrintAble:true,
    warpLoop:function(loop){
        mount();
        return function(){
            // runtimeMount();
            const start = Game.cpu.getUsed();
            funcStack=[loopName];
            let save = (Game.time-startTime)%pro.skipTick==0;
            if(_.keys(currentTick).length>0&&save){
                funcMultiStack[Game.time%pro.saveSum]=currentTick;
            }
            if(save&&pro.alwaysPrintAble&&_.size(funcMultiStack))pro.printAble=true;
            if(save)currentTick={};
            currentTick[loopName]=getTickBase(currentTick[loopName]);
            MemoryInit.init()
            loop();
            const end =  Game.cpu.getUsed();
            currentTick[loopName].add(end-start);

            if(pro.printAble){
                pro.printAble=false;
                const start = Game.cpu.getUsed();
                console.log(print(pro.skipTick,funcMultiStack));
                const end =  Game.cpu.getUsed();
                console.log("本次生成树状结构耗时:"+(end-start))
            }
        }
    }
};

module.exports = pro;