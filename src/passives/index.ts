import { Bot } from "mineflayer";
import { KillAuraPassive } from "./killaura";
import { AFKPassive } from "./passive";


export const ALL_PASSIVES: (new (bot: Bot, ...any: any[]) => AFKPassive)[] = [KillAuraPassive]