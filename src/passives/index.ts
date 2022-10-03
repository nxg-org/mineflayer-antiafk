import { Bot } from "mineflayer";
import { AFKModule } from "../modules";
import { AFKConstructor } from "../utils";
import { KillAuraPassive } from "./killaura";
import { AFKPassive, AFKPassiveOptions } from "./passive";


export const ALL_PASSIVES: AFKConstructor<AFKPassive>[] = [KillAuraPassive]
export {AFKPassive, AFKPassiveOptions};