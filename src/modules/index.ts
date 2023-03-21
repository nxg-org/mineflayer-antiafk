import { Bot } from "mineflayer";
import { ChatBotModule, ChatBotModuleOptions } from "./chatBot";
import { BlockBreakModule, IBlockBreakModuleOptions } from "./blockBreak";
import { LookAroundModule } from "./lookAround";
import { AFKModule, AFKModuleOptions } from "./module";
import { RandomMovementModule } from "./randomMovement";
import { IWalkAroundModuleOptions, WalkAroundModule } from "./walkAround";
import { AFKConstructor } from "../utils";

export type AntiAFKModuleOptions = { [key: string]: AFKModuleOptions };

/**
 * TODO: Fix typing so it matches when called externally (this is a library).
 * Currently, defaults to no mineflayer-pathfinder since local resolution of
 * "minecraft-pathfinder" fails.
 */
export const DEFAULT_MODULES = require.resolve("mineflayer-pathfinder")
  ? ({
      LookAroundModule: LookAroundModule,
      RandomMovementModule: RandomMovementModule,
      WalkAroundModule: WalkAroundModule,
      ChatBotModule: ChatBotModule,
      BlockBreakModule: BlockBreakModule,
    } as const)
  : ({
      LookAroundModule: LookAroundModule,
      RandomMovementModule: RandomMovementModule,
      ChatBotModule: ChatBotModule,
    } as const);

/**
 * TODO: Fix typing so it matches when called externally (this is a library).
 * Currently, defaults to no mineflayer-pathfinder since local resolution of
 * "minecraft-pathfinder" fails.
 */
export const MODULE_DEFAULT_SETTINGS: (bot: Bot) => Partial<AllModuleSettings> = require.resolve("mineflayer-pathfinder")
  ? (bot) => {
      return {
        WalkAroundModule: {
          enabled: true,
          newChunks: true,
          rotateChunks: true,
          searchRadius: 8,
        },
        ChatBotModule: {
          enabled: true,
          random: false,
          messages: ["NextGEN Anti-afk Module", "test", "test1", "test2"],
          delay: 3000,
          variation: 300,
        },
        LookAroundModule: {
          enabled: true,
        },
        RandomMovementModule: {
          enabled: true,
        },
        BlockBreakModule: {
          enabled: true,
          // locate all easily broken blocks via this method.
          preferBlockIds: bot.registry.blocksArray
              .filter((b) => b.hardness && b.hardness <= 0.5)
              .map((b) => b.id)
          ,
          avoidBlockIds: bot.registry.blocksArray
              .filter((b) => b.hardness && b.hardness >= 1.4)
              .map((b) => b.id)
          
        },
      };
    }
  : (_bot) => {
      return {
        ChatBotModule: {
          enabled: true,
          random: false,
          messages: ["test", "test1", "test2"],
          delay: 3000,
          variation: 300,
        },
        LookAroundModule: {
          enabled: true,
        },
        RandomMovementModule: {
          enabled: true,
        },
      };
    };

export type AllModuleSettings = {
  WalkAroundModule: IWalkAroundModuleOptions;
  ChatBotModule: ChatBotModuleOptions;
  BlockBreakModule: IBlockBreakModuleOptions;
  LookAroundModule: { enabled: boolean };
  RandomMovementModule: { enabled: boolean };
};

export * from "./chatBot";
export * from "./blockBreak";
export * from "./lookAround";
export * from "./randomMovement";
export * from "./walkAround";
export { AFKModule, AFKModuleOptions } from "./module";
