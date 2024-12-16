// @ts-nocheck

/**

特别感谢： @[E29N27|重构咕] CXuesong  提供技术支持

使用方法：
require 后，控制台输入：

usage method:
After require, the console enters:

HelperRoomResource.showRoomRes();
HelperRoomResource.showAllRes();

2. 显示后 鼠标放在资源上面会显示全部自己房间的资源
2. All resources will be displayed after the mouse is placed on the room

3. 点击房间 可以跳转到房间
3. Click the room to jump to the room

 */

/*

 如果不能用的请尝试加入这些函数(我不知道用到了哪些
 If it doesn't work, try adding these functions( I don't know what's used

 Array.prototype.flat= function(){return _.flatten(this)}
 Array.prototype.zip= function (another){return _.zip(this,another)};
 Array.prototype.contains= function (another){return _.includes(this,another)};
 Array.prototype.take= function (n){return _.take(this,n)};
 Array.prototype.head= function(){return _.head(this)};
 Array.prototype.last= function(){return _.last(this)};
 Array.prototype.without= function(...e){return _.without(this,...e)};
 Array.prototype.sum= function(...e){return _.sum(this,...e)};
 Array.prototype.toSet= function(){return new Set(this)};
 Array.prototype.toMap= function(){return this.reduce((map,entry)=>{map[entry[0]] = entry[1];return map},{})};
 Array.prototype.find= function(...e){return _.find(this,...e)};
 Array.prototype.maxBy= function(func){return this.reduce((ori, another)=>func(ori)>=func(another)?ori:another,this[0])};

 Array.prototype.log= function(){console.log(JSON.stringify(this));return this};

 */
global.RES_COLOR_MAP = {"empty":"rgba(0,0,0,0)","energy":"rgb(255,242,0)","battery":"rgb(255,242,0)","Z":"rgb(247, 212, 146)","L":"rgb(108, 240, 169)","U":"rgb(76, 167, 229)","K":"rgb(218, 107, 245)","X":"rgb(255, 192, 203)","G":"rgb(255,255,255)","zynthium_bar":"rgb(247, 212, 146)","lemergium_bar":"rgb(108, 240, 169)","utrium_bar":"rgb(76, 167, 229)","keanium_bar":"rgb(218, 107, 245)","purifier":"rgb(255, 192, 203)","ghodium_melt":"rgb(255,255,255)","power":"rgb(224,90,90)","ops":"rgb(224,90,90)","composite":"#ccc","crystal":"#ccc","liquid":"#ccc","device":"rgb(76, 167,229)","circuit":"rgb(76, 167,229)","microchip":"rgb(76, 167,229)","transistor":"rgb(76, 167,229)","switch":"rgb(76, 167,229)","wire":"rgb(76, 167,229)","silicon":"rgb(76, 167,229)","machine":"rgb(247,212,146)","hydraulics":"rgb(247,212,146)","frame":"rgb(247,212,146)","fixtures":"rgb(247,212,146)","tube":"rgb(247,212,146)","alloy":"rgb(247,212,146)","metal":"rgb(247,212,146)","essence":"rgb(218,107,245)","emanation":"rgb(218,107,245)","spirit":"rgb(218,107,245)","extract":"rgb(218,107,245)","concentrate":"rgb(218,107,245)","condensate":"rgb(218,107,245)","mist":"rgb(218,107,245)","organism":"rgb(108,240,169)","organoid":"rgb(108,240,169)","muscle":"rgb(108,240,169)","tissue":"rgb(108,240,169)","phlegm":"rgb(108,240,169)","cell":"rgb(108,240,169)","biomass":"rgb(108,240,169)","OH":"#ccc","ZK":"#ccc","UL":"#ccc","UH":"rgb(76, 167,229)","UH2O":"rgb(76, 167,229)","XUH2O":"rgb(76, 167,229)","UO":"rgb(76, 167,229)","UHO2":"rgb(76, 167,229)","XUHO2":"rgb(76, 167,229)","ZH":"rgb(247,212,146)","ZH2O":"rgb(247,212,146)","XZH2O":"rgb(247,212,146)","ZO":"rgb(247,212,146)","ZHO2":"rgb(247,212,146)","XZHO2":"rgb(247,212,146)","KH":"rgb(218,107,245)","KH2O":"rgb(218,107,245)","XKH2O":"rgb(218,107,245)","KO":"rgb(218,107,245)","KHO2":"rgb(218,107,245)","XKHO2":"rgb(218,107,245)","LH":"rgb(108,240,169)","LH2O":"rgb(108,240,169)","XLH2O":"rgb(108,240,169)","LO":"rgb(108,240,169)","LHO2":"rgb(108,240,169)","XLHO2":"rgb(108,240,169)","GH":"rgb(255,255,255)","GH2O":"rgb(255,255,255)","XGH2O":"rgb(255,255,255)","GO":"rgb(255,255,255)","GHO2":"rgb(255,255,255)","XGHO2":"rgb(255,255,255)","H":"#ccc","O":"#ccc","oxidant":"#ccc","reductant":"#ccc"};
global.RES_TREE = {"POWER资源":{"POWER资源":["power","ops"]},"基础资源":{"能量":["energy","battery"],"原矿":["U","L","K","Z","X","O","H","G"],"压缩":["utrium_bar","lemergium_bar","keanium_bar","zynthium_bar","purifier","oxidant","reductant","ghodium_melt"]},"商品资源":{"无色":["liquid","crystal","composite"],"蓝色":["silicon","wire","switch","transistor","microchip","circuit","device"],"黄色":["metal","alloy","tube","fixtures","frame","hydraulics","machine"],"紫色":["mist","condensate","concentrate","extract","spirit","emanation","essence"],"绿色":["biomass","cell","phlegm","tissue","muscle","organoid","organism"]},"LAB资源":{"蓝色":["UH","UH2O","XUH2O","UO","UHO2","XUHO2"],"黄色":["ZH","ZH2O","XZH2O","ZO","ZHO2","XZHO2"],"紫色":["KH","KH2O","XKH2O","KO","KHO2","XKHO2"],"绿色":["LH","LH2O","XLH2O","LO","LHO2","XLHO2"],"白色":["GH","GH2O","XGH2O","GO","GHO2","XGHO2"]},"empty":{"empty":["empty"]}};

