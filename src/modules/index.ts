import { Bot } from 'mineflayer'
import { ChatBot, ChatBotOpts } from './chatBot'
import { BlockBreak, BlockBreakOpts, IBlockBreakOpts } from './blockBreak'
import { LookAround } from './lookAround'
import { AFKModuleOptions } from './module'
import { RandomMovement } from './randomMovement'
import { IPathfinderWalkOpts, PathfinderWalk, PathfinderWalkOpts } from './pathfinderWalk'
import { ISimpleWalkOpts, SimpleWalk } from './simpleWalk'
import { IBoxWalk } from './boxWalk'

export interface AntiAFKModuleOptions { [key: string]: AFKModuleOptions }

/**
 * TODO: Fix typing so it matches when called externally (this is a library).
 * Currently, defaults to no mineflayer-pathfinder since local resolution of
 * "minecraft-pathfinder" fails.
 */
export const DEFAULT_MODULES = require.resolve('mineflayer-pathfinder')
  ? ({
      LookAround,
      RandomMovement,
      PathfinderWalk,
      ChatBot,
      BlockBreak
    } as const)
  : ({
      LookAround: LookAround,
      RandomMovement: RandomMovement,
      ChatBot: ChatBot
    } as const)

/**
 * TODO: Fix typing so it matches when called externally (this is a library).
 * Currently, defaults to no mineflayer-pathfinder since local resolution of
 * "minecraft-pathfinder" fails.
 */
export const MODULE_DEFAULT_SETTINGS: (bot: Bot) => Partial<AllModuleSettings> = require.resolve('mineflayer-pathfinder')
  ? (bot) => {
      return {
        PathfinderWalk: PathfinderWalkOpts.standard(bot),
        ChatBot: {
          enabled: true,
          random: false,
          messages: ['Powered by NextGEN: Mineflayer-AntiAFK!'],
          delay: 5000,
          variation: 300
        },
        LookAround: {
          enabled: true
        },
        RandomMovement: {
          enabled: true
        },
        BlockBreak: BlockBreakOpts.standard(bot, 0.5, 1.4)
      }
    }
  : (_bot) => {
      return {
        ChatBotModule: {
          enabled: true,
          random: false,
          messages: ['test', 'test1', 'test2'],
          delay: 3000,
          variation: 300
        },
        LookAroundModule: {
          enabled: true
        },
        RandomMovementModule: {
          enabled: true
        },
        SimpleWalk: {
          enabled: true,
          choices: ['forward', 'back', 'left', 'right'],
          distance: 16,
          randomChoices: false
        }
      }
    }

export interface AllModuleSettings {
  PathfinderWalk: IPathfinderWalkOpts
  SimpleWalk: ISimpleWalkOpts
  BoxWalk: IBoxWalk
  ChatBot: ChatBotOpts
  BlockBreak: IBlockBreakOpts
  SwingArm: {enabled: boolean}
  LookAround: { enabled: boolean }
  RandomMovement: { enabled: boolean }
}

export * from './chatBot'
export * from './blockBreak'
export * from './lookAround'
export * from './randomMovement'
export * from './pathfinderWalk'
export * from './simpleWalk'
export * from './boxWalk'
export * from './swingArm'
export { AFKModule, AFKModuleOptions } from './module'
