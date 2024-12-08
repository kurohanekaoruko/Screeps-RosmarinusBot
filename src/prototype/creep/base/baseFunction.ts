/**
 * 一些基础的功能
 */
export default class BaseFunction extends Creep {
    /**
     * 获取能量
     */
    withdrawEnergy(pickup: boolean = true) {   // builder、upgrader、repairer 的能量获取
        const updateTakeTarget = () => {
            if (this.memory.cache.takeTarget) return false;

            const target = (pickup ? findDroppedResourceTarget(500) : null) ||
                           findStructureTarget() ||
                           findRuinTarget();

            if (target) {
                this.memory.cache.takeTarget = target;
                return true;
            }
            return false;
        };

        const handleExistingTarget = () => {
            if (!this.memory.cache.takeTarget) return false;

            const target = Game.getObjectById(this.memory.cache.takeTarget.id) as any;
            if (!target) {
                this.memory.cache.takeTarget = null;
                return false;
            }

            const type = this.memory.cache.takeTarget.type;
            if (type === 'dropped') {
                if (target.amount <= 0) {
                    this.memory.cache.takeTarget = null;
                    return false;
                }
                this.pickupOrMoveTo(target);
                return true;
            }
            if (type === 'structure' || type === 'ruin') {
                if (!target.store || target.store[RESOURCE_ENERGY] <= 0) {
                    this.memory.cache.takeTarget = null;
                    return false;
                }
                this.withdrawOrMoveTo(target, RESOURCE_ENERGY);
                return true;
            }
            return false;
        };

        const findStructureTarget = () => {
            const target = [];
            const storage = this.room.storage;
            const terminal = this.room.terminal;
            const link = this.room.link;
            const container = this.room.container;
            if (storage && storage.store[RESOURCE_ENERGY] >= 10000) {
                target.push(storage);
            }
            if (terminal && terminal.store[RESOURCE_ENERGY] >= 10000) {
                target.push(terminal);
            }
            for(const l of link) {
                if (l && l.store[RESOURCE_ENERGY] >= 400) {
                    target.push(l);
                }
            }
            for(const c of container) {
                if (c && c.store[RESOURCE_ENERGY] >= 500) {
                    target.push(c);
                }
            }
            const closestTarget = this.pos.findClosestByRange(target);
            return closestTarget ? { id: closestTarget.id, type: 'structure' } : null;
        }

        const findDroppedResourceTarget = (amount = 50) => {
            const droppedResources = this.room.find(FIND_DROPPED_RESOURCES, {
                filter: resource => resource.resourceType === RESOURCE_ENERGY && resource.amount >= amount
            });
            const closestDroppedEnergy = this.pos.findClosestByRange(droppedResources);
            return closestDroppedEnergy
                ? { id: closestDroppedEnergy.id, type: 'dropped' }
                : null;
        };

        const findRuinTarget = () => {
            const ruins = this.room.find(FIND_RUINS, {
                filter: r => r && r.store[RESOURCE_ENERGY] > 0
            });
            const closestRuin = this.pos.findClosestByRange(ruins);
            return closestRuin
                ? { id: closestRuin.id, type: 'ruin' }
                : null;
        };

        const harvestEnergy = () => {
            if (this.room.level > 4) return false;
            if (!this.memory.cache.targetSourceId) {
                const targetSource = this.room.source.find((source) => source.energy > 0);
                if (targetSource) {
                    this.memory.cache.targetSourceId = targetSource.id;
                } else return false;
            }

            const targetSource = Game.getObjectById(this.memory.cache.targetSourceId) as Source;
            if (!targetSource || targetSource.energy <= 0) {
                this.memory.cache.targetSourceId = null;
                return false;
            }

            if (this.pos.inRangeTo(targetSource, 1)) {
                return this.harvest(targetSource) === OK;
            } else {
                this.moveTo(targetSource, { visualizePathStyle: { stroke: '#ffaa00' } });
                return true;
            }
        };

        updateTakeTarget();   // 更新目标
        if (handleExistingTarget()) return;    // 拿取能量
        else harvestEnergy();    // 采集能量
    }

