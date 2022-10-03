import { Bot } from "mineflayer";
import { ChatBotModule } from "./chatBot";
import { BlockBreakModule } from "./blockBreak";
import { LookAroundModule } from "./lookAround";
import { AFKModule, AFKModuleOptions } from "./module";
import { RandomMovementModule } from "./randomMovement";
import { WalkAroundModule } from "./walkAround";
import { AFKConstructor } from "../utils";


export type AntiAFKModuleOptions = { [key: string]: AFKModuleOptions }

export const DEFAULT_MODULES: AFKConstructor<AFKModule>[] = [LookAroundModule, RandomMovementModule, WalkAroundModule, ChatBotModule, BlockBreakModule]

export const MODULE_DEFAULT_SETTINGS = (bot: Bot) => {
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
            preferBlockIds: Object.values(bot.registry.blocks).filter(b => b.hardness && b.hardness >= 0.5).map(b => b.id)
        },
    }
}



export * from "./chatBot";
export * from "./blockBreak"
export * from "./lookAround"
export * from "./randomMovement"
export * from "./walkAround"
export { AFKModule, AFKModuleOptions} from "./module"