
import type { Bot } from "mineflayer";
import utilPlugin from "@nxg-org/mineflayer-util-plugin";
import { AntiAFK } from "./antiafk";

import { DEFAULT_MODULES } from "./modules";
import { DEFAULT_PASSIVES } from "./passives";



declare module "mineflayer" {
    interface Bot {
        antiafk: AntiAFK;
    }
}


export default function plugin(bot: Bot) {
    if (!bot.util) bot.loadPlugin(utilPlugin);
    bot.antiafk = new AntiAFK(bot);
}

export function unloadDefaultModules(bot: Bot) {
    if (!bot.hasPlugin(plugin)) throw "AntiAFK plugin is not loaded when trying to unload afk modules!"
    
    bot.antiafk.removeModules(...Object.values(DEFAULT_MODULES))
}

export function unloadDefaultPassives(bot: Bot) {
    if (!bot.hasPlugin(plugin)) throw "AntiAFK plugin is not loaded when trying to unload afk passives!"
    
    bot.antiafk.removePassives(...Object.values(DEFAULT_PASSIVES))
}






export {AFKModule, AFKModuleOptions, DEFAULT_MODULES, MODULE_DEFAULT_SETTINGS, AllModuleSettings} from "./modules";
export {AFKPassive, AFKPassiveOptions, DEFAULT_PASSIVES, PASSIVE_DEFAULT_SETTINGS, AllPassiveSettings} from "./passives"

