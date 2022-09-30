import { Bot } from "mineflayer";
import { sleep } from "../utils";
import { AFKModule } from "./module";


export interface ChatBotModuleOptions {
    messages: string[];
    delay: number;
    variation: number;
}


export class ChatBotModule extends AFKModule {
    public options: ChatBotModuleOptions;
    private shouldCancel: boolean = false;

    public constructor(bot: Bot, options?: Partial<ChatBotModuleOptions>) {
        super(bot);
        this.options = { messages: ["NextGEN Anti-afk Module"], delay: 1200, variation: 150, ...options };

    }


    public async perform(): Promise<boolean> {
        this.shouldCancel = false;
        let message: string;
        let i = 0;
        while (i < this.options.messages.length && !this.shouldCancel) {
            let index = Math.floor(this.options.messages.length * Math.random());
            message = this.options.messages[index];
            this.bot.chat(message);
            await sleep(this.options.delay + this.options.variation * Math.random() > 0.5 ? -Math.random() : Math.random())
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