import { Bot } from "mineflayer";
import { customMerge } from "../utils";
import { AFKPassive, AFKPassiveOptions } from "./passive";

export interface IKillAuraPassiveOptions extends AFKPassiveOptions {
  reach: number;
  multi: boolean;
  entityBlacklist: number[];
  playerWhitelist: string[];
}

export class KillAuraPassiveOptions implements AFKPassiveOptions {
  public enabled: boolean = false;

  public constructor(
    public reach: number,
    public multi: boolean,
    public entityBlacklist: number[],
    public playerWhitelist: string[]
  ) {}

  public static vanillaDefault(bot: Bot, players: string[] = []) {
    const entityBlacklist = [
      bot.registry.entitiesByName.enderman.id,
      bot.registry.entitiesByName.zombie_pigman.id,
    ];

    for (const entity of Object.values(bot.registry.entitiesByName).filter(
      (e) => ["mob", "animal"].includes(e.type) && e.category && ["Passive mobs", "NPCs"].includes(e.category)
    )) {
      entityBlacklist.push(entity.id);
    }
    return new KillAuraPassiveOptions(3, false, entityBlacklist, players);
  }
}

export class KillAuraPassive extends AFKPassive<IKillAuraPassiveOptions, 'physicsTick'> {
  public static readonly hittableTypes = new Set(["mob", "player"]);

  protected eventWanted = "physicsTick" as const;

  public constructor(bot: Bot, options: Partial<IKillAuraPassiveOptions> = {}) {
    super(bot, customMerge(KillAuraPassiveOptions.vanillaDefault(bot), options));
  }

  public listener = () => {
    // attack multiple entities per tick.
    if (this.options.multi) {
      // filter to only mobs, then filter to hittable entities that are not in blacklist.
      let targets = Object.values(this.bot.entities)
        .filter((e) => KillAuraPassive.hittableTypes.has(e.type))
        .filter(
          (e) =>
            this.bot.util.entity.entityDistance(e) < this.options.reach &&
            !this.options.entityBlacklist.includes(e.entityType ?? -1) &&
            !(e.username && this.options.playerWhitelist.includes(e.username))
        );
      targets.map((t) => this.bot.attack(t));
    } else {
      // get nearest entity, check if hittable and not in blacklist.
      let target = this.bot.nearestEntity(
        (e) =>
          KillAuraPassive.hittableTypes.has(e.type) &&
          this.bot.util.entity.entityDistance(e) < this.options.reach &&
          !this.options.entityBlacklist.includes(e.entityType ?? -1) &&
          !(e.username && this.options.playerWhitelist.includes(e.username))
      );
      if (target) {
        this.bot.attack(target);
      }
    }
  };
}
