import { Bot } from 'mineflayer'
import { AFKModule } from '../modules'
import { AFKConstructor } from '../utils'
import { IKillAuraOpts, KillAura } from './killaura'
import { AFKPassive, AFKPassiveOptions } from './passive'

export interface AntiAFKPassiveOptions { [key: string]: AFKPassiveOptions }

export const DEFAULT_PASSIVES = {
  KillAura: KillAura
} as const

export interface AllPassiveSettings extends AntiAFKPassiveOptions {
  KillAura: IKillAuraOpts,
}

export const PASSIVE_DEFAULT_SETTINGS: AllPassiveSettings = {
  KillAura: {
    enabled: true,
    multi: false,
    reach: 3,
    entityBlacklist: [],
    playerWhitelist: []
  },
}

export { AFKPassive, AFKPassiveOptions }
export * from './killaura'
