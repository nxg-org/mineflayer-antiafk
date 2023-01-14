import { Bot } from "mineflayer";
import { customMerge, sleep } from "../utils";
import { AFKModule, AFKModuleOptions } from "./module";


export interface ChatBotModuleOptions extends AFKModuleOptions {
    messages: string[];
    random: boolean;
    delay: number;
    variation: number;
}

const tmp = { enabled: false, messages: ["NextGEN Anti-afk Module"], random: false, delay: 3000, variation: 150};

export class ChatBotModule extends AFKModule<ChatBotModuleOptions> {
    public constructor(bot: Bot, options: Partial<ChatBotModuleOptions> = {}) {
        super(bot, customMerge(tmp, options));
    }

    public override async perform(): Promise<boolean> {
        super.perform();
        let i = 0;
        while (i < this.options.messages.length && !this.shouldCancel) {
            this.bot.chat(this.options.messages[this.options.random ? Math.floor(this.options.messages.length * Math.random()) : i]);
            await sleep(this.options.delay + (this.options.variation * (Math.random() > 0.5 ? -Math.random() : Math.random())))
            i++;
        }
        this.complete(true);
        return true;
    }
}