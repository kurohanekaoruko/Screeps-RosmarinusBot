export default class BaseFunction extends PowerCreep {
    PowerEnabled(): boolean {
        const controller = this.room?.controller;
        if(controller?.my && !controller.isPowerEnabled) {
            if(this.pos.isNearTo(controller)) this.enableRoom(controller);
            else this.moveTo(controller)
            return true;
        }
        return false
    }
    transferOPS(): boolean {
        if (this.store.getFreeCapacity() === 0 && this.store[RESOURCE_OPS] > 200) {
            const halfOps = Math.floor(this.store[RESOURCE_OPS] / 2);
            const amount = Math.max(halfOps, this.store[RESOURCE_OPS] - 200);
            if (amount <= 0) return false;
            if (this.pos.isNearTo(this.room.storage)) {
                this.transfer(this.room.storage, RESOURCE_OPS, amount);
            } else {
                this.moveTo(this.room.storage);
            }
            return true;
        }
        if(this.ticksToLive < 50 && this.store[RESOURCE_OPS] > 0) {
            if (this.pos.isNearTo(this.room.storage)) {
                this.transfer(this.room.storage, RESOURCE_OPS);
            } else {
                this.moveTo(this.room.storage);
            }
        }
        return false;
    }
    withdrawOPS(amount: number = 200): boolean {
        if(this.store[RESOURCE_OPS] < amount && 
            (this.room.storage?.store[RESOURCE_OPS] > amount || this.room.terminal?.store[RESOURCE_OPS] > amount)) {
            const target = this.room.storage?.store[RESOURCE_OPS] > amount ? this.room.storage : this.room.terminal;
            if(this.pos.isNearTo(target)) {
                this.withdraw(target, RESOURCE_OPS, amount - this.store[RESOURCE_OPS]);
            } else {
                this.moveTo(target);
            }
            return true;
        }
        return false
    }
    ToRenew(): boolean {
        if(this.ticksToLive > 300) return false;
        if(this.room.controller?.my && this.room.powerSpawn) {
            const powerSpawn = this.room.powerSpawn;
            if(this.pos.isNearTo(powerSpawn)) {
                this.renew(powerSpawn);
            } else {
                this.moveTo(powerSpawn);
            }
            return true;
        }
        if(!(/^[EW]\d*[1-9][NS]\d*[1-9]$/.test(this.room.name))) {
            const powerBank = this.room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_POWER_BANK})[0] as StructurePowerBank;
            if(this.pos.isNearTo(powerBank)) {
                this.renew(powerBank);
            } else {
                this.moveTo(powerBank);
            }
            return true;
        }
        return false;
    }
    transferPower() {
        if (this.store[RESOURCE_POWER] >= 100) {
            const powerSpawn = this.room.powerSpawn;
            if (!powerSpawn) return;
            if (powerSpawn.store[RESOURCE_POWER] > 60) return;
            if (this.pos.isNearTo(powerSpawn)) {
                this.transfer(powerSpawn, RESOURCE_POWER);
            } else {
                this.moveTo(powerSpawn);
            }
        } else {
            const storage = this.room.storage;
            if (!storage) return;
            if (storage.store[RESOURCE_POWER] < 100) return;
            if (this.pos.isNearTo(storage)) {
                const amount = Math.min(100, this.store.getFreeCapacity());
                this.withdraw(storage, RESOURCE_POWER, amount);
            } else {
                this.moveTo(storage);
            }
        }
        return true;
    }
}