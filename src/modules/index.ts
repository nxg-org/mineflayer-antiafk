import { Bot } from "mineflayer";
import { ChatBotModule } from "./chatBot";
import { BlockBreakModule } from "./blockBreak";
import { LookAroundModule } from "./lookAround";
import { AFKModule, AFKModuleOptions } from "./module";
import { RandomMovementModule } from "./randomMovement";
import { WalkAroundModule } from "./walkAround";
import { AFKConstructor } from "../utils";


export type AntiAFKModuleOptions = { [key: string]: AFKModuleOptions }


export const DEFAULT_MODULES: AFKConstructor<AFKModule<AFKModuleOptions>>[] = 
    require.resolve("mineflayer-pathfinder") ? 
    [LookAroundModule, RandomMovementModule, WalkAroundModule, ChatBotModule, BlockBreakModule] :
    [LookAroundModule, RandomMovementModule, ChatBotModule]

export const MODULE_DEFAULT_SETTINGS = 
    require.resolve("mineflayer-pathfinder") ? 
    (bot: Bot) => {
        return {
            WalkAroundModule: {
                enabled: true,
                newChunks: true,
                rotateChunks: true,
                searchRadius: 8
            },
            ChatBotModule: {
                enabled: true,
                random: false,
                messages: ["test", "test1", "test2"],
                delay: 1000,
                variation: 300
            },
            LookAroundModule: {
                enabled: true
            },
            RandomMovementModule: {
                enabled: true
            },
            BlockBreakModule: {
                enabled: true,
                // locate all easily broken blocks via this method.
                preferBlockIds: new Set(Object.values(bot.registry.blocks).filter(b => b.hardness && b.hardness <= 0.5).map(b => b.id)),
                avoidBlockIds: new Set(Object.values(bot.registry.blocks).filter(b => b.hardness && b.hardness >= 1.4).map(b => b.id)),
            },
        }
    } : 
    (bot: Bot) => {
        return {
            ChatBotModule: {
                enabled: true,
                random: false,
                messages: ["test", "test1", "test2"],
                delay: 1000,
                variation: 300
            },
            LookAroundModule: {
                enabled: true
            },
            RandomMovementModule: {
                enabled: true
            },
        }
    }



export * from "./chatBot";
export * from "./blockBreak"
export * from "./lookAround"
export * from "./randomMovement"
export * from "./walkAround"
export { AFKModule, AFKModuleOptions} from "./module"