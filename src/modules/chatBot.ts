import { Bot } from "mineflayer";
import { mergeDeepNoArrayConcat, sleep } from "../utils";
import { AFKModule, AFKModuleOptions } from "./module";


export interface ChatBotModuleOptions extends AFKModuleOptions {
    messages: string[];
    random: boolean;
    delay: number;
    variation: number;
}


export class ChatBotModule extends AFKModule {
    public options: ChatBotModuleOptions;
    private shouldCancel: boolean = false;

    public constructor(bot: Bot, options?: Partial<ChatBotModuleOptions>) {
        super(bot);
        const tmp = { enabled: false, messages: ["NextGEN Anti-afk Module"], random: false, delay: 1200, variation: 150};
        this.options = !! options ? mergeDeepNoArrayConcat(tmp, options): tmp;

    }

    public async perform(): Promise<boolean> {
        super.perform();
        this.shouldCancel = false;
        let i = 0;
        while (i < this.options.messages.length && !this.shouldCancel) {
            this.bot.chat(this.options.messages[this.options.random ? Math.floor(this.options.messages.length * Math.random()) : i]);
            await sleep(this.options.delay + (this.options.variation * (Math.random() > 0.5 ? -Math.random() : Math.random())))
            i++;

        }
        this.complete(true);
        return true;
    }


    public async cancel(): Promise<boolean> {
        this.shouldCancel = true;

        this.complete(false);
        return true;
    }





}