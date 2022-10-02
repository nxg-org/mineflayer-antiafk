import EventEmitter from "events";
import { Bot } from "mineflayer";
import { AFKModule, AFKModuleOptions, ALL_MODULES, BlockBreakModuleOptions, ChatBotModuleOptions, WalkAroundModuleOptions } from "./modules";
import { ALL_PASSIVES } from "./passives";
import { KillAuraPassive, KillAuraPassiveOptions } from "./passives/killaura";
import { AFKPassive, AFKPassiveOptions } from "./passives/passive";
import { mergeDeepNoArrayConcat } from "./utils";



export class AntiAFKModuleOptions {
    constructor(
        public walkAround: Partial<WalkAroundModuleOptions> = { enabled: false },
        public chatBot: Partial<ChatBotModuleOptions> = { enabled: false },
        public randomMovement: Partial<AFKModuleOptions> = { enabled: false },
        public lookAround: Partial<AFKModuleOptions> = { enabled: false },
        public blockBreak: Partial<BlockBreakModuleOptions> = { enabled: false },
        // public blockPlace: Partial<AFKModuleOptions> = { enabled: false},
    ) {
    }

    public static basic(bot: Bot): AntiAFKModuleOptions {
        return new AntiAFKModuleOptions(
            { ...WalkAroundModuleOptions.standard(bot), enabled: true },
            { enabled: true }
        );
    }

    public static all(bot: Bot): AntiAFKModuleOptions {
        return new AntiAFKModuleOptions(
            { ...WalkAroundModuleOptions.standard(bot), enabled: true },
            { enabled: true },
            { enabled: true },
            { enabled: true },
            { enabled: true },
            // {enabled: true},
        )
    }
}

export class AntiAFKPassiveOptions {
    constructor(
        public killAura: Partial<KillAuraPassiveOptions> = { enabled: false },
        public eat: Partial<AFKPassiveOptions> = { enabled: false }
    ) { }

    public static basic() {
        return new AntiAFKPassiveOptions({ enabled: true, reach: 3 }, { enabled: true })
    }
}


export class AntiAFK extends EventEmitter {
    public modules: AFKModule[];
    public passives: AFKPassive[];
    public moduleOptions!: AntiAFKModuleOptions;
    public passiveOptions!: AntiAFKPassiveOptions;
    private lastModule: AFKModule | null;
    private shouldStop: boolean = false;


    constructor(private bot: Bot, moduleOptions?: Partial<AntiAFKModuleOptions>, passiveOptions?: Partial<AntiAFKPassiveOptions>) {
        super();
        this.modules = ALL_MODULES.map(mod => new mod(bot))
        this.passives = ALL_PASSIVES.map(passive => new passive(bot))
        this.setModuleOptions(moduleOptions ?? {}, AntiAFKModuleOptions.basic(bot));
        this.setPassiveOptions(passiveOptions ?? {}, AntiAFKPassiveOptions.basic());
        this.lastModule = null;
    }


    public setModuleOptions(options: Partial<AntiAFKModuleOptions>, initial?: AntiAFKModuleOptions) {
        this.moduleOptions = mergeDeepNoArrayConcat(initial ?? this.moduleOptions, options);
        for (const option in this.moduleOptions) {
            if (((this.moduleOptions as any)[option]).enabled == true) {
                const mod = this.modules.find(m => m.constructor.name.toLowerCase().includes(option.toLowerCase()));
                if (mod) mod.setOptions((this.moduleOptions as any)[option])
            }
        }
    }

    public setPassiveOptions(options: Partial<AntiAFKPassiveOptions>, initial?: AntiAFKPassiveOptions) {
        this.passiveOptions = mergeDeepNoArrayConcat(initial ?? this.passiveOptions, options);
        for (const option in this.passiveOptions) {
            if (((this.passiveOptions as any)[option]).enabled == true) {
                const mod = this.passives.find(p => p.constructor.name.toLowerCase().includes(option.toLowerCase()));
                if (mod) {
                    mod.setOptions((this.passiveOptions as any)[option])
                    if (this.isActive) mod.begin();
                }
            }
        }
        this.bot.autoEat.enabled = !!this.passiveOptions.eat.enabled
    }


    public get isActive(): boolean {
        return this.modules.some(e => e.isActive)
    }

    public get currentlyActive(): AFKModule | undefined {
        return this.modules.find(m => m.isActive);
    }


    private getLessRandomModule(): AFKModule {
        const passiveMods = this.modules.filter(m => !m.isActive && m.options.enabled && m != this.lastModule);
        return passiveMods[Math.floor(passiveMods.length * Math.random())]
    }

    public async start(): Promise<boolean> {
        this.shouldStop = false;
        while (!this.shouldStop) {
            this.lastModule = this.getLessRandomModule();
            this.bot.chat(this.lastModule.constructor.name)
            this.passives.map(p => p.options.enabled ? p.begin() : p.stop())
            await this.lastModule.perform();
        }
        return true;
    }


    public stop() {
        this.shouldStop = true;
        this.passives.map(p => p.stop())
    }


    public forceStop() {
        this.currentlyActive?.cancel();
        this.shouldStop = true;
    }



}