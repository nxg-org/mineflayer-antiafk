
import { Bot } from "mineflayer";
import { Item } from "prismarine-item";
import utilPlugin from "@nxg-org/mineflayer-util-plugin";
import { AntiAFK } from "./antiafk";
import {IndexedData} from "minecraft-data"

declare module "mineflayer" {
    interface Bot {
        antiafk: AntiAFK;
        registry: IndexedData;
    }
}

export default function plugin(bot: Bot) {
    if (!bot.util) bot.loadPlugin(utilPlugin)
    bot.antiafk = new AntiAFK(bot);
}