import { Bot } from "mineflayer";
import { AFKModule } from "../modules";
import { AFKConstructor } from "../utils";
import { KillAuraPassive } from "./killaura";
import { AFKPassive, AFKPassiveOptions } from "./passive";


export type AntiAFKPassiveOptions = { [key: string]: AFKPassiveOptions }

export const DEFAULT_PASSIVES: AFKConstructor<AFKPassive>[] = [KillAuraPassive]

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


export {AFKPassive, AFKPassiveOptions};