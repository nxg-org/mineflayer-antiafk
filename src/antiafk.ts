import EventEmitter from "events";
import { Bot } from "mineflayer";
import { AFKModule, AFKModuleOptions, ALL_MODULES, BlockBreakModuleOptions, ChatBotModuleOptions, WalkAroundModuleOptions } from "./modules";
import { ALL_PASSIVES } from "./passives";
import { KillAuraPassive, KillAuraPassiveOptions } from "./passives/killaura";
import { AFKPassive, AFKPassiveOptions } from "./passives/passive";
import { AFKConstructor, mergeDeepNoArrayConcat } from "./utils";



export type NewAntiAFKModuleOptions = { [key: string]: AFKModuleOptions }
export type NewAntiAFKPassiveOptions = { [key: string]: AFKPassiveOptions }

export const MODULE_DEFAULT_SETTINGS = (bot: Bot) => {
    return {
        WalkAroundModule: {
            enabled: true,
            newChunks: true,
            rotateChunks: true,
            searchRadius: 8
        },
        ChatBotModule: {
            enabled: true,
            random: false,
            messages: ["test", "test1", "test2"],
            delay: 1000,
            variation: 300
        },
        LookAroundModule: {
            enabled: true
        },
        RandomMovementModule: {
            enabled: true
        },
        BlockBreakModule: {
            enabled: true,
            // locate all easily broken blocks via this method.
            preferBlockIds: Object.values(bot.registry.blocks).filter(b => b.hardness && b.hardness >= 0.5).map(b => b.id)
        },
    }
}

export const PASSIVE_DEFAULT_SETTINGS = {
    KillAuraPassive: {
        enabled: true,
        multi: true,
        reach: 5
    },
    eat: {
        enabled: true
    }
}


export class AntiAFK extends EventEmitter {
    public modules: AFKModule[];
    public passives: AFKPassive[];
    public moduleOptions!: NewAntiAFKModuleOptions;
    public passiveOptions!: NewAntiAFKPassiveOptions;
    private lastModule: AFKModule | null;
    private shouldStop: boolean = false;


    constructor(private bot: Bot, moduleOptions?: NewAntiAFKModuleOptions, passiveOptions?: NewAntiAFKPassiveOptions) {
        super();
        this.modules = ALL_MODULES.map(mod => new mod(bot))
        this.passives = ALL_PASSIVES.map(passive => new passive(bot))
        this.setModuleOptions(moduleOptions ?? {}, MODULE_DEFAULT_SETTINGS(bot));
        this.setPassiveOptions(passiveOptions ?? {}, PASSIVE_DEFAULT_SETTINGS);
        this.lastModule = null;
    }


    public get isActive(): boolean {
        return this.modules.some(e => e.isActive)
    }

    public get currentlyActive(): AFKModule | undefined {
        return this.modules.find(m => m.isActive);
    }


    public setModuleOptions(options: Partial<NewAntiAFKModuleOptions>, initial?: NewAntiAFKModuleOptions) {
        // console.log(initial, options, this.moduleOptions)
        this.moduleOptions = mergeDeepNoArrayConcat(initial ?? this.moduleOptions, options);

        // console.log("fuck me: ", this.moduleOptions);

        for (const option in this.moduleOptions) {
            if (this.moduleOptions[option]) {
                const mod = this.modules.find(m => m.constructor.name == option);
                if (mod) mod.setOptions(this.moduleOptions[option])
            } else {

            }
        }
    }

    public setOptionsForModule(module: AFKConstructor<AFKModule>, settings: AFKModuleOptions) {
        this.moduleOptions[module.name] = settings;
        this.modules.find(m => m.constructor.name == module.constructor.name)?.setOptions(settings);
    }

    public setPassiveOptions(options: Partial<NewAntiAFKPassiveOptions>, initial?: NewAntiAFKPassiveOptions) {
        this.passiveOptions = mergeDeepNoArrayConcat(initial ?? this.passiveOptions, options);
        for (const option in this.passiveOptions) {
            if (this.passiveOptions[option]) {
                const mod = this.passives.find(p => p.constructor.name == option);
                if (mod) {
                    mod.setOptions(this.passiveOptions[option])
                    if (this.isActive) mod.begin();
                }
            }
        }
        this.bot.autoEat.enabled = !!this.passiveOptions.eat.enabled
    }

    public setOptionsForPassive(passive: AFKConstructor<AFKPassive>, settings: AFKPassiveOptions) {
        this.passiveOptions[passive.name] = settings;
        this.passives.find(m => m.constructor.name == passive.constructor.name)?.setOptions(settings);
    }

    public addModules(...mods: AFKConstructor<AFKModule>[]) {
        let names = this.modules.map(m => m.constructor.name);
        let toMake = mods.filter(m => !names.includes(m.name))
        let toMakeNames = toMake.map(m => m.name);
        toMake.map(m => this.moduleOptions[m.name] ??= { enabled: true });
        Object.entries(this.moduleOptions).filter(([nme, val]) => toMakeNames.includes(nme)).map(([nme, val]) => val.enabled = true);
        this.modules = this.modules.concat(toMake.map(m => new m(this.bot, this.moduleOptions[m.name])))
    }

    public removeModules(...mods: AFKConstructor<AFKModule>[]) {
        let names = mods.map(m => m.name);
        names.map(nme => this.moduleOptions[nme] ??= { enabled: false });
        Object.entries(this.moduleOptions).filter(([nme, val]) => names.includes(nme)).map(([nme, val]) => val.enabled = false);
        this.modules = this.modules.filter(m => !names.includes(m.constructor.name))
    }

    public addPassives(...passives: AFKConstructor<AFKPassive>[]) {
        let names = this.passives.map(m => m.constructor.name);
        let toMake = passives.filter(m => !names.includes(m.name))
        let toMakeNames = toMake.map(m => m.name);
        toMake.map(m => this.passiveOptions[m.name] ??= { enabled: true });
        Object.entries(this.passiveOptions).filter(([nme, val]) => toMakeNames.includes(nme)).map(([nme, val]) => val.enabled = true);
        this.passives = this.passives.concat(toMake.map(m => new m(this.bot, this.passiveOptions[m.name])))
    }

    public removePassives(...passives: AFKConstructor<AFKPassive>[]) {
        let names = passives.map(m => m.constructor.name);
        this.passives.filter(m => names.includes(m.constructor.name)).map(m => m.stop());
        names.map(nme => this.passiveOptions[nme] ??= { enabled: false });
        Object.entries(this.passiveOptions).filter(([nme, val]) => names.includes(nme)).map(([nme, val]) => val.enabled = false);
        this.passives = this.passives.filter(m => !names.includes(m.constructor.name))
    }

    private isModuleEnabled(mod: AFKConstructor<AFKModule> | AFKModule): boolean {
        if (mod instanceof AFKModule) {
            return !!this.moduleOptions[mod.constructor.name]?.enabled;
        }
        return !!this.moduleOptions[mod.name]?.enabled
    }

    private getLessRandomModule(): AFKModule {
        const passiveMods = this.modules.filter(m => !m.isActive && this.isModuleEnabled(m) && m != this.lastModule);
        return passiveMods[Math.floor(passiveMods.length * Math.random())]
    }

    public async start(): Promise<boolean> {
        this.shouldStop = false;
        while (!this.shouldStop) {
            this.lastModule = this.getLessRandomModule();
            if (!this.lastModule) return false;
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