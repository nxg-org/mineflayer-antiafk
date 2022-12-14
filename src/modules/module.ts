import { Bot } from "mineflayer";
import { customMerge as customMerge } from "../utils";
import type { AntiAFK } from "../antiafk";


export interface AFKModuleOptions {
    enabled: boolean
    [other: string]: any
}

export abstract class AFKModule<T extends AFKModuleOptions> {
    /**
     * Whether or not the module should currently be running.
     */
    public isActive: boolean;

    /**
     * Helper "breaking boolean" from running while loops.
     * Use this to make {@link AntiAFK.prototype.forceStop | forceStop()} more effective.
     */
    protected shouldCancel: boolean = false;

    /**
     * Options for module.
     * Note: This is usually overriden. Just a default.
     */
    public options: T


    public constructor(protected bot: Bot,  options: Partial<T>) {
        this.isActive = false;
        this.options = customMerge({enabled: false}, options)
    }

    /**
     * Function to perform when entering module.
     * When implementing, always call super.perform() OR set isActive to true.
     * @returns {boolean} Whether module's action succeeded or not.
     */
    public async perform(): Promise<boolean> {
        this.isActive = true;
        return true;

    }

    /**
     * Force cancel the module by setting {@link AFKModule.prototype.shouldCancel | shouldCancel} to true.
     * When implementing a module, all loops should break at {@link AFKModule.prototype.shouldCancel | shouldCancel} being true.
     * @returns {boolean} Whether or not cancellation of module completed successfully.
     */
    public async cancel(): Promise<boolean> {
        this.shouldCancel = true;
        this.complete(false)
        return true;
    }
    
    /**
     * Set options of current module.
     * @param {Partial<AFKModuleOptions> options Options for module.
     * @param {AFKModuleOptions} initial Initial options for module,
     *     {@link AFKModule.prototype.options | already specified options} if not.
     */
    public setOptions(options: Partial<AFKModuleOptions>, initial?: AFKModuleOptions): void {
        this.options = customMerge(initial ?? this.options, options)
    }


    /**
     * Handle completion of module
     * @param toEmit 
     */
    public complete(success: boolean, ...toEmit: any[]): void {
        this.isActive = false;
        this.signal("moduleCompleted", success, ...toEmit);
    };

    /**
     * Signal completion of module.
     * @param {string} msg Name of event 
     * @param {...any[]} any Other data to send.
     */
    public signal(msg: string, ...any: any[]) {
        this.bot.antiafk.emit("custom", msg, this, ...any)
    }

    public toString(): string {
        return `${this.constructor.name}{isActive: ${this.isActive}}`
    }

}
