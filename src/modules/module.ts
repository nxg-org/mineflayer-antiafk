import { Bot } from "mineflayer";

export abstract class AFKModule {
    public isActive: boolean;

    public constructor(protected bot: Bot) {
        this.isActive = false;
    }


    public abstract perform(): Promise<boolean>;
    public abstract cancel(): Promise<boolean>;
    
    public complete(...any: any): void {
        this.isActive = false;
        this.signal("module_complete", ...any);
    };
    public signal(str: string, ...any: any) {
        this.bot.antiafk.emit(str, ...any)
    }
}