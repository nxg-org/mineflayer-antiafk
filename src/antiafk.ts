import EventEmitter from "events";
import { Bot } from "mineflayer";
import { ALL_MODULES } from "./modules";
import { ChatBotModuleOptions } from "./modules/chatBot";
import { AFKModule } from "./modules/module";
import { WalkModuleOptions } from "./modules/walkAround";



export class AntiAFKOptions {
    constructor(
        public walk?: Partial<WalkModuleOptions>,
        public chat?: Partial<ChatBotModuleOptions>,
        public jump: boolean = false,
        public spin: boolean = false,
        public click: boolean = false,


    ) {
    }

    public static basic(): AntiAFKOptions {
        return new AntiAFKOptions();
    }

    public static all(): AntiAFKOptions {
        return new AntiAFKOptions({}, {}, true, true, true)
    }

}


export class AntiAFK extends EventEmitter {

    public options: AntiAFKOptions;
    public modules: AFKModule[];
    private shouldStop: boolean = false;


    constructor(private bot: Bot, options?: Partial<AntiAFKOptions>) {
        super();
        this.options = { ...AntiAFKOptions.basic(), ...options };
        this.modules = ALL_MODULES.map(mod => new mod(bot))
    }


    public setOptions(options: Partial<AntiAFKOptions>) {
        this.options = { ...this.options, ...options };
    }


    public get isActive(): boolean {
        return this.modules.some(e => e.isActive)
    }

    public get currentlyActive(): AFKModule | undefined {
        return this.modules.find(m => m.isActive);
    }


    private getLessRandomModule(): AFKModule {
        const passiveMods = this.modules.filter(m => !m.isActive);
        return passiveMods[Math.floor(passiveMods.length * Math.random())]
    }

    public async start(): Promise<boolean> {
        if (this.isActive) return false;
        this.shouldStop = false;
        while (!this.shouldStop) {
            let test = this.getLessRandomModule();
            this.bot.chat(test.constructor.name);
            await test.perform();
        }
        return true;
    }


    public stop() {
        this.shouldStop = true;
    }


    public forceStop() {
        this.currentlyActive?.cancel();
        this.shouldStop = true;
    }



}