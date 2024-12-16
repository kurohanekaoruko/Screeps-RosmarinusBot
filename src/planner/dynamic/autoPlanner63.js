/*
63超级扣位置自动布局 单文件傻瓜版用法
1 设置4个flag，分别为对应房间的
pc 控制器
pm 矿
pa pb 能量源
2 下载63大佬的超级扣位置自动布局，解压并导入wasm二进制模块，命名（不要后缀）：algo_wasm_priorityqueue
3 复制这个文件所有内容到main.js并上传
4 运行（注意截图）
5 放一个flag名字为p，随便放哪，运行会自动检测，检测到有p这个flag就会运行，运行完成会自动删掉
显示的时间非常短，注意截图，消失了再放一个p又会重新运行一遍，不要反复折腾完，很耗CPU

感谢63！

*/

/**
 * 超级抠位置自动布局：
 * 能覆盖95% 地地形布局的覆盖
 * 对畸形图效果较好，对于大房间可以使用固定布局的效果不怎么好（一般水平
 *
 * 原理：能跑就行有空 写篇简书
 * 代码：挺乱的 如果有机会在整理一下代码
 *
 * 第一版本就先这样吧，大半夜的，睡觉！
 *
 * ！！警告！！ 确保你的bucket和可运行CPU超过100个 ！！警告！！
 * ！！警告！！ 确保你的bucket和可运行CPU超过100个 ！！警告！！
 * ！！警告！！ 确保你的bucket和可运行CPU超过100个 ！！警告！！
 * ！！警告！！ 确保你的bucket和可运行CPU超过100个 ！！警告！！
 * ！！警告！！ 确保你的bucket和可运行CPU超过100个 ！！警告！！
 * ！！警告！！ 确保你的bucket和可运行CPU超过100个 ！！警告！！
 *
 * 结果说明：
 * roomName:roomName
 * storagePos: storage集群中心位置
 * labPos: lab中心位置
 * structMap：{
 *     "建筑类型，直接用没问题的":[[x1,y1]]
 *     //建造的时候按顺序就可以了 ，顺序是距离 storagePos 排序过后的（除了road）
 *     //具体建造多少个，使用 CONTROLLER_STRUCTURES 获取当前可以造多少
 * }
 * 使用代码样例:
 * >> ManagerPlanner.computeManor(p.pos.roomName,[pc,pm,pa,pb])



// 返回结果
// { roomName:roomName,storagePos:{x,y},labPos:{x,y},structMap:{ "rampart" : [[x1,y1],[x2,y2] ...] ...} }

// 使用方法:
// [flagController,flagMineral,flagSourceA,flagSourceB]
// 必须包含.pos对象 {{{ p.pos.x|y }}}

let roomStructsData = undefined //放全局变量

let p = Game.flags.p; // 触发器
let pa = Game.flags.pa;
let pb = Game.flags.pb;
let pc = Game.flags.pc;
let pm = Game.flags.pm;
if(p) {
    roomStructsData = ManagerPlanner.computeManor(p.pos.roomName,[pc,pm,pa,pb])
    Game.flags.p.remove()
}
if(roomStructsData){
    //这个有点消耗cpu 不看的时候记得关
    HelperVisual.showRoomStructures(roomStructsData.roomName,roomStructsData.structMap)
}


 */
 
/**
 *  wasm 优先队列
 *  帮你加速涉及优先级的调度算法
 *  
 *  author: Scorpior
 *  version: v1.1.0
 *  
 *  usage: 
 *  1. add .js and .wasm modules
 *  2. require .js module and use
 *
 *  本人有改动！
 */



global.structuresShape= {
    "spawn": "◎",
    "extension": "ⓔ",
    "link": "◈",
    "road": "•",
    "constructedWall": "▓",
    "rampart": "⊙",
    "storage": "▤",
    "tower": "🔫",
    "observer": "👀",
    "powerSpawn": "❂",
    "extractor": "⇌",
    "terminal": "✡",
    "lab": "☢",
    "container": "□",
    "nuker": "▲",
    "factory": "☭"
}
global.structuresColor= {
    "spawn": "cyan",
    "extension": "#0bb118",
    "link": "yellow",
    "road": "#fa6f6f",
    "constructedWall": "#003fff",
    "rampart": "#003fff",
    "storage": "yellow",
    "tower": "cyan",
    "observer": "yellow",
    "powerSpawn": "cyan",
    "extractor": "cyan",
    "terminal": "yellow",
    "lab": "#d500ff",
    "container": "yellow",
    "nuker": "cyan",
    "factory": "yellow"
}

let helpervisual = {
    //线性同余随机数
    rnd : function( seed ){
    return ( seed * 9301 + 49297 ) % 233280; //为何使用这三个数?
    },
    // seed 的随机颜色
    randomColor : function (seed){
        seed = parseInt(seed)
        let str = "12334567890ABCDEF"
        let out = "#"
        for(let i=0;i<6;i++){
            seed = helpervisual.rnd(seed+Game.time%100)
            out+=str[parseInt(seed)%str.length]
        }
        return out
    },
    // 大概消耗1 CPU！ 慎用！
    showRoomStructures : function (roomName,structMap){
        let roomStructs = new RoomArray().init()
        const visual = new RoomVisual(roomName);
        structMap["road"].forEach(e=>roomStructs.set(e[0],e[1],"road"))
        _.keys(CONTROLLER_STRUCTURES).forEach(struct=>{
            if(!structMap[struct]) structMap[struct]=[];
            if(struct=="road"){
                structMap[struct].forEach(e=>{
                    roomStructs.forNear((x,y,val)=>{
                        if(val =="road"&&((e[0]>=x&&e[1]>=y)||(e[0]>x&&e[1]<y)))visual.line(x,y,e[0],e[1],{color:structuresColor[struct]})
                    },e[0],e[1]);
                    visual.text(structuresShape[struct], e[0],e[1]+0.25, {color: structuresColor[struct],opacity:0.75,fontSize: 7})
                })
            }
            else structMap[struct].forEach(e=>visual.text(structuresShape[struct], e[0],e[1]+0.25, {color: structuresColor[struct],opacity:0.75,fontSize: 7}))
        })
    },
}

global.HelperVisual=helpervisual


class UnionFind{

    constructor(size) {
        this.size  = size
    }
    init() {
        if(!this.parent)
            this.parent = new Array(this.size)
        for(let i=0;i<this.size;i++){
            this.parent[i]=i;
        }
    }
    find(x) {
        let r = x;
        while (this.parent[r] != r) r = this.parent[r];
        while (this.parent[x] != x) {
            let t = this.parent[x];
            this.parent[x] = r;
            x = t;
        }
        return x;
    }
    union(a,b){
        a = this.find(a)
        b = this.find(b)
        if(a>b)this.parent[a]=b;
        else if(a!=b) this.parent[b]=a;
    }
    same(a,b){
        return this.find(a) ==  this.find(b)
    }
}


global.UnionFind = UnionFind