global.roomResSvg=(res, allCnt,len)=>{
    let r = Object.entries(res).sort((a,b)=>b[1]-a[1])
    let left = 0;
    let svgs = r.map(e=>{
        if (e[0] == "empty") return ;
        let t = `<rect x="${left/allCnt*len}" width="${e[1]/allCnt*len}" height="8" fill="${RES_COLOR_MAP[e[0]]}"/>`
        left+=e[1];
        return t;
    }).join("")
    let exist = allCnt?`<rect width="500" height="10" fill="black"/>${svgs}</svg>`:"";
    return `<svg width="${len}px" height="8px"> ${exist} ${_.padLeft((left/allCnt*100).toFixed(1),4)}% ${_.padLeft((allCnt/1000000).toFixed(1),4)}M  `
}
global.roomResEcharts=()=>{
    // <div id="${divName}" style="height: 600px;width:600px;color:#000"/>
return `
<script>
function gotoRoom(roomName){window.location.href = window.location.href.substring(0,window.location.href.lastIndexOf("/")+1)+roomName;}
colorMap = ${JSON.stringify(RES_COLOR_MAP)};
eval($.ajax({url:"https://fastly.jsdelivr.net/npm/echarts@5/dist/echarts.min.js",async:false}).responseText);
function showRoomResEcharts(ori,roomName ,divName){
var bgColor = '#2b2b2b';
var chartDom = document.getElementById(divName);
var myChart = echarts.init(chartDom, 'dark');
var option;

colorMap["商品资源"] = "#ccc";
colorMap["LAB资源"] = "#ccc";
colorMap["基础资源"] = "#ccc";
colorMap["压缩"] = "#ccc";
colorMap["原矿"] = "#ccc";

var tree = ${JSON.stringify(RES_TREE)};

function buildTree(node){
    let arr = [];
    if(node[0]){
        for(let resType of node){
            arr.push({
                name: resType,
                value: ori[resType],
                itemStyle: {
                    color: colorMap[resType]
                },
            })
        }
    }else{
        for(let resType in node){
            let children = buildTree(node[resType]);
            if(children.length)
                arr.push({
                    name: resType,
                    itemStyle: {
                        color: colorMap[resType]?colorMap[resType]:children[0].itemStyle.color
                    },
                    children:children
                });
        }
    }
    return arr;
}
var data =buildTree(tree);
option = {
    title: {
        text: roomName
    },
    tooltip: {
    },
    series: {
        itemStyle: {
            borderColor: "#1b1b1b",
            borderWidth: 1
        },
        type: 'sunburst',
        data: data,
        radius: [0, '95%'],
        sort: null,
        emphasis: {
            focus: 'ancestor'
        },
    }
};


option.backgroundColor= bgColor;
myChart.setOption(option);
};
</script>
`
    .replace(/[\r\n]/g, "")
    // .replace("script>","c>")
}

