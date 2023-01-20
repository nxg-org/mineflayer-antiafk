import { EventEmitter } from "events";
import { Bot } from "mineflayer";
import { AFKModule, AFKModuleOptions, DEFAULT_MODULES, MODULE_DEFAULT_SETTINGS, AntiAFKModuleOptions } from "./modules";
import { DEFAULT_PASSIVES, AntiAFKPassiveOptions, PASSIVE_DEFAULT_SETTINGS } from "./passives";
import { AFKPassive, AFKPassiveOptions } from "./passives/passive";
import { AFKConstructor, customMerge as customMerge } from "./utils";
import StrictEventEmitter from "strict-event-emitter-types";

interface AntiAFKEvents {
  moduleStarted: (mod: AFKModule<AFKModuleOptions>) => void;
  moduleCompleted: (mod: AFKModule<AFKModuleOptions>, success: boolean, reason?: string, ...any: any[]) => void;
  custom: (msg: string, mod: AFKModule<AFKModuleOptions>, ...any: any[]) => void;
}

type AntiAFKEmitter = StrictEventEmitter<EventEmitter, AntiAFKEvents>;

type ModuleSelector = (cls: AntiAFK) => AFKModule<AFKModuleOptions>;

function getLessRandomModule(cls: AntiAFK): AFKModule<AFKModuleOptions> | null {
  let goodMods = cls.modules.filter((m) => !m.isActive && cls.isModuleEnabled(m) && cls.lastFailed !== m);
  const notLastModule = goodMods.filter((m) => m != cls.lastModule);
  goodMods = notLastModule.length > 0 ? notLastModule : goodMods;
  return goodMods[Math.floor(goodMods.length * Math.random())] ?? null;
}

/**
 * Note: this currently does not support dynamically loading/unloading modules with strings.
 * You'll have to use the import to do it.
 *
 * TODO: Abstract this whole thing to decorators.
 */
export class AntiAFK extends (EventEmitter as { new (): AntiAFKEmitter }) {
  public modules: AFKModule<AFKModuleOptions>[];
  public passives: AFKPassive<AFKPassiveOptions>[];
  public moduleOptions!: AntiAFKModuleOptions;
  public passiveOptions!: AntiAFKPassiveOptions;
  private _lastModule: AFKModule<AFKModuleOptions> | null;
  private _lastFailed: AFKModule<AFKModuleOptions> | null;
  public get lastModule() {
    return this._lastModule;
  }
  public get lastFailed() {
    return this._lastFailed;
  }
  private shouldStop: boolean = false;
  private moduleSelector: ModuleSelector;

  constructor(
    private bot: Bot,
    moduleOptions: AntiAFKModuleOptions = {},
    passiveOptions: AntiAFKPassiveOptions = {},
    moduleSelector?: ModuleSelector
  ) {
    super();
    this.modules = Object.values(DEFAULT_MODULES).map((mod) => new mod(bot));
    this.passives = Object.values(DEFAULT_PASSIVES).map((passive) => new passive(bot));
    this.setModuleOptions(moduleOptions, MODULE_DEFAULT_SETTINGS(bot));
    this.setPassiveOptions(passiveOptions, PASSIVE_DEFAULT_SETTINGS);
    this._lastModule = null;
    this._lastFailed = null;
    this.moduleSelector = moduleSelector ?? getLessRandomModule as any;

    this.on("moduleCompleted", (mod, success) => {
      if (!success) this._lastFailed = mod;
    })
  }

  public get isActive(): boolean {
    return this.modules.some((e) => e.isActive);
  }

  public get currentlyActive(): AFKModule<AFKModuleOptions> | undefined {
    return this.modules.find((m) => m.isActive);
  }

  public get activeModuleNames(): string[] {
    return this.modules.map((m) => m.constructor.name);
  }

  public setModuleOptions(options: AntiAFKModuleOptions, initial?: AntiAFKModuleOptions) {
    this.moduleOptions = customMerge(initial ?? this.moduleOptions, options);
    for (const option in this.moduleOptions) {
      if (this.moduleOptions[option]) {
        const mod = this.modules.find((m) => m.constructor.name == option);
        if (mod) mod.setOptions(this.moduleOptions[option]);
      }
    }
  }

  public setOptionsForModule<T extends AFKModule<AFKModuleOptions>>(
    module: AFKConstructor<T>,
    settings: Partial<T["options"]>
  ) {
    this.moduleOptions[module.name] = customMerge(this.moduleOptions[module.name], settings);
    this.modules.find((m) => m.constructor.name == module.name)?.setOptions(settings);
  }