let NodeCache= []
function NewNode(k,x,y,v){
    let t
    if(NodeCache.length){
        t = NodeCache.pop()
    }else{
        t = {}
    }
    t.k = k
    t.x = x
    t.y = y
    t.v = v
    return t
}


function ReclaimNode(node){
    if(NodeCache.length<10000)
        NodeCache.push(node)
}


// @ts-ignore
const RequireWasm = (path) => {
    try {
        return require(`${path}`);
    } catch (e) {
        return require(`${path}.wasm`);
    }
};
// 读取二进制文件
const binary = RequireWasm('algo_wasm_priorityqueue');
const wasmModule = new WebAssembly.Module(binary);  // 初始化为wasm类

/**
 * 
 * @typedef {Object} node
 * @property {number} k 优先级实数（可负）
 * 
 * @typedef {{
 *      memory:{
 *          buffer: ArrayBuffer
 *      },
 *      init(is_min:number):void,
 *      push(priorty:number, id:number):void,
 *      pop():void,
 *      top():number,
 *      get_identifier(pointer:number):number,
 *      size():number,
 *      clear():void,
 *      is_empty():boolean
 *  }} cppQueue
 */

class BaseQueue {
    /**
     * 队列元素个数
     * @returns {number}
     */
    size() {
        // @ts-ignore
        return this.instance.size();
    }
    /**
     * 清空整个队列
     */
    clear() {
        // @ts-ignore
        this.instance.clear();
    }
    /**
     * 队列是否为空
     * @returns {boolean} 实际返回值是0或1
     */
    isEmpty() {
        // @ts-ignore
        return !this.instance.is_empty();
    }
}

/**
 *  c++优先队列
 *  最大容量 131072 个元素（2的17次方）
 *  每个元素是带有priority属性的任意对象
 *  连续pop 100k个元素时比js队列快 80% 以上，元素个数少时比js快 5~10 倍
 */
class PriorityQueue extends BaseQueue {
    /**
     * @param {boolean} isMinRoot 优先级方向，true则pop()时得到数字最小的，否则pop()出最大的
     */
    constructor(isMinRoot=false) {
        super();
        /**@type {cppQueue} */
        let instance;
        /**@type {node[]} */
        let cache = [];

        const imports = {   // 把wasm类实例化需要的接口函数
            env: {
                emscripten_notify_memory_growth() {
                }
            },
            wasi_snapshot_preview1: {
                proc_exit: () => { }
            }
        };
        // @ts-ignore
        instance = new WebAssembly.Instance(wasmModule, imports).exports;   // 实例化
        instance.init(+!!isMinRoot);  // !!转化为boolean, +转为数字

        /**
         * @param {node} node 
         */
        this.push = (node) => {
            try {
                instance.push(node.k, cache.length);
                cache.push(node);
            } catch (e) {
                if (e instanceof TypeError) {
                    throw e;
                } else {
                    throw Error(`priorityQueue is full.\n\t Current size is ${instance.size()}, buffer length is ${instance.memory.buffer.byteLength * 2 / 1024}KB.`);
                }
            }
        }
        /** 
         *  @returns {node|undefined}
         */
        this.pop = () => {
            if (instance.size() > 0) {
                let pointer = instance.top();
                let id = instance.get_identifier(pointer);
                let node = cache[id];
                instance.pop();
                // @ts-ignore
                cache[id] = undefined;
                return node;
            } else {
                return undefined;
            }
        }
        /**
         *  @returns {node|undefined}
         */
        this.top = () => {
            if (instance.size() > 0) {
                let pointer = instance.top();
                return cache[instance.get_identifier(pointer)];
            } else {
                return undefined;
            }
        }
        /**
         *  @returns {undefined}
         */
        this.whileNoEmpty = (func) => {
            while (!this.isEmpty()){
                let node = this.pop();
                func(node)
                ReclaimNode(node)
            }
        }

        Object.defineProperty(this, 'instance', {   // 不想被枚举到
            value: instance
        })
    }
    /**
     *  把节点插入队列
     * @param {node} node 待插入对象，至少含有priority:k属性
     */
    push(node) { }
    /** 
     *  查看顶端节点，空队列返回undefined
     *  @returns {node|undefined}
     */
    top() { return }
    /**
     *  取出顶端节点，空队列返回undefined
     *  @returns {node|undefined}
     */
    pop() { return }
}

global.PriorityQueue = PriorityQueue
global.NewNode = NewNode
global.ReclaimNode = ReclaimNode
// module.exports = {
//     PriorityQueue: PriorityQueue
// }


let RoomArray_proto= {
    exec(x,y,val){
        let tmp = this.arr[x*50+y]
        this.set(x,y,val);
        return tmp
    },
    get(x,y){
        return this.arr[x*50+y];
    },
    set(x,y,value){
        this.arr[x*50+y]=value;
    },
    init(){
        if(!this.arr)
            this.arr = new Array(50*50)
        for(let i=0;i<2500;i++){
            this.arr[i]=0;
        }
        return this;
    },
    forEach(func){
        for(let y = 0; y < 50; y++) {
            for(let x = 0; x < 50; x++) {
                func(x,y,this.get(x,y))
            }
        }
    },
    for4Direction(func,x,y,range=1){
        for(let e of [[1,0],[-1,0],[0,1],[0,-1]]){
            let xt=x+e[0]
            let yt=y+e[1]
            if(xt>=0&&yt>=0&&xt<=49&&yt<=49)
                func(xt,yt,this.get(xt,yt))
        }
    },
    forNear(func,x,y,range=1){
        for(let i=-range;i<=range;i++){
            for(let j=-range;j<=range;j++){
                let xt=x+i
                let yt=y+j
                if((i||j)&&xt>=0&&yt>=0&&xt<=49&&yt<=49)
                    func(xt,yt,this.get(xt,yt))
            }
        }
    },
    forBorder(func,range=1){
        for(let y = 0; y < 50; y++) {
            func(0,y,this.get(0,y))
            func(49,y,this.get(49,y))
        }
        for(let x = 1; x < 49; x++) {
            func(x,0,this.get(x,0))
            func(x,49,this.get(x,49))
        }
    },
    initRoomTerrainWalkAble(roomName){
        let terrain = new Room.Terrain(roomName);
        this.forEach((x,y)=> this.set(x,y, terrain.get(x,y)==1?0:terrain.get(x,y)==0?1:2))
    }
}
class RoomArray {
    constructor(){
        this.__proto__ = RoomArray_proto
    }
}


global.minPlaneCnt = 140 // 内部布局最小面积！ 试过了，140是 基本上最低配置了

let visited = new RoomArray()
let roomWalkable = new RoomArray()
let nearWall = new RoomArray()
let routeDistance = new RoomArray()
let roomObjectCache = new RoomArray()

let nearWallWithInterpolation= new RoomArray()
let interpolation = new RoomArray()

let queMin = new PriorityQueue(true)
let queMin2 = new PriorityQueue(true)
let startPoint = new PriorityQueue(true)

let unionFind = new UnionFind(50*50);

