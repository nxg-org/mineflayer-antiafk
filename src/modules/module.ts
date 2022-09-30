import { Bot } from "mineflayer";
import { mergeDeepNoArrayConcat } from "../utils";



export interface AFKModuleOptions {
    enabled: boolean
}

export abstract class AFKModule {
    public isActive: boolean;

    public constructor(protected bot: Bot, public options: AFKModuleOptions = {enabled: false}) {
        this.isActive = false;
    }


    public abstract perform(): Promise<boolean>;
    public abstract cancel(): Promise<boolean>;
    

    public setOptions(options: Partial<AFKModuleOptions>): void {
        this.options = mergeDeepNoArrayConcat(this.options, options)
    }

    public complete(...any: any): void {
        this.isActive = false;
        this.signal("module_complete", ...any);
    };
    public signal(str: string, ...any: any) {
        this.bot.antiafk.emit(str, ...any)
    }
}