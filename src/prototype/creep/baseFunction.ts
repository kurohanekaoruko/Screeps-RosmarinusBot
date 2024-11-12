/**
 * 一些基础的功能
 */
export default class BaseFunction extends Creep {
    /**
     * 获取能量
     */
    takeEnergy() {   // builder、upgrader、repairer 的能量获取
        const updateTakeTarget = () => {
            if (this.memory.cache.takeTarget) return false;

            const target = findDroppedResourceTarget(500) ||
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

            const target = Game.getObjectById(this.memory.cache.takeTarget.id);
            if (!target) {
                this.memory.cache.takeTarget = null;
                return false;
            }

            const { type } = this.memory.cache.takeTarget;
            if (type === 'dropped') {
                return handleDroppedTarget(target);
            } else if (type === 'structure' || type === 'ruin') {
                return handleStructureTarget(target);
            }
            return false;
        };

        const handleDroppedTarget = (target) => {
            if (target.amount <= 0) {
                this.memory.cache.takeTarget = null;
                return false;
            }
            return this.pickupOrMoveTo(target);
        };

        const handleStructureTarget = (target) => {
            if (!target.store || target.store[RESOURCE_ENERGY] <= 0) {
                this.memory.cache.takeTarget = null;
                return false;
            }
            return this.withdrawOrMoveTo(target, RESOURCE_ENERGY);
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
                if (l && l.store[RESOURCE_ENERGY] >= 100) {
                    target.push(l);
                }
            }
            for(const c of container) {
                if (c && c.store[RESOURCE_ENERGY] >= 200) {
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
            if (!this.memory.cache.targetSourceId) {
                const targetSource = this.room.closestSource(this);
                if (targetSource) {
                    this.memory.cache.targetSourceId = targetSource.id;
                } else {
                    return false;
                }
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

        if (updateTakeTarget()) return;    // 更新目标
        if (handleExistingTarget()) return;    // 拿取能量
        harvestEnergy();    // 采集能量
    }

    /**
     * 强化 creep
     * @param {Array<string>} boostTypes - 强化的资源类型数组
     * @returns {boolean} - 是否成功强化
     */
    boost(boostTypes: Array<string>) {
        // 查找有足够指定资源的lab
        const labs = this.room.lab.filter((lab) => 
            lab.mineralType &&
            boostTypes.includes(lab.mineralType) &&
            lab.store[lab.mineralType] >= 30
        );
        if(labs.length == 0) return true;
        // 过滤掉对应部件已强化满的lab
        const availableLabs = labs.filter(lab => {
            return this.body.some(part => BOOSTS[part.type] && lab.mineralType in BOOSTS[part.type] && !part.boost);
        });
        if (availableLabs.length == 0) return true;

        // 按照输入的优先级顺序选择lab
        const prioritizedLabs = availableLabs.sort((a, b) => {
            for (let type of boostTypes) {
                if (a.mineralType === type && b.mineralType !== type) return -1;
                if (b.mineralType === type && a.mineralType !== type) return 1;
            }
            return 0;
        });
        const closestLab = prioritizedLabs[0];

        if(!closestLab) return true;
        
        // 如果creep不在lab旁边，移动到lab
        if (!this.pos.isNearTo(closestLab)) {
            this.moveTo(closestLab, { visualizePathStyle: { stroke: '#ffffff' } });
            return false;
        }
        
        // 尝试强化
        let result = closestLab.boostCreep(this);
        // 如果强化成功，检查是否已经完全强化
        if (result == OK) {
            // 检查需要强化的部件是否都已经被强化
            const allRequiredPartsAreBoosted = this.body.every(part => 
                !boostTypes.some(boostType => BOOSTS[part.type] && boostType in BOOSTS[part.type]) || part.boost
            );
            if (allRequiredPartsAreBoosted) {
                return true;  // 所有需要强化的部件都已强化，返回true
            }
            // 如果还有未强化的部件，继续尝试强化
            return false;
        }
        
        // 如果强化失败，重试多次后放弃
        if (!this.memory.boostAttempts) {
            this.memory.boostAttempts = 1;
        } else {
            this.memory.boostAttempts++;
        }
        
        if (this.memory.boostAttempts >= 5) {
            // 重试5次后放弃强化
            delete this.memory.boostAttempts;
            return true;
        }
        
        return false; // 继续尝试强化
    }
    unboost() {
        if(!this.body.some(part => part.boost)) return false;
        
        const labContainer = this.room.container.find((container) => {
            const lab = this.room.lab.find((lab) => { return container.pos.isNear(lab.pos) });
            return lab;
        });
        if (!labContainer) return false;
        if (this.pos.isEqual(labContainer.pos)) {
            const lab = this.room.lab.find((lab) => {
                return this.pos.isNear(lab.pos) && lab.cooldown == 0;
            })
            return lab.unboostCreep(this) === OK;
        } else {
            this.moveTo(labContainer, { visualizePathStyle: { stroke: '#ffffff' } });
            return true;
        }
    }
}