/**
 * controller mineral source posList
 */
let objects = []

let pro={
    /**
     * https://www.bookstack.cn/read/node-in-debugging/2.2heapdump.md
     * 防止内存泄漏！！！！
     * 闭包太多，改不动了
     */
    init  (){
        visited = new RoomArray()
        roomWalkable = new RoomArray()
        nearWall = new RoomArray()
        routeDistance = new RoomArray()

        nearWallWithInterpolation= new RoomArray()
        interpolation = new RoomArray()
        roomObjectCache = new RoomArray()

        queMin = new PriorityQueue(true)
        queMin2 = new PriorityQueue(true)
        startPoint = new PriorityQueue(true)

        unionFind = new UnionFind(50*50);


        visited.init()
        nearWall.init()
        routeDistance.init()
        roomWalkable.init()

        nearWallWithInterpolation.init()
        interpolation.init()
        roomObjectCache.init()
        unionFind.init()

        queMin.clear()
        queMin2.clear()
        startPoint.clear()
    },
    /**
     * 防止内存泄漏！！！！
     */
    dismiss (){
        visited = null
        roomWalkable = null
        nearWall = null
        routeDistance = null
        roomObjectCache = null

        nearWallWithInterpolation= null
        interpolation = null

        queMin = null
        queMin2 = null
        startPoint = null

        unionFind = null
        objects= []
    },
    /**
     * 计算区块的最大性能指标 ，性能消耗的大头！
     * 优化不动了
     */
    getBlockPutAbleCnt (roomWalkable,visited,queMin,unionFind,tarRoot,putAbleCacheMap,AllCacheMap){
        if(putAbleCacheMap[tarRoot])return [putAbleCacheMap[tarRoot],AllCacheMap[tarRoot]]
        // let t = Game.cpu.getUsed() //这很吃性能，但是是必须的
        let roomManor = routeDistance
        roomManor.init()
        roomManor.forEach((x, y, val)=>{if(tarRoot==unionFind.find(x*50+y)){roomManor.set(x,y,1)}})
        roomManor.forEach((x, y, val)=>{
            if(val){
                let manorCnt = 0
                let wallCnt = 0
                roomManor.for4Direction((x1,y1,val1)=>{
                    if(val1)manorCnt+=1
                    if(!roomWalkable.get(x1,y1))wallCnt+=1
                },x,y)
                if(manorCnt==1&&wallCnt == 0)roomManor.set(x,y,0)
            }
        })
        let dfsMoreManor = function (x,y,val){
            if(!val&&roomWalkable.get(x,y)){
                let manorCnt = 0
                let wallCnt = 0
                roomManor.for4Direction((x1,y1,val1)=>{
                    if(val1)manorCnt+=1
                    if(!roomWalkable.get(x1,y1))wallCnt+=1
                },x,y)
                if(manorCnt>=2||manorCnt==1&&wallCnt>=2){
                    roomManor.set(x,y,1)
                    roomManor.for4Direction((x1,y1,val1)=>{
                        dfsMoreManor(x1,y1,val1)
                    },x,y)
                }
            }
        }
        roomManor.forEach((x, y, val)=>{dfsMoreManor(x,y,val)})
        roomWalkable.forBorder((x,y,val)=>{
            if(val){
                roomManor.forNear((x,y,val)=>{
                    roomManor.set(x,y,0)
                },x,y)
                roomManor.set(x,y,0)
            }
        })

        let innerPutAbleList = []
        let AllCacheList = []


            // &&!roomObjectCache.get(x,y)
        visited.init()/*
        roomWalkable.forEach((x, y, val)=>{
            if(!roomManor.get(x,y)||roomObjectCache.get(x,y)) {
                // const visual = new RoomVisual("W3N6");
                // if(roomObjectCache.get(x,y))visual.text(val&&!roomObjectCache.get(x,y)?-4:-1, x,y+0.25, {color: 'red',opacity:0.99,font: 7})
                // queMin.push(NewNode(val&&!roomObjectCache.get(x,y)?-4:-1,x,y));
                let innerWall = false //在墙上的时候要退一格子
                if(roomObjectCache.get(x,y)){
                    roomManor.forNear((x,y,val)=>{if(!val&&roomWalkable.get(x,y))innerWall=true},x,y)
                }
                queMin.push(NewNode(val?((roomObjectCache.get(x,y)&&!innerWall)?-1:-4):-1,x,y));
                // visited.set(x,y,1) 这里不能设置visited 因为 -4 和-1 优先级不同 如果 -4距离和-1比较，-1会抢走-4 导致 rangeAttack打得到
            }
        })*/

        roomWalkable.forEach((x, y, val)=>{
            if(!roomManor.get(x,y)) {
                queMin.push(NewNode(val?-4:-1,x,y));
                // visited.set(x,y,1) 这里不能设置visited 因为 -4 和-1 优先级不同 如果 -4距离和-1比较，-1会抢走-4 导致 rangeAttack打得到
            }
        })

        // let t = Game.cpu.getUsed() //这很吃性能，真的优化不动了

        queMin.whileNoEmpty(nd=>{
            let func = function (x,y,val){
                let item = NewNode(nd.k+2,x,y);
                if(!visited.exec(x,y,1)){
                    queMin.push(NewNode(nd.k+1,x,y))
                    if(roomManor.get(x,y)){
                        if(nd.k+1>=0&&val){
                            innerPutAbleList.push(item)
                            // visual.text(nd.k+2, x,y+0.25, {color: 'red',opacity:0.99,font: 7})
                        }
                        if(val)
                            AllCacheList.push(item)
                    }
                }
            }
            visited.set(nd.x,nd.y,1)
            if(nd.k>=-1)
                roomWalkable.for4Direction(func,nd.x,nd.y)
            else
                roomWalkable.forNear(func,nd.x,nd.y)
        })

        // console.log(Game.cpu.getUsed()-t)

        putAbleCacheMap[tarRoot] = innerPutAbleList
        AllCacheMap[tarRoot] = AllCacheList
        return [putAbleCacheMap[tarRoot],AllCacheMap[tarRoot]]
    },
    /**
     * 插值，计算区块的预处理和合并需求
     * @param roomName
     */
    computeBlock (roomName){
        const visual = new RoomVisual(roomName);

        roomWalkable.initRoomTerrainWalkAble(roomName)
        roomWalkable.initRoomTerrainWalkAble(roomName)

        //计算距离山体要多远
        roomWalkable.forEach((x,y,val)=>{if(!val){queMin.push(NewNode(0,x,y));visited.set(x,y,1)}})
        queMin.whileNoEmpty(nd=>{
            roomWalkable.for4Direction((x,y,val)=>{
                if(!visited.exec(x,y,1)&&val){
                    queMin.push(NewNode(nd.k+1,x,y))
                }
            },nd.x,nd.y)
            nearWall.exec(nd.x,nd.y,nd.k)
        })

        //距离出口一格不能放墙
        roomWalkable.forBorder((x,y,val)=>{
            if(val){
                roomWalkable.forNear((x,y,val)=>{
                    if(val){
                        // roomWalkable.set(x,y,0);
                        nearWall.set(x,y,50);
                        queMin.push(NewNode(0,x,y));
                        // visited.set(x,y,1)
                    }
                },x,y)
                // roomWalkable.set(x,y,0);
                queMin.push(NewNode(0,x,y));
                nearWall.set(x,y,50)
                // visited.set(x,y,1)
            }
        })

        let roomPutAble = routeDistance
        roomPutAble.initRoomTerrainWalkAble(roomName)
        roomWalkable.forBorder((x,y,val)=>{
            if(val){
                roomWalkable.forNear((x,y,val)=>{
                    if(val){
                        roomPutAble.set(x,y,0)
                    }
                },x,y)
                roomPutAble.set(x,y,0)
            }
        })
        // 计算 控制器，矿物的位置
        let getObjectPos =function(x,y,struct){
            let put = false
            let finalX = 0
            let finalY = 0
            roomPutAble.for4Direction((x,y,val)=>{
                if(val&&!put&&!roomObjectCache.get(x,y)){
                    finalX = x
                    finalY = y
                    put = true
                }
            },x,y)
            roomPutAble.forNear((x,y,val)=>{
                if(val&&!put&&!roomObjectCache.get(x,y)){
                    finalX = x
                    finalY = y
                    put = true
                }
            },x,y)
            roomObjectCache.set(finalX,finalY,struct)
            return [finalX,finalY]
        }
        for(let i=0;i<objects.length;i++){
            let pos = objects[i]
            //container 位置
            let p = getObjectPos(pos.x,pos.y,"container")

            // link 位置
            if(i!=1){
                let linkPos = getObjectPos(p[0],p[1],"link")
                roomObjectCache.link = roomObjectCache.link || []
                roomObjectCache.link.push(linkPos) // link controller 然后是  source
            }else{
                roomObjectCache.extractor = [[pos.x,pos.y]]
            }
            roomObjectCache.container = roomObjectCache.container || []
            if(i!=1)roomObjectCache.container.unshift(p) //如果是 mineral 最后一个
            else roomObjectCache.container.push(p)
        }

        //插值，这里用拉普拉斯矩阵，对nearWall 插值 成 nearWallWithInterpolation
        nearWall.forEach((x,y,val)=>{
            let value = -4*val
            nearWall.for4Direction((x,y,val)=>{
                value += val
            },x,y)
            interpolation.set(x,y,value)
            if(value>0)value=0;
            if(val&&roomWalkable.get(x,y))nearWallWithInterpolation.set(x,y,val+value*0.1)
        })


        // 计算距离出口多远
        visited.init()
        routeDistance.init()
        queMin.whileNoEmpty(nd=>{
            roomWalkable.forNear((x,y,val)=>{
                if(!visited.exec(x,y,1)&&val){
                    queMin.push(NewNode(nd.k+1,x,y))
                }
            },nd.x,nd.y)
            routeDistance.set(nd.x,nd.y,nd.k)
        })

        // 对距离的格子插入到队列 ，作为分开的顺序
        routeDistance.forEach((x,y,val)=>{
            if(!roomWalkable.get(x,y))return
            if(val)startPoint.push(NewNode(-val,x,y))
        })


        let sizeMap = {}
        let posSeqMap = {}

        // 分块，将地图分成一小块一小块
        visited.init()
        for(let i=0;i<100000;i++){
            if(startPoint.isEmpty())break;
            let cnt = 0
            // let color = randomColor(i)
            let nd = startPoint.pop()
            let currentPos = nd.x*50+nd.y
            let posSeq = []

            //搜索分块
            let dfsFindDown = function (roomArray,x,y){
                let currentValue = roomArray.get(x,y)
                if(!visited.exec(x,y,1)){
                    roomArray.for4Direction((x1,y1,val)=>{
                        if(val&&(x1==x||y1==y) &&val<currentValue){
                            dfsFindDown(roomArray,x1,y1)
                        }
                    },x,y)
                    cnt++
                    // visual.circle(x,y, {fill: color, radius: 0.5 ,opacity : 0.5})
                    let pos = x*50+y
                    posSeq.push(pos)
                    unionFind.union(currentPos,pos)
                }
            }

            // 跑到最高点
            let dfsFindUp = function (roomArray,x,y){
                let currentValue = roomArray.get(x,y)
                if(!visited.exec(x,y,1)){
                    roomArray.forNear((x1,y1,val)=>{
                        if(val>currentValue&&currentValue<6){ //加了一点优化，小于时分裂更过
                            dfsFindUp(roomArray,x1,y1)
                        }
                        else if(val&&val<currentValue){
                            dfsFindDown(roomArray,x1,y1)
                        }
                    },x,y)
                    cnt++
                    // visual.circle(x,y, {fill: color, radius: 0.5 ,opacity : 0.5})
                    let pos = x*50+y
                    posSeq.push(pos)
                    unionFind.union(currentPos,pos)
                }
            }
            dfsFindUp(nearWallWithInterpolation,nd.x,nd.y)

            //记录每一块的位置和大小 以 并查集的根节点 作为记录点
            if(cnt>0){
                let pos = unionFind.find(currentPos);
                // queMin.push({k:cnt,v:pos})
                queMin.push(NewNode(cnt,0,0,pos))
                sizeMap[pos] = cnt
                posSeqMap[pos] = posSeq
            }
        }

        // 将出口附近的块删掉
        roomWalkable.forBorder((x,y,val)=>{
            if(val){
                roomWalkable.forNear((x,y,val)=>{
                    if(val){
                        let pos = unionFind.find(x*50+y);
                        if(sizeMap[pos]) delete sizeMap[pos]
                    }
                },x,y)
                let pos = unionFind.find(x*50+y);
                if(sizeMap[pos]) delete sizeMap[pos]
            }
        })

        let putAbleCacheMap = {}
        let allCacheMap = {}
        // let i = 0
        // 合并小块成大块的
        queMin.whileNoEmpty(nd=>{
            let pos = nd.v;
            if(nd.k != sizeMap[pos])return;// 已经被合并了
            // i++;

            visited.init()
            let nearCntMap={}
            let allNearCnt = 0

            //搜索附近的块
            posSeqMap[pos].forEach(e=>{
                let y = e%50;
                let x = ((e-y)/50);//Math.round
                roomWalkable.forNear((x,y,val)=>{
                    if(val&&!visited.exec(x,y,1)){
                        let currentPos = unionFind.find(x*50+y);
                        if(currentPos == pos)return;
                        allNearCnt+=1
                        // if(i==104)
                        // visual.text(parseInt(1*10)/10, x,y+0.25, {color: "cyan",opacity:0.99,font: 7})
                        let currentSize = sizeMap[currentPos];
                        if(currentSize<300){
                            nearCntMap[currentPos]=(nearCntMap[currentPos]||0)+1;
                        }
                    }
                },x,y)
            })

            let targetPos = undefined;
            let nearCnt = 0;
            let maxRatio = 0;

            // 找出合并附近最优的块
            _.keys(nearCntMap).forEach(currentPos=>{
                let currentRatio = nearCntMap[currentPos]/Math.sqrt(Math.min(sizeMap[currentPos],nd.k))//实际/期望
                if( currentRatio == maxRatio ? sizeMap[currentPos]<sizeMap[targetPos]:currentRatio > maxRatio){
                    targetPos = currentPos;
                    maxRatio = currentRatio;
                    nearCnt = nearCntMap[currentPos];
                }
            })
            _.keys(nearCntMap).forEach(currentPos=>{
                if(nearCnt < nearCntMap[currentPos]){
                    targetPos = currentPos;
                    nearCnt = nearCntMap[currentPos];
                }
            })
            let minSize = sizeMap[targetPos];
            let cnt = nd.k+minSize;
            // let nearRatio =nearCntMap[targetPos]/allNearCnt;

            let targetBlockPutAbleCnt = 0
            let ndkBlockPutAbleCnt = 0
            if(minSize>minPlaneCnt)
                targetBlockPutAbleCnt = pro.getBlockPutAbleCnt(roomWalkable,visited,queMin2,unionFind,targetPos,putAbleCacheMap,allCacheMap)[0].length
            if(nd.k>minPlaneCnt)
                ndkBlockPutAbleCnt = pro.getBlockPutAbleCnt(roomWalkable, visited, queMin2, unionFind, nd.v,putAbleCacheMap,allCacheMap)[0].length

            // if(targetBlockPutAbleCnt||ndkBlockPutAbleCnt)clog(targetBlockPutAbleCnt,ndkBlockPutAbleCnt)
            // 打印中间变量
            // if(targetPos&&cnt>50&&(targetBlockPutAbleCnt||ndkBlockPutAbleCnt)){
            //     let y = pos%50
            //     let x = Math.round((pos-y)/50)
            //     let y1 = targetPos%50
            //     let x1 = Math.round((targetPos-y1)/50)
            //     visual.line(x,y,x1,y1)
            //     // visual.text(nd.k+"+"+minSize+"="+cnt, (x+x1)/2,(y+y1)/2-0.25, {color: "red",opacity:0.99,font: 7})
            //     // visual.text(allNearCnt+"_"+nearCntMap[targetPos]+" "+nearCnt+" "+parseInt(nearCnt/Math.sqrt(Math.min(minSize,nd.k))*100)/100+" "+parseInt(maxRatio-Math.sqrt(nd.k)/12*100)/100, (x+x1)/2,(y+y1)/2+0.25, {color: "yellow",opacity:0.99,font: 7})
            //     visual.text(parseInt(targetBlockPutAbleCnt*100)/100+" "+parseInt(ndkBlockPutAbleCnt*100)/100, (x+x1)/2,(y+y1)/2+0.25, {color: "yellow",opacity:0.99,font: 7})
            // }

            // if(targetPos&&((cnt<=250&&maxRatio>0.7)||(cnt<=300&&maxRatio>0.8)||(cnt<=350&&maxRatio>0.9)||(maxRatio>1&&cnt<400)||nd.k<=10)){//||maxRatio>1.5
            // if(targetPos&&(maxRatio-cnt/500>0.2&&cnt<400)){//||maxRatio>1.5

            // cnt = targetBlockPutAbleCnt+ndkBlockPutAbleCnt;
            // 合并
            if(targetPos&&Math.max(targetBlockPutAbleCnt,ndkBlockPutAbleCnt)<minPlaneCnt){//&&(maxRatio-Math.sqrt(cnt)/20>=0||(nearRatio>0.7&&nd.k<100))
            // if(targetPos&&(cnt<300||Math.min(nd.k,minSize)<150)&&(maxRatio-Math.sqrt(cnt)/20>=0||Math.max(nd.k,minSize)<200||(nearRatio>0.7&&nd.k<100))){//*Math.sqrt(nearRatio)


                unionFind.union(pos,targetPos);
                nd.v = unionFind.find(pos);

                if(pos != nd.v) delete sizeMap[pos];
                else delete sizeMap[targetPos];

                nd.k = cnt;
                sizeMap[nd.v] = cnt;
                posSeqMap[nd.v] = posSeqMap[targetPos].concat(posSeqMap[pos])
                delete putAbleCacheMap[nd.v]
                delete putAbleCacheMap[targetPos]
                if(pos != nd.v) delete posSeqMap[pos];
                else delete posSeqMap[targetPos];
                queMin.push(NewNode(nd.k,nd.x,nd.y,nd.v));
            }

        })
        // 打印结果

        // const visual = new RoomVisual(roomName);
        // _.keys(sizeMap).forEach(e=>{
        //     let y = e%50
        //     let x = ((e-y)/50)//Math.round
        //     let color = "red"
        //     let cnt = pro.getBlockPutAbleCnt(roomWalkable,visited,queMin2,unionFind,e,putAbleCacheMap).length
        //     pro.getBlockPutAbleCnt(roomWalkable,visited,queMin2,unionFind,e,putAbleCacheMap).forEach(t=>{
        //         visual.circle(t.x, t.y, {fill: randomColor(e), radius: 0.5 ,opacity : 0.35})
        //     })
        //     // let cnt = sizeMap[e]
        //     if(sizeMap[e]>0)visual.text(parseInt(cnt*10)/10, x,y+0.25, {color: color,opacity:0.99,font: 7})
        // })

        // roomWalkable.forEach((x, y, val)=>{if(val>0&&sizeMap[unionFind.find(x*50+y)]>0)visual.circle(x, y, {fill: randomColor(unionFind.find(x*50+y)), radius: 0.5 ,opacity : 0.15})})


        // 打印中间变量
        // nearWallWithInterpolation.forEach((x, y, val)=>{if(val>0)visual.circle(x, y, {fill: "#ff9797", radius: 0.5 ,opacity : 0.05*val+0.01})})
        // nearWall.forEach((x, y, val)=>{if(val)visual.text(parseInt(val*10)/10, x,y+0.25, {color: "red",opacity:0.5,font: 7})})

        return [unionFind,sizeMap,roomWalkable,nearWall,putAbleCacheMap,allCacheMap]

    },
    /**
     * 计算 分布图
     * 计算建筑的位置
     * @param roomName,
     * @param points 
     * @return result { roomName:roomName,storagePos:{x,y},labPos:{x,y},structMap:{ "rampart" : [[x1,y1],[x2,y2] ...] ...} }
     */
    computeManor (roomName,points){
        pro.init()
        for(let p of points){
            if(p && p.roomName==roomName) objects.push(p)
        }
        // const visual = new RoomVisual(roomName);
        let blockArray = pro.computeBlock(roomName)
        let unionFind = blockArray[0]
        let sizeMap = blockArray[1]
        let wallMap = {}
        let roomWalkable = blockArray[2]
        let nearWall = blockArray[3]
        let putAbleCacheMap = blockArray[4]
        let allCacheMap = blockArray[5]

        let roomManor = interpolation
        let roomStructs = nearWallWithInterpolation


        roomManor.init()
        roomStructs.init()

        // let closeToWall = new RoomArray()
        nearWall.init()

        // let queMin = new PriorityQueue(true)
        queMin.clear()
        // let visited = new RoomArray()

        let finalPos = undefined;
        let wallCnt = 1e9;
        let putAbleList = []
        let innerPutAbleList = []

        let centerX = undefined;
        let centerY = undefined;
        _.keys(sizeMap).forEach(pos=>{
            // if(sizeMap[pos]<150)return
            pro.getBlockPutAbleCnt(roomWalkable, visited, queMin, unionFind, pos,putAbleCacheMap,allCacheMap)
            let currentPutAbleList = putAbleCacheMap[pos]
            let allList = allCacheMap[pos]
            if(currentPutAbleList.length<minPlaneCnt)return

            wallMap[pos] = []

            visited.init()
            roomWalkable.forBorder((x,y,val)=>{if(val){queMin.push(NewNode(0,x,y));visited.set(x,y,1)}})

            let roomManor = routeDistance //当前的Manor
            roomManor.init()
            allList.forEach(e=>{
                roomManor.set(e.x,e.y,1)
            })
            // currentPutAbleList.forEach(e=>visual.text(e.k, e.x,e.y+0.25, {color: 'red',opacity:0.99,font: 7}))

            queMin.whileNoEmpty(nd=>{
                if(!roomManor.get(nd.x,nd.y))
                roomWalkable.forNear((x,y,val)=>{
                    if(!visited.exec(x,y,1)&&val){
                        if(!roomManor.get(x,y))
                            queMin.push(NewNode(nd.k+1,x,y))
                        else{
                            wallMap[pos].push(NewNode(0,x,y))
                            // visual.text('X', x,y+0.25, {color: 'red',opacity:0.99,font: 7})
                        }
                    }
                },nd.x,nd.y)
            })

            // wallMap[pos].forEach(xy=>queMin.push(NewNode(0,xy.x,xy.y)))

            let currentInnerPutAbleList = currentPutAbleList

            let maxDist = 0;
            let filter2 = currentInnerPutAbleList.filter(e=>e.k>2);
            if (filter2.length < 30) {
                filter2.forEach(a=>{
                    filter2.forEach(b=>{
                        maxDist = Math.max(maxDist,Math.abs(a.x-b.x)+Math.abs(a.y-b.y))
                    })
                })
            }

            let currentWallCnt = wallMap[pos].length;
            // {
            //     let y = pos%50
            //     let x = ((pos-y)/50)//Math.round
            //     visual.text(parseInt((allList.length)*10)/10, x,y, {color: "yellow",opacity:0.99,font: 7})
            //     visual.text(parseInt((currentPutAbleList.length)*10)/10, x,y+0.5, {color: "red",opacity:0.99,font: 7})
            //     visual.text(parseInt((currentInnerPutAbleList.length)*10)/10, x,y+1, {color: "red",opacity:0.99,font: 7})
            // }
            if(minPlaneCnt<currentPutAbleList.length&&wallCnt>currentWallCnt&&(currentInnerPutAbleList.filter(e=>e.k>1).length>30||maxDist>5)){
                putAbleList = currentPutAbleList
                innerPutAbleList = currentInnerPutAbleList
                wallCnt = currentWallCnt
                finalPos = pos
                centerX = currentPutAbleList.map(e=>e.x).reduce((a,b)=>a+b)/currentPutAbleList.length;
                centerY = currentPutAbleList.map(e=>e.y).reduce((a,b)=>a+b)/currentPutAbleList.length;
            }

            // allCacheMap[pos].forEach(t=>{
            //     visual.circle(t.x, t.y, {fill: randomColor(pos), radius: 0.5 ,opacity : 0.15})
            // })
        })

        if(!putAbleCacheMap[finalPos])
            return

        let walls = wallMap[finalPos]


        roomManor.init()
        allCacheMap[finalPos].forEach(e=>{
            roomManor.set(e.x,e.y,-1)
        })
        innerPutAbleList.forEach(e=>{
            roomManor.set(e.x,e.y,e.k)
        })

        // visited.init()
        // roomWalkable.forEach((x, y, val)=>{if(!roomManor.get(x,y)){queMin.push(NewNode(val?-3:-1,x,y));visited.set(x,y,1)}})



        let storageX = 0
        let storageY = 0
        let storageDistance = 100

        // innerPutAbleList.forEach(e=>visual.text(e.k, e.x,e.y+0.25, {color: 'red',opacity:0.99,font: 7}))
        innerPutAbleList.filter(e=>e.k>2).forEach(e=>{
            let x =e.x
            let y =e.y
            let detX= centerX-x
            let detY= centerY-y
            let distance = Math.sqrt(detX*detX+detY*detY)
            if(storageDistance>distance){
                storageDistance = distance
                storageX = x
                storageY = y
            }
        })


        if(Game.flags.centerPos){
            storageX = Game.flags.centerPos.pos.x;
            storageY = Game.flags.centerPos.pos.y;
        }

        let labX = 0
        let labY = 0
        let labDistance = 1e5
        innerPutAbleList.filter(e=>e.k>4).forEach(e=>{
            let x =e.x
            let y =e.y
            let detX= centerX-x
            let detY= centerY-y
            let distance = Math.sqrt(detX*detX+detY*detY)

            if(labDistance>distance&&Math.abs(x-storageX)+Math.abs(y-storageY)>5){
                labDistance = distance
                labX = x
                labY = y
            }
        })

        roomManor.forEach((x,y,val)=>{
            if(val>=2){
                // if(roomManor.get(x,y)>0&&Math.abs(x-storageX)+Math.abs(y-storageY)>2)
                    // visual.text(val, x,y+0.25, {color: 'cyan',opacity:0.99,font: 7})
                let distance = Math.sqrt(Math.pow(centerX-x-0.5,2)+Math.pow(centerY-y-0.5,2))
                if(labDistance<=distance) return;
                let checkCnt = 0;
                let check=function (x,y){
                    if(roomManor.get(x,y)>0&&Math.abs(x-storageX)+Math.abs(y-storageY)>2){
                        checkCnt+=1;
                    }
                }
                for(let i=-1;i<3;i++)
                    for(let j=-1;j<3;j++)
                        check(x+i,y+j);
                if(checkCnt==16){
                    labDistance = distance
                    labX = x
                    labY = y
                }
            }
        })


        // visual.text("C", centerX,centerY+0.25, {color: 'green',opacity:0.99,font: 7})
        // visual.text("S", storageX,storageY+0.25, {color: 'blue',opacity:0.99,font: 7})
        // visual.text("L", labX+0.5,labY+0.75, {color: 'blue',opacity:0.99,font: 7})
        // clog(roomName)

        // clog(roomName,storageX,storageY,labX,labY,innerPutAbleList.length,wallCnt,finalPos)
        // clog(innerPutAbleList.filter(e=>e.k==1).length)

        // _.keys(sizeMap).forEach(e=>{
        //     let y = e%50
        //     let x = ((e-y)/50)//Math.round
        //     let color = "red"
        //     if(sizeMap[e]>0)visual.text(parseInt(sizeMap[e]*10)/10, x,y+1+0.25, {color: color,opacity:0.99,font: 7})
        // })

        // CONTROLLER_STRUCTURES: {
        //     "spawn": {0: 0, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2, 8: 3},
        //     "extension": {0: 0, 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60},
        //     "link": {1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 3, 7: 4, 8: 6},
        //     "road": {0: 2500, 1: 2500, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500},
        //     "constructedWall": {1: 0, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500},
        //     "rampart": {1: 0, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500},
        //     "storage": {1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1},
        //     "tower": {1: 0, 2: 0, 3: 1, 4: 1, 5: 2, 6: 2, 7: 3, 8: 6},
        //     "observer": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1},
        //     "powerSpawn": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1},
        //     "extractor": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1},
        //     "terminal": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1},
        //     "lab": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 3, 7: 6, 8: 10},
        //     "container": {0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5},
        //     "nuker": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1},
        //     "factory": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 1}
        // }

        // nearWall.forEach((x, y, val)=>{if(val>2&&finalPos==unionFind.find(x*50+y))visual.text(nearWall.get(x,y),x, y+0.5, {color: "red",opacity:0.99,font: 7})})

        /**
         * 这里开始计算布局！
         * @type {{}}
         */
        let structMap = {}
        _.keys(CONTROLLER_STRUCTURES).forEach(e=>structMap[e] = [])

        // 资源点布局
        structMap["link"] = roomObjectCache.link
        structMap["container"] = roomObjectCache.container
        structMap["extractor"] = roomObjectCache.extractor
        //中心布局
        structMap["storage"] .push([storageX-1,storageY])
        structMap["terminal"] .push([storageX,storageY+1])
        structMap["factory"] .push([storageX+1,storageY])
        structMap["link"] .push([storageX,storageY-1])
        for(let i=-1;i<=1;i++){
            for(let j=-1;j<=1;j++) {
                structMap["road"].push([storageX+i+j,storageY+i-j]) //仿射变换 [sin,cos,cos,-sin]
            }
        }
        // 这里修改lab布局
        let labs = [
            "☢☢-☢",
            "☢-☢-",
            "-☢-☢",
            "☢-☢☢"
        ]
        let labChangeDirection = false;
        if ((storageX - labX) * (storageY - labY) < 0) {
            labChangeDirection = true
        }

        let vis = {}
        for(let i=0;i<2;i++){
            for(let j=0;j<2;j++){
                vis[i+"_"+j] = 1 // 优先放置中间的label
                let jj = labChangeDirection?j:1-j;
                let structs = labs[i+1].charAt(j+1)
                if(structs == '☢')
                    structMap["lab"].push([labX+i,labY+jj])
                else
                    structMap["road"].push([labX+i,labY+jj])
            }
        }

        for(let i=-1;i<3;i++){
            for(let j=-1;j<3;j++){
                if(vis[i+"_"+j])continue;
                let jj = labChangeDirection?j:1-j;
                let structs = labs[i+1].charAt(j+1)
                if(structs == '☢')
                    structMap["lab"].push([labX+i,labY+jj])
                else
                    structMap["road"].push([labX+i,labY+jj])
            }
        }

        walls.forEach(e=>structMap["rampart"].push([e.x,e.y]))

        _.keys(CONTROLLER_STRUCTURES).forEach(struct=>structMap[struct].forEach(e=>roomStructs.set(e[0],e[1],struct)))

        structMap["road"].forEach(e=>roomStructs.set(e[0],e[1],1))
        //设置权值，bfs联通路径！
        let setModel = function (xx,yy){
            let checkAble = (x,y)=> (x>=0&&y>=0&&x<=49&&y<=49)&&roomManor.get(x,y)>0&&!roomStructs.get(x,y)
            for(let i=-1;i<=1;i++){
                for(let j=-1;j<=1;j++) {
                    let x = xx+i+j
                    let y = yy+i-j
                    if(checkAble(x,y)){
                        if(i||j){
                            // structMap["road"] .push([x,y]) //仿射变换 [sin,cos,cos,-sin]
                            roomStructs.set(x,y,1)
                        }else{
                            // structMap["spawn"] .push([x,y])
                            roomStructs.set(x,y,12)
                        }
                    }
                }
            }
            for(let e of [[1,0],[-1,0],[0,1],[0,-1]]){
                let x=xx+e[0]
                let y=yy+e[1]
                if(checkAble(x,y)){
                    // structMap["extension"] .push([x,y])
                    roomStructs.set(x,y,8)
                }
            }
        }

        for(let i=0;i<50;i+=4){
            for(let j=0;j<50;j+=4) {
                let x =storageX%4+i
                let y =storageY%4+j
                setModel(x,y)
                setModel(x+2,y+2)

            }
        }
        visited.init()
        visited.set(storageX,storageY,1)

        queMin.push(NewNode(1,storageX,storageY))
        let costRoad = routeDistance //重复使用
        costRoad.init()
        queMin.whileNoEmpty(nd=>{
            roomStructs.forNear((x,y,val)=>{
                if(!visited.exec(x,y,1)&&val>0){
                    queMin.push(NewNode(nd.k+val,x,y))
                }
            },nd.x,nd.y)
            costRoad.set(nd.x,nd.y,nd.k)
            // visual.text(nd.k,nd.x,nd.y+0.25, {color: "pink",opacity:0.99,font: 7})
        })

        structMap["road"].forEach(e=>roomStructs.set(e[0],e[1],"road")) //这里把之前的road覆盖上去防止放在之前里road上了

        costRoad.forEach((x,y,val)=>{
            if(!val)return;
            let minVal =50;
            // let finalX = 0;
            // let finalY = 0;
            costRoad.forNear((x1,y1,val)=>{
                if(minVal>val&&val>0){
                    minVal = val
                    // finalX = x1
                    // finalY = y1
                }
            },x,y)
            // 方案2 没那么密集
            costRoad.forNear((x1,y1,val)=>{
                if(minVal==val&&val>0){
                    // structMap["road"].push([x1,y1])
                    roomStructs.set(x1,y1,"road")
                }
            },x,y)
            // 方案1 密集
            // structMap["road"].push([finalX,finalY])
            // roomStructs.set(finalX,finalY,"road")
        })

        let spawnPos = []
        let extensionPos = []
        roomStructs.forEach((x,y,val)=>{
            if (val > 0) {
                let dist = 100;
                costRoad.forNear((x,y,val)=>{
                    if(val)dist = Math.min(dist,val)
                },x,y)
                // let dist = Math.sqrt(Math.pow(x-storageX,2)+Math.pow(y-storageY,2))
                if(val==12){// 8 && 12 上面有写，注意！！！
                    spawnPos.push([x,y,dist])
                }
                else{
                    extensionPos.push([x,y,dist])
                    // visual.text(dist,x, y+0.25, {color: "pink",opacity:0.99,font: 7})
                }
            }
        })
        let cmpFunc=(a,b)=>a[2]==b[2]?(a[1]==b[1]?a[0]-b[0]:a[1]-b[1]):a[2]-b[2];
        spawnPos = spawnPos.sort(cmpFunc);
        extensionPos = extensionPos.sort(cmpFunc);
        let oriStruct = [];
        let putList=[];
        ["spawn","powerSpawn","nuker","tower", "observer"].forEach(struct=>{
            for(let i=0;i<CONTROLLER_STRUCTURES[struct][8];i++){
                oriStruct.push(struct)
            }
        })
        oriStruct.forEach(struct=>{
            let e = spawnPos.shift()
            if(!e) e = extensionPos.shift()
            structMap[struct].push([e[0],e[1]])
            putList.push([e[0],e[1],struct])
        })
        extensionPos.push(...spawnPos)
        extensionPos = extensionPos.sort(cmpFunc);
        let extCnt= 60
        extensionPos.forEach(e=>{
            if(extCnt>0){
                structMap["extension"].push([e[0],e[1]]);
                putList.push([e[0],e[1],"extension"])
                extCnt-=1;
            }
        })


        // 更新roads
        roomStructs.init()
        _.keys(CONTROLLER_STRUCTURES).forEach(struct=>structMap[struct].forEach(e=>roomStructs.set(e[0],e[1],struct)))
        visited.init()
        structMap["road"].forEach(e=>visited.set(e[0],e[1],1))
        /**
         * 更新最近的roads 但是可能有残缺
         */
        putList.forEach(e=>{
            let x = e[0]
            let y = e[1]
            let minVal =50;
            costRoad.forNear((x1,y1,val)=>{
                if(minVal>val&&val>0){
                    minVal = val
                }
            },x,y)
            // 方案2 没那么密集
            costRoad.forNear((x1,y1,val)=>{
                if(minVal==val&&val>0){
                    // 找到建筑最近的那个road
                    roomStructs.set(x1,y1,"road")
                }
            },x,y)
        })
        /**
         * 再roads的基础上，对rads进行补全，将残缺的连起来
         */
        roomStructs.forEach((x,y,val)=>{
            if(val == 'link'||val == 'container')return; // 资源点的不要 放路
            if(! val instanceof String||val>-1)return; // 附近有建筑 ，并且不是road
            // visual.text(val,x, y+0.25, {color: "pink",opacity:0.99,font: 7})
            let minVal =50;
            costRoad.forNear((x1,y1,val)=>{
                if(minVal>val&&val>0){
                    minVal = val
                }
            },x,y)
            // 方案2 没那么密集
            costRoad.forNear((x1,y1,val)=>{
                if(minVal==val&&val>0){
                    // 找到建筑最近的那个road
                    if(!visited.exec(x1,y1,1))structMap["road"].push([x1,y1])
                }
            },x,y)
        })

        // 连接外矿的全部道路
        _.keys(CONTROLLER_STRUCTURES).forEach(struct=>structMap[struct].forEach(e=>roomStructs.set(e[0],e[1],struct)))

        costRoad.forEach((x,y,val)=>costRoad.set(x,y,100))//初始化100
        visited.init()
        queMin.push(NewNode(0,storageX,storageY))//以 storage为中心
        visited.exec(storageX,storageY,1)
        queMin.whileNoEmpty(nd=>{
            roomStructs.forNear((x,y,val)=>{
                let roadCost = roomWalkable.get(x,y);
                if(!visited.exec(x,y,1)&&(!val||val=='road'||val=='rampart')&&roadCost){
                    queMin.push(NewNode(nd.k+(val=='road'?0:roadCost==2?5:1),x,y))
                }
            },nd.x,nd.y)
            costRoad.set(nd.x,nd.y,nd.k)
            // visual.text(costRoad.get(nd.x,nd.y),nd.x,nd.y+0.25, {color: "pink",opacity:0.99,font: 7})
        })

        //将dp的位置进行递归回去
        let border = visited //边界不能放路
        border.init()
        visited.forBorder((x,y,val)=>{visited.set(x,y,1)})
        structMap["container"].forEach(e=>{
            let dfsBack = function (x,y){
                let minVal =500;
                let finalX = 0;
                let finalY = 0;
                costRoad.forNear((x,y,val)=>{
                    let struct = roomStructs.get(x,y)
                    if(minVal>val&&!visited.get(x,y)&&val>=0&&roomWalkable.get(x,y)&&(!struct||struct=='road'||struct=='rampart')) {
                        minVal = val
                        finalX = x
                        finalY = y
                    }
                },x,y)
                if(minVal){
                    if("road"!=roomStructs.exec(finalX,finalY,"road")){
                        structMap["road"].push([finalX,finalY]);
                        dfsBack(finalX,finalY)
                    }
                }
                // visual.text(minVal,finalX,finalY+0.25, {color: "pink",opacity:0.99,font: 7})
            }
            dfsBack(e[0],e[1])
            structMap["road"].forEach(e=>costRoad.set(e[0],e[1],0))
        })

        // 可视化部分
        // allCacheMap[finalPos].forEach(t=>{
        //     visual.circle(t.x, t.y, {fill: "#33ff00", radius: 0.5 ,opacity : 0.03})
        // })
        // putAbleList.forEach(t=>{
        //     visual.circle(t.x, t.y, {fill: "#b300ff", radius: 0.5 ,opacity : 0.1})
        // })

        // roomStructs.init()
        // _.keys(CONTROLLER_STRUCTURES).forEach(struct=>structMap[struct].forEach(e=>roomStructs.set(e[0],e[1],struct)))


        // let t = Game.cpu.getUsed()
        // console.log(Game.cpu.getUsed()-t)
        pro.dismiss()

        // HelperVisual.showRoomStructures(roomName,structMap)

        // clog(roomName,structMap["extension"].length,structMap["spawn"].length,wallCnt,innerPutAbleList.length)
        return{
            roomName:roomName,
            storagePos:{storageX,storageY},
            // labPos:{labX,labY},
            structMap:structMap
        }

    },

};

export default {
    HelperVisual: helpervisual,
    ManagerPlanner: pro,
}

// export function () {
//     let roomStructsData = undefined //放全局变量

//     let p = Game.flags.p; // 触发器
//     let pa = Game.flags.pa;
//     let pb = Game.flags.pb;
//     let pc = Game.flags.pc;
//     let pm = Game.flags.pm;
//     if(p) {
//         roomStructsData = pro.computeManor(p.pos.roomName,[pc,pm,pa,pb])
//         Game.flags.p.remove()
//     }
//     if(roomStructsData){
//         //这个有点消耗cpu 不看的时候记得关
//         HelperVisual.showRoomStructures(roomStructsData.roomName,roomStructsData.structMap);
//         console.log(
//             roomStructsData
//         )
//     }
// }
