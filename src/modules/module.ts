import { Bot } from "mineflayer";
import { mergeDeepNoArrayConcat } from "../utils";



export interface AFKModuleOptions {
    enabled: boolean
    [other: string]: any
}

export abstract class AFKModule {
    public isActive: boolean;
    
    public constructor(protected bot: Bot, public options: AFKModuleOptions = {enabled: false}) {
        this.isActive = false;
    }

    public async perform(): Promise<boolean> {
        this.isActive = true;
        return true;

    }
    public abstract cancel(): Promise<boolean>;
    

    /**
     * Set options of current module.
     * @param options 
     * @param initial 
     */
    public setOptions(options: Partial<AFKModuleOptions>, initial?: AFKModuleOptions): void {
        this.options = mergeDeepNoArrayConcat(initial ?? this.options, options)
    }

    public complete(...any: any[]): void {
        this.isActive = false;
        this.signal("module_complete", ...any);
    };
    public signal(str: string, ...any: any[]) {
        this.bot.antiafk.emit(str, this, ...any)
    }

    public toString(): string {
        return `${this.constructor.name}{isActive: ${this.isActive}}`
    }

}