function roomResTips(roomName,data){
let divName= "a-"+roomName+"-6g3y-NB-"+Game.time;
let divNameShow= "a-"+roomName+"-6g3y-NB-"+Game.time+"-";
return`
<t class="${divName}" onclick="gotoRoom('${roomName}')" style="color:#7c97ff" >[${roomName}]</t><script>
    (() => {
        const button = document.querySelector(".${divName}");
        let tip;
        button.addEventListener("pointerenter", () => {
            if(tip)return;
            tip = document.createElement("div");
            tip.style.backgroundColor = "rgba(43,43,43,1)"; 
            tip.style.border = "1px solid";
            tip.style.borderColor = "#ccc";
            tip.style.borderRadius = "5px";
            tip.style.position = "absolute";
            tip.style.zIndex=10;
            tip.style.color = "#ccc";
            tip.style.marginLeft = "0px";
            tip.innerHTML = '<div id="${divNameShow}" onclick="" style="height: 600px;width:600px;color:#000"/>';
            button.append(tip);
            showRoomResEcharts(${JSON.stringify(data)},"${roomName}","${divNameShow}");
            document.getElementById("${divNameShow}").onclick =function(e) {e.stopPropagation();return false;};
        });
        button.addEventListener("pointerleave", () => {tip && (tip.remove(), tip = undefined);});
    })();
</script>
`.replace(/[\r\n]/g, "");
// .replace("script>","c>")
//
}

