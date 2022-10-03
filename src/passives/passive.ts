import { Bot, BotEvents } from "mineflayer";
import { mergeDeepNoArrayConcat } from "../utils";


/**
 * I am aware that leaving eventWanted open to change invites bad practice.
 * However, it's been too long since I coded in typescript for me to remember a better way to do this.
 * I don't want enabled to be on the passive object itself.
 */
export interface AFKPassiveOptions {
    enabled: boolean;
    [others: string]: any
}


export abstract class AFKPassive {


    protected eventWanted: keyof BotEvents = "physicsTick";
    protected isActive: boolean = false;

    constructor(protected bot: Bot, public options: AFKPassiveOptions = {enabled: false}) {}


    public abstract listener: () => void;

    public begin() {
        if (this.isActive) return;
        this.isActive = true;
        this.bot.on(this.eventWanted, this.listener)
    };

    public stop() {
        if (!this.isActive) return;
        this.isActive = false;
        this.bot.removeListener(this.eventWanted, this.listener)
    }

    public setOptions(options: Partial<AFKPassiveOptions>, initial?: AFKPassiveOptions): void {
        // console.trace("fuck", this.constructor.name, options)
        this.options = mergeDeepNoArrayConcat(initial ?? this.options, options)
    }


    public toString(): string {
        return `${this.constructor.name}{isActive: ${this.isActive}}`
    }

}