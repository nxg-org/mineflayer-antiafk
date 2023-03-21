import { Bot } from "mineflayer";
import { customMerge } from "../utils";
import { AFKPassive, AFKPassiveOptions } from "./passive";

export interface IKillAuraPassiveOptions extends AFKPassiveOptions {
  reach: number;
  multi: boolean;
  entityBlacklist: Set<number>;
  playerWhitelist: Set<string>;
}

export class KillAuraPassiveOptions implements AFKPassiveOptions {
  public enabled: boolean = false;

  public constructor(
    public reach: number,
    public multi: boolean,
    public entityBlacklist: Set<number>,
    public playerWhitelist: Set<string>
  ) {}

  public static vanilla_default(bot: Bot) {
    const entityBlacklist = new Set([
      bot.registry.entitiesByName.enderman.id,
      bot.registry.entitiesByName.zombie_pigman.id,
    ]);

    for (const entity of Object.values(bot.registry.entitiesByName).filter(
      (e) => ["mob", "animal"].includes(e.type) && e.category && ["Passive mobs", "NPCs"].includes(e.category)
    )) {
      entityBlacklist.add(entity.id);
    }
    return new KillAuraPassiveOptions(3, false, entityBlacklist, new Set());
  }
}

export class KillAuraPassive extends AFKPassive<IKillAuraPassiveOptions> {
  public readonly hittableTypes = new Set(["mob", "player"]);

  public constructor(bot: Bot, options: Partial<IKillAuraPassiveOptions> = {}) {
    super(bot, customMerge(KillAuraPassiveOptions.vanilla_default(bot), options));
  }

  public listener = () => {
    // attack multiple entities per tick.
    if (this.options.multi) {
      // filter to only mobs, then filter to hittable entities that are not in blacklist.
      let targets = Object.values(this.bot.entities)
        .filter((e) => this.hittableTypes.has(e.type))
        .filter(
          (e) =>
            this.bot.util.entity.entityDistance(e) < this.options.reach &&
            !this.options.entityBlacklist.has(e.entityType ?? -1) &&
            !(e.username && this.options.playerWhitelist.has(e.username))
        );
      targets.map((t) => this.bot.attack(t));
    } else {
      // get nearest entity, check if hittable and not in blacklist.
      let target = this.bot.nearestEntity(
        (e) =>
          this.hittableTypes.has(e.type) &&
          this.bot.util.entity.entityDistance(e) < this.options.reach &&
          !this.options.entityBlacklist.has(e.entityType ?? -1) &&
          !(e.username && this.options.playerWhitelist.has(e.username))
      );
      if (target) {
        this.bot.attack(target);
      }
    }
  };
}
