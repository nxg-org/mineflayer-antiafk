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

    public async perform(): Promise<boolean> {
        this.isActive = true;
        return true;

    }
    public async cancel(): Promise<boolean> {
        this.isActive = false;
        this.complete(false);
        return true;
    }
    

    public setOptions(options: Partial<AFKModuleOptions>, initial?: AFKModuleOptions): void {
        // console.trace("fuck", this.constructor.name, options)
        this.options = mergeDeepNoArrayConcat(initial ?? this.options, options)
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