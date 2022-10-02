import { Bot } from "mineflayer";
import { ChatBotModule } from "./chatBot";
import { BlockBreakModule } from "./blockBreak";
import { LookAroundModule } from "./lookAround";
import { AFKModule } from "./module";
import { RandomMovementModule } from "./randomMovement";
import { WalkAroundModule } from "./walkAround";

export const ALL_MODULES: (new (bot: Bot, ...any: any) => AFKModule)[] = [LookAroundModule, RandomMovementModule, WalkAroundModule, ChatBotModule, BlockBreakModule]


export * from "./chatBot";
export * from "./blockBreak"
export * from "./lookAround"
export * from "./randomMovement"
export * from "./walkAround"
export { AFKModule, AFKModuleOptions} from "./module"