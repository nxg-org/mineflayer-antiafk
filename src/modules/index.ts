import { Bot } from "mineflayer";
import { ChatBotModule } from "./chatBot";
import { LookAroundModule } from "./lookAround";
import { AFKModule } from "./module";
import { RandomMovementModule } from "./randomMovement";
import { WalkAroundModule } from "./walkAround";

export const ALL_MODULES: (new (bot: Bot, ...any: any) => AFKModule)[] = [LookAroundModule, RandomMovementModule, WalkAroundModule, ChatBotModule]