  public setPassiveOptions(options: AntiAFKPassiveOptions, initial?: AntiAFKPassiveOptions) {
    this.passiveOptions = customMerge(initial ?? this.passiveOptions, options);
    for (const option in this.passiveOptions) {
      if (this.passiveOptions[option]) {
        const mod = this.passives.find((p) => p.constructor.name == option);
        if (mod) {
          mod.setOptions(this.passiveOptions[option]);
          if (this.isActive) mod.begin();
        }
      }
    }
  }

  public setOptionsForPassive<T extends AFKPassive<AFKPassiveOptions>>(
    passive: AFKConstructor<T>,
    settings: Partial<T["options"]>
  ) {
    this.passiveOptions[passive.name] = customMerge(this.passiveOptions[passive.name], settings);
    this.passives.find((m) => m.constructor.name == passive.name)?.setOptions(settings);
  }

  public addModules(...mods: AFKConstructor<AFKModule<AFKModuleOptions>>[]) {
    let currentNames = this.modules.map((m) => m.constructor.name);
    let toMake = mods.filter((m) => !currentNames.includes(m.name));
    let toMakeNames = toMake.map((m) => m.name);
    toMake.map((m) => (this.moduleOptions[m.name] ??= { enabled: true }));
    Object.entries(this.moduleOptions)
      .filter(([nme, val]) => toMakeNames.includes(nme))
      .map(([nme, val]) => (val.enabled = true));
    this.modules = this.modules.concat(toMake.map((m) => new m(this.bot, this.moduleOptions[m.name])));
  }

  public removeModules(...mods: AFKConstructor<AFKModule<AFKModuleOptions>>[]) {
    let toRemoveNames = mods.map((m) => m.name);
    toRemoveNames.map((nme) => (this.moduleOptions[nme] ??= { enabled: false }));
    Object.entries(this.moduleOptions)
      .filter(([nme, val]) => toRemoveNames.includes(nme))
      .map(([nme, val]) => (val.enabled = false));
    this.modules = this.modules.filter((m) => !toRemoveNames.includes(m.constructor.name));
  }

  public addPassives(...passives: AFKConstructor<AFKPassive<AFKPassiveOptions>>[]) {
    let currentNames = this.passives.map((m) => m.constructor.name);
    let toMake = passives.filter((m) => !currentNames.includes(m.name));
    let toMakeNames = toMake.map((m) => m.name);
    toMake.map((m) => (this.passiveOptions[m.name] ??= { enabled: true }));
    Object.entries(this.passiveOptions)
      .filter(([nme, val]) => toMakeNames.includes(nme))
      .map(([nme, val]) => (val.enabled = true));
    this.passives = this.passives.concat(toMake.map((m) => new m(this.bot, this.passiveOptions[m.name])));
  }

  public removePassives(...passives: AFKConstructor<AFKPassive<AFKPassiveOptions>>[]) {
    let toRemoveNames = passives.map((m) => m.constructor.name);
    this.passives.filter((m) => toRemoveNames.includes(m.constructor.name)).map((m) => m.stop());
    toRemoveNames.map((nme) => (this.passiveOptions[nme] ??= { enabled: false }));
    Object.entries(this.passiveOptions)
      .filter(([nme, val]) => toRemoveNames.includes(nme))
      .map(([nme, val]) => (val.enabled = false));
    this.passives = this.passives.filter((m) => !toRemoveNames.includes(m.constructor.name));
  }

  public isModuleEnabled(mod: AFKConstructor<AFKModule<AFKModuleOptions>> | AFKModule<AFKModuleOptions>): boolean {
    if (mod instanceof AFKModule) {
      return !!this.moduleOptions[mod.constructor.name]?.enabled;
    }
    return !!this.moduleOptions[mod.name]?.enabled;
  }

  public setModuleSelectionMethod(selection: ModuleSelector) {
    this.moduleSelector = selection.bind(this);
  }

  public async start(): Promise<boolean> {
    if (this._lastModule !== null) return false;
    this.shouldStop = false;
    while (!this.shouldStop) {
      this._lastModule = this.moduleSelector(this);
      if (!this._lastModule) {
        this.stop();
        return false;
      }
      this.passives.map((p) => (p.options.enabled ? p.begin() : p.stop()));
      this.emit("moduleStarted", this._lastModule);
      await this._lastModule.perform();
    }
    return true;
  }

  public stop() {
    this.shouldStop = true;
    this.passives.map((p) => p.stop());
    this._lastModule = null;
  }

  public forceStop() {
    this.currentlyActive?.cancel();
    this.shouldStop = true;
    this._lastModule = null;
  }
}