function allResTips(text, tipStrArray, id, left){
    left = left-1;
    left*=100;
    let showCore = tipStrArray.map(e=>`<t onclick="goto('${e}')"> ${e} </t>`.replace(/[\\"]/g,'%')).join("<br>")
    let time = Game.time;
return `<t class="a${id}-a${time}">${text}</t><script>
    function goto(e){
        let roomName = e.split(":")[0].replace(/\\s+/g, "");
        window.location.href = window.location.href.substring(0,window.location.href.lastIndexOf("/")+1)+roomName;
    }(() => {
        const button = document.querySelector(".a${id}-a${time}");
        let tip;
        button.addEventListener("pointerenter", () => {
            tip = document.createElement("div");
            tip.style.backgroundColor = "rgba(43,43,43,1)"; 
            tip.style.border = "1px solid";
            tip.style.borderColor = "#ccc";
            tip.style.borderRadius = "5px";
            tip.style.position = "absolute";
            tip.style.zIndex=10;
            tip.style.color = "#ccc";
            tip.style.marginLeft = "${left}px";
            tip.width = "230px";
            tip.innerHTML = "${showCore}".replace(/[\\%]/g,'"'); button.append(tip);
        });
        button.addEventListener("pointerleave", () => {tip && (tip.remove(), tip = undefined);});
    })()
</script>
`.replace(/[\r\n]/g, "");
}
//alert(window.location.href.substr(0,window.location.href.lastIndexOf("/")+1)+roomName);
let pro = {

    getStorageTerminalRes (room){
        let store = {};
        if(room.storage)pro.addStore(store,room.storage.store)
        if(room.terminal)pro.addStore(store,room.terminal.store)
        // if(room.factory)pro.addStore(store,room.factory.store)
        return store
    },
    addStore:(store,b)=> {for(let v in b) if(b[v]>0)store[v]=(store[v]||0)+b[v];return store},
    showAllRes(){
        let time = Game.cpu.getUsed()

        let rooms = _.values(Game.rooms).filter(e=>e.controller&&e.controller.my&&(e.storage||e.terminal));
        let roomResAll = rooms.map(e=>[e.name,pro.getStorageTerminalRes(e)]).reduce((map,entry)=>{map[entry[0]] = entry[1];return map},{})


        let all = rooms.reduce((all, room)=> pro.addStore(all,roomResAll[room.name]),{});


        // StrategyMarket.showAllRes()
        let base = [RESOURCE_ENERGY,"U","L","K","Z","X","O","H","G"]
        let power = [RESOURCE_POWER,RESOURCE_OPS]
        // 压缩列表
        let bars = [RESOURCE_BATTERY,RESOURCE_UTRIUM_BAR,RESOURCE_LEMERGIUM_BAR,RESOURCE_KEANIUM_BAR,RESOURCE_ZYNTHIUM_BAR,RESOURCE_PURIFIER,RESOURCE_OXIDANT,RESOURCE_REDUCTANT,RESOURCE_GHODIUM_MELT]
        // 商品
        let c_grey =[RESOURCE_COMPOSITE,RESOURCE_CRYSTAL,RESOURCE_LIQUID]
        let c_blue = [RESOURCE_DEVICE,RESOURCE_CIRCUIT,RESOURCE_MICROCHIP,RESOURCE_TRANSISTOR,RESOURCE_SWITCH,RESOURCE_WIRE,RESOURCE_SILICON].reverse()
        let c_yellow=[RESOURCE_MACHINE,RESOURCE_HYDRAULICS,RESOURCE_FRAME,RESOURCE_FIXTURES,RESOURCE_TUBE,RESOURCE_ALLOY,RESOURCE_METAL].reverse()
        let c_pink = [RESOURCE_ESSENCE,RESOURCE_EMANATION,RESOURCE_SPIRIT,RESOURCE_EXTRACT,RESOURCE_CONCENTRATE,RESOURCE_CONDENSATE,RESOURCE_MIST].reverse()
        let c_green =[RESOURCE_ORGANISM,RESOURCE_ORGANOID,RESOURCE_MUSCLE,RESOURCE_TISSUE,RESOURCE_PHLEGM,RESOURCE_CELL,RESOURCE_BIOMASS].reverse()
        // boost
        let b_grey =["OH","ZK","UL","G"]
        let gent =  (r)=> [r+"H",r+"H2O","X"+r+"H2O",r+"O",r+"HO2","X"+r+"HO2"]
        let b_blue = gent("U")
        let b_yellow=gent("Z")
        let b_pink = gent("K")
        let b_green =gent("L")
        let b_withe =gent("G")


        let formatNumber=function (n) {
            var b = parseInt(n).toString();
            var len = b.length;
            if (len <= 3) { return b; }
            var r = len % 3;
            return r > 0 ? b.slice(0, r) + "," + b.slice(r, len).match(/\d{3}/g).join(",") : b.slice(r, len).match(/\d{3}/g).join(",");
        }
        let str = ""
        let id = 0
        let addList = function (list){
            let uniqueColor = function (str,resType){
                if(RES_COLOR_MAP[resType])str="<font style='color: "+RES_COLOR_MAP[resType]+";'>"+str+"</font>"
                return str
            }
            let left = 0
            let getAllRoom = function (text,resType){
                let arr = []
                for(let roomName in roomResAll){
                    arr.push(_.padLeft(roomName,6)+":"+_.padLeft(formatNumber(roomResAll[roomName][resType]||0),9))
                }
                id+=1
                left+=1
                return allResTips(text,arr,id,left)
            }
            list.forEach(e=>str+=getAllRoom(uniqueColor(_.padLeft(e,15),e),e));str+="<br>";
            list.forEach(e=>str+=uniqueColor(_.padLeft(formatNumber(all[e]||0),15),e));str+="<br>";
        }
        str+="<br>基础资源:<br>"
        addList(base)
        str+="<br>压缩资源:<br>"
        addList(bars)
        str+="<br>POWER资源:<br>"
        addList(power)
        str+="<br>商品资源:<br>"
        addList(c_grey)
        addList(c_blue)
        addList(c_yellow)
        addList(c_pink)
        addList(c_green)
        str+="<br>LAB资源:<br>"
        addList(b_grey)
        addList(b_blue)
        addList(b_yellow)
        addList(b_pink)
        addList(b_green)
        addList(b_withe)
        console.log(str)

        return "Game.cpu.used:"+(Game.cpu.getUsed() - time)
    },
    showRoomRes(){
        let time = Game.cpu.getUsed()
        let result = roomResEcharts()
        result+=_.values(Game.rooms).filter(e=>e.my).map(room=>{
            let res = pro.getStorageTerminalRes(room)
            let storageCap = 0
            let terminalCap = 0
            if(room.storage)storageCap=room.storage.store.getCapacity(RESOURCE_ENERGY)
            if(room.terminal)terminalCap=room.terminal.store.getCapacity(RESOURCE_ENERGY)
            let storageFreeCap = 0
            let terminalFreeCap = 0
            if(room.storage)storageFreeCap += room.storage.store.getFreeCapacity()
            if(room.terminal)terminalFreeCap = room.terminal.store.getFreeCapacity()
            if(storageFreeCap||terminalFreeCap)res["empty"] = storageFreeCap+terminalFreeCap;

            let storage = room.storage?room.storage.store:{};
            let terminal = room.terminal?room.terminal.store:{};
            let len = room.name.length
            let str=""
            for(let i=len;i<8;i++)str+=" ";
            return [roomResTips(room.name,res)+str+roomResSvg(storage,storageCap,500)+roomResSvg(terminal,terminalCap,150)+"<br>",
                (storageCap+terminalCap)?(storageFreeCap+terminalFreeCap)/(storageCap+terminalCap):0]
        }).sort((a,b)=>a[1]-b[1]).map(e=>e[0]).join("")
        console.log(result)
        return "Game.cpu.used:"+(Game.cpu.getUsed() - time)
        //HelperRoomResource.show()
    }
}

global.HelperRoomResource=pro