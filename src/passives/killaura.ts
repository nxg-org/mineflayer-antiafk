import { Bot } from "mineflayer";
import type {Entity} from "prismarine-entity";
import { mergeDeepNoArrayConcat } from "../utils";
import { AFKPassive, AFKPassiveOptions } from "./passive";



export interface KillAuraPassiveOptions extends AFKPassiveOptions {
    reach: number;
    multi: boolean;
}

export class KillAuraPassive extends AFKPassive {
    public options: KillAuraPassiveOptions;

    public constructor(bot: Bot, options?: Partial<KillAuraPassive>) {
        super(bot);
        this.options = !!options ? mergeDeepNoArrayConcat({enabled: false, reach: 3, multi: false}, options) : {enabled: false, reach: 3};
    }


    public listener = () => {
        if (!this.options.multi) {
            let target = this.bot.nearestEntity(e => this.bot.util.entity.getDistanceToEntity(e) < this.options.reach && e.type == "mob")
            if (target) this.bot.attack(target);
        } else {
            let targets = Object.values(this.bot.entities).filter(e => e.type == "mob").filter(e => this.bot.util.entity.getDistanceToEntity(e) < this.options.reach);
            targets.map(t => this.bot.attack(t));
        }
  
    }

}