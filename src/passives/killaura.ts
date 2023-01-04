import { Bot } from "mineflayer";
import type {Entity} from "prismarine-entity";
import { mergeDeepNoArrayConcat } from "../utils";
import { AFKPassive, AFKPassiveOptions } from "./passive";



export class KillAuraPassiveOptions implements AFKPassiveOptions {
    public enabled: boolean = false;

    public constructor(
        public reach: number,
        public multi: boolean,
        public entityBlacklist: Set<number>
    ) {}

    public static vanilla_default(bot: Bot) {
        const entityBlacklist = new Set([
            bot.registry.entitiesByName.enderman.id, 
            bot.registry.entitiesByName.zombie_pigman.id,
        ])

        for (const entity of Object.values(bot.registry.entitiesByName)
            .filter(e => ["mob", "animal"].includes(e.type) && e.category && ["Passive mobs", "NPCs"].includes(e.category))) {
                entityBlacklist.add(entity.id);
        }
       
        return new KillAuraPassiveOptions(3, false, entityBlacklist)
    }

}

export class KillAuraPassive extends AFKPassive {
    public options: KillAuraPassiveOptions;

    public constructor(bot: Bot, options: Partial<KillAuraPassive> = {}) {
        super(bot);
        this.options = mergeDeepNoArrayConcat(KillAuraPassiveOptions.vanilla_default(bot), options);
    }

    public listener = () => {
        
        // attack multiple entities per tick.
        if (this.options.multi) {
            
            // filter to only mobs, then filter to hittable entities that are not in blacklist.
            let targets = Object.values(this.bot.entities).filter(e => e.type == "mob").
                filter(e => 
                    this.bot.util.entity.getDistanceToEntity(e) < this.options.reach &&
                    !this.options.entityBlacklist.has(e.id)
                );
            targets.map(t => this.bot.attack(t));
        } else {

            // get nearest entity, check if hittable and not in blacklist.
            let target = this.bot.nearestEntity(e => 
                this.bot.util.entity.getDistanceToEntity(e) < this.options.reach &&  
                !this.options.entityBlacklist.has(e.id)
            )
            if (target) this.bot.attack(target);
        }
    }
}