import EventEmitter from "events";
import { Bot } from "mineflayer";
import { ALL_MODULES } from "./modules";
import { ChatBotModuleOptions } from "./modules/chatBot";
import { AFKModule, AFKModuleOptions } from "./modules/module";
import { WalkAroundModuleOptions } from "./modules/walkAround";
import { mergeDeepNoArrayConcat } from "./utils";



export class AntiAFKOptions {
    constructor(
        public walkAround: Partial<WalkAroundModuleOptions> = { enabled: false },
        public chatBot: Partial<ChatBotModuleOptions> = { enabled: false },
        public randomMovement: Partial<AFKModuleOptions> = { enabled: false },
        public lookAround: Partial<AFKModuleOptions> = { enabled: false },
        public eat: Partial<AFKModuleOptions> = { enabled: false },
    ) {
    }

    public static basic(bot: Bot): AntiAFKOptions {
        return new AntiAFKOptions(
            { ...WalkAroundModuleOptions.standard(bot), enabled: true },
            { enabled: true }
        );
    }

    public static all(bot: Bot): AntiAFKOptions {
        return new AntiAFKOptions(
            { ...WalkAroundModuleOptions.standard(bot), enabled: true },
            { enabled: true },
            { enabled: true },
            { enabled: true },
            { enabled: true }
        )
    }




}


export class AntiAFK extends EventEmitter {

    public options: AntiAFKOptions;
    public modules: AFKModule[];
    private shouldStop: boolean = false;


    constructor(private bot: Bot, options?: Partial<AntiAFKOptions>) {
        super();
        this.options = !!options ? mergeDeepNoArrayConcat(AntiAFKOptions.basic(bot), options) : AntiAFKOptions.basic(bot);
        this.modules = ALL_MODULES.map(mod => new mod(bot))
    }


    public setOptions(options: Partial<AntiAFKOptions>) {
        this.options = mergeDeepNoArrayConcat(this.options, options);
        for (const option in this.options) {
            if (((this.options as any)[option]).enabled == true) {
                const mod = this.modules.find(m => m.constructor.name.toLowerCase().includes(option.toLowerCase()));
                if (mod) mod.setOptions((this.options as any)[option])
            }

        }
    }


    public get isActive(): boolean {
        return this.modules.some(e => e.isActive)
    }

    public get currentlyActive(): AFKModule | undefined {
        return this.modules.find(m => m.isActive);
    }


    private getLessRandomModule(): AFKModule {
        const passiveMods = this.modules.filter(m => !m.isActive && m.options.enabled);
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