    /**
     * 强化 creep
     * @param {Array<string>} boostTypes - 强化的资源类型数组
     * @param {boolean} must - 是否必须强化
     * @returns {boolean} - 是否成功强化或结束强化
     */
    goBoost(boostTypes: Array<string>, must: boolean = false) {
        // 检查需要强化的部件是否都已经被强化
        const allRequiredPartsAreBoosted = this.body.every(part => 
            !boostTypes.some(boostType => BOOSTS[part.type] && boostType in BOOSTS[part.type]) || part.boost
        );
        if (allRequiredPartsAreBoosted) {
            return true;  // 所有需要强化的部件都已强化，返回true
        }
        // 查找有足够指定资源的lab
        const labs = this.room.lab.filter((lab) => 
            lab.mineralType &&
            boostTypes.includes(lab.mineralType) &&
            lab.store[lab.mineralType] >= 100
        );
        if(labs.length == 0) return !must;
        // 过滤掉对应部件已强化满的lab
        const availableLabs = labs.filter(lab => {
            return this.body.some(part => BOOSTS[part.type] && lab.mineralType in BOOSTS[part.type] && !part.boost);
        });
        if (availableLabs.length == 0) return !must;

        // 按照输入的优先级顺序选择lab
        const prioritizedLabs = availableLabs.sort((a, b) => {
            for (let type of boostTypes) {
                if (a.mineralType === type && b.mineralType !== type) return -1;
                if (b.mineralType === type && a.mineralType !== type) return 1;
            }
            return 0;
        });

        const closestLab = this.pos.findClosestByRange(prioritizedLabs);
        if(!closestLab) return !must;
        
        // 如果creep不在lab旁边，移动到lab
        if (!this.pos.isNearTo(closestLab)) {
            this.moveTo(closestLab, { visualizePathStyle: { stroke: '#ffffff' } });
            return false;
        }
        
        // 尝试强化
        let result = closestLab.boostCreep(this);
        if (result == OK) return false;
        
        // 如果强化失败，重试多次后放弃
        if (!this.memory.boostAttempts) {
            this.memory.boostAttempts = 1;
        } else {
            this.memory.boostAttempts++;
        }
        
        if (this.memory.boostAttempts >= 5 || !must) {
            // 重试5次后放弃强化
            delete this.memory.boostAttempts;
            return true;
        }
        
        return false; // 继续尝试强化
    }
    unboost() {
        if(!this.body.some(part => part.boost)) return false;

        let lab = null;
        let container = this.room.container.find((c) => {
            return !!this.room.lab.find((l) => {
                if(!c.pos.isNear(l.pos) || l.cooldown > 0)
                    return false;
                lab = l;
                return true;
            });
        })

        if (!container || !lab) return false;
        if (this.pos.isEqual(container.pos)) {
            return lab.unboostCreep(this) === OK;
        } else {
            this.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' } });
            return false;
        }
    }
    /**
     * 向指定结构转移资源
     */
    transferOrMoveTo(target: AnyCreep | Structure, resoureType: ResourceConstant, amount?: number): boolean {
        if (!target) return false; // 如果没有目标，返回 false
        if (this.pos.isNearTo(target)) {
            this.transfer(target, resoureType, amount);
        } else {
            this.moveTo(target, {
                visualizePathStyle: { stroke: '#ffffff' },
                maxRooms: 1,
                range: 1
            });
        }
        return true;
    };
    /**
     * 从指定结构中提取资源
     */
    withdrawOrMoveTo(target: any | Tombstone | Ruin, resourceType?: ResourceConstant, ...args: any[]): boolean {
        if (!target) return false; // 如果没有目标，返回 false
        if (this.pos.isNearTo(target)) {
            if (!resourceType) resourceType = Object.keys(target.store)[0] as ResourceConstant;
            this.withdraw(target, resourceType, ...args);
        } else {
            this.moveTo(target, {
                visualizePathStyle: { stroke: '#ffaa00' },
                maxRooms: 1,
                range: 1
            });
        }
        return true;
    };
    /**
     * 拾取掉落资源
     */
    pickupOrMoveTo(target: Resource): boolean {
        if (!target) return false; // 如果没有目标，返回 false
        if (this.pos.isNearTo(target)) {
            this.pickup(target);
        } else {
            this.moveTo(target, {
                visualizePathStyle: { stroke: '#ffaa00' },
                maxRooms: 1,
                range: 1
            });
        }
        return true;
    }
    repairOrMoveTo(target: Structure): boolean {
        if (!target) return false; // 如果没有目标，返回 false
        if (this.pos.inRangeTo(target, 3)) {
            this.repair(target);
        } else {
            this.moveTo(target, {
                visualizePathStyle: { stroke: '#ffaa00' },
                maxRooms: 1,
                range: 3
            });
        }
        return true;
    }
    buildOrMoveTo(target: ConstructionSite) {
        if (!target) return false; // 如果没有目标，返回 false
        if (this.pos.inRangeTo(target, 3)) {
            this.build(target);
        } else {
            this.moveTo(target, {
                visualizePathStyle: { stroke: '#ffaa00' },
                maxRooms: 1,
                range: 3
            });
        }
        return true;
    }
}
