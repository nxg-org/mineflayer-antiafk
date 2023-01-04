import { Bot, BotEvents } from "mineflayer";
import { customMerge } from "../utils";


/**
 * I am aware that leaving eventWanted open to change invites bad practice.
 * However, it's been too long since I coded in typescript for me to remember a better way to do this.
 * I don't want enabled to be on the passive object itself.
 */
export interface AFKPassiveOptions {
    enabled: boolean;
    [other: string]: any
}


    export abstract class AFKPassive<T extends AFKPassiveOptions> {
        protected eventWanted: keyof BotEvents = "physicsTick";
        protected isActive: boolean = false;
        public options: T;

        constructor(protected bot: Bot, options: Partial<T>) {
            this.options = customMerge({enabled: false}, options);
        }


        /**
         * TODO: Make listener's parameter match the BotEvents[eventWanted] function's parameters.
         * Probably not doable.
         */
        public abstract listener: BotEvents[AFKPassive<T>["eventWanted"]];

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
            this.options = customMerge(initial ?? this.options, options)
        }

        public toString(): string {
            return `${this.constructor.name}{isActive: ${this.isActive}}`
        }

    }