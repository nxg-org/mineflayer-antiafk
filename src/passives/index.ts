import { Bot } from "mineflayer";
import { AFKModule } from "../modules";
import { AFKConstructor } from "../utils";
import { IKillAuraPassiveOptions, KillAuraPassive } from "./killaura";
import { AFKPassive, AFKPassiveOptions } from "./passive";


export type AntiAFKPassiveOptions = { [key: string]: AFKPassiveOptions }

export const DEFAULT_PASSIVES = {
    KillAuraPassive: KillAuraPassive
} as const;


export type AllPassiveSettings = {
    KillAuraPassive: IKillAuraPassiveOptions
};



export const PASSIVE_DEFAULT_SETTINGS: AllPassiveSettings = {
    KillAuraPassive: {
        enabled: true,
        multi: false,
        reach: 3,
        entityBlacklist: [],
        playerWhitelist: []
    },
}


export {AFKPassive, AFKPassiveOptions};
export * from './killaura'