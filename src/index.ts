
import { Bot } from "mineflayer";
import utilPlugin from "@nxg-org/mineflayer-util-plugin";
import autoEat from "@nxg-org/mineflayer-auto-eat";
import { AntiAFK } from "./antiafk";
import {IndexedData} from "minecraft-data"

declare module "mineflayer" {
    interface Bot {
        antiafk: AntiAFK;
        registry: IndexedData;
    }
}

export default function plugin(bot: Bot) {
    if (!bot.util) bot.loadPlugin(utilPlugin);
    if (!bot.autoEat) bot.loadPlugin(autoEat);
    bot.antiafk = new AntiAFK(bot);
}

export {AFKModule, AFKModuleOptions, DEFAULT_MODULES, MODULE_DEFAULT_SETTINGS} from "./modules";
export {AFKPassive, AFKPassiveOptions, DEFAULT_PASSIVES, PASSIVE_DEFAULT_SETTINGS} from "./passives"
