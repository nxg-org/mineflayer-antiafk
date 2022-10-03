import { Bot } from "mineflayer";
import { mergeDeepNoArrayConcat } from "../utils";



export interface AFKModuleOptions {
    enabled: boolean
    [other: string]: any
}

export abstract class AFKModule {
    public isActive: boolean;
    public options: AFKModuleOptions;

    public constructor(protected bot: Bot, options?: AFKModuleOptions) {
        this.isActive = false;
        this.options = options ?? {enabled: false};
    }

    public abstract perform(): Promise<boolean>;
    public abstract cancel(): Promise<boolean>;
    

    public setOptions(options: Partial<AFKModuleOptions>): void {
        // console.trace("fuck", this.constructor.name, options)
        this.options = mergeDeepNoArrayConcat(this.options, options)
    }

    public complete(...any: any): void {
        this.isActive = false;
        this.signal("module_complete", ...any);
    };
    public signal(str: string, ...any: any) {
        this.bot.antiafk.emit(str, ...any)
    }

    public toString(): string {
        return `${this.constructor.name}{isActive: ${this.isActive}}`
    }

}