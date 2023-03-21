import { Bot } from "mineflayer";
import { goals, Movements, Pathfinder } from "mineflayer-pathfinder";
import { Vec3 } from "vec3";
import { customMerge } from "../utils";
import { AFKModule, AFKModuleOptions } from "./module";

export interface IWalkAroundModuleOptions extends AFKModuleOptions {
   newChunks: boolean 
   rotateChunks: boolean
  //  stayNearOrigin: boolean = false,
   preferBlockIds: Set<number> 
   avoidBlockIds: Set<number> 
   timeout: number
   searchRadius: number 
}

export class WalkAroundModuleOptions implements IWalkAroundModuleOptions {
  constructor(
    public enabled: boolean = false,
    public newChunks: boolean = false,
    public rotateChunks: boolean = false,
    // public stayNearOrigin: boolean = false,
    public preferBlockIds: Set<number> = new Set(),
    public avoidBlockIds: Set<number> = new Set(),
    public timeout: number = 10000,
    public searchRadius: number = 16
  ) {}

  public static standard(bot: Bot) {
    return new WalkAroundModuleOptions(
      false,
      false,
      false,
      // false,
      new Set([bot.registry.blocksByName.grass.id, bot.registry.blocksByName.cobblestone.id]),
      new Set([bot.registry.blocksByName.water.id, bot.registry.blocksByName.lava.id, bot.registry.blocksByName.air.id])
    );
  }
  public static TwoBTwoT(bot: Bot) {
    return new WalkAroundModuleOptions(
      false,
      true,
      true,
      // true,
      new Set([
        bot.registry.blocksByName.grass.id,
        bot.registry.blocksByName.cobblestone.id,
        bot.registry.blocksByName.obsidian.id,
      ]),
      new Set([bot.registry.blocksByName.water.id, bot.registry.blocksByName.lava.id, bot.registry.blocksByName.air.id])
    );
  }
}

/**
 * The only issue with this class right now
 * is that it wanders slowly over time if left alone.
 * I can fix that easily by making the search radius be based around the intiial starting point of the bot
 * instead of chunk offsets
 * but that requires me to acknowledge when the module is actually started.
 */
export class WalkAroundModule extends AFKModule<WalkAroundModuleOptions> {
  private lastLocation: Vec3 | null;
  private chunkRotationNum = 0;
  private static readonly offsets: Vec3[] = [
    new Vec3(16, 0, 0),
    new Vec3(0, 0, 16),
    new Vec3(-16, 0, 0),
    new Vec3(0, 0, -16),
  ];

  constructor(bot: Bot, options: Partial<WalkAroundModuleOptions> = {}) {
    super(bot, customMerge(WalkAroundModuleOptions.standard(bot), options));
    this.lastLocation = null;
  }

  private goodPos = (bl: Vec3) => {
    return (
      !this.lastLocation?.equals(bl) &&
      this.bot.blockAt(bl.offset(0, 1, 0))!.type === this.bot.registry.blocksByName.air.id &&
      this.bot.blockAt(bl.offset(0, 2, 0))!.type === this.bot.registry.blocksByName.air.id &&
      this.bot.blockAt(bl.offset(1, 2, 0))!.type === this.bot.registry.blocksByName.air.id &&
      this.bot.blockAt(bl.offset(-1, 2, 0))!.type === this.bot.registry.blocksByName.air.id &&
      this.bot.blockAt(bl.offset(0, 2, 1))!.type === this.bot.registry.blocksByName.air.id &&
      this.bot.blockAt(bl.offset(0, 2, -1))!.type === this.bot.registry.blocksByName.air.id
    );
  }

  private findLocation(): Vec3 | null {
    let point: Vec3;
    let list: Vec3[];

    // perform check only once if staying in same chunk.
    for (let i = this.options.newChunks ? 0 : 4; i < 4; i++) {
      if (this.options.newChunks) {
        point = this.bot.entity.position.plus(
          WalkAroundModule.offsets[this.options.rotateChunks ? this.chunkRotationNum : Math.floor(4 * Math.random())]
        );
      } else {
        point = this.bot.entity.position;
      }

      list = this.bot
        .findBlocks({
          matching: (b) => this.options.preferBlockIds.has(b.type),
          maxDistance: this.options.searchRadius,
          count: 400,
          point,
        })
        .filter(this.goodPos);

      if (list.length === 0) {
        list = this.bot
          .findBlocks({
            matching: (b) => !this.options.avoidBlockIds.has(b.type),
            maxDistance: this.options.searchRadius,
            count: 1600,
            point,
          })
          .filter(this.goodPos);
      }

      if (this.lastLocation) {
        if (this.options.newChunks)
          list = list.sort((a, b) => this.lastLocation!.distanceSquared(b) - this.lastLocation!.distanceSquared(a));
        else list = list.sort((a, b) => this.lastLocation!.distanceSquared(a) - this.lastLocation!.distanceSquared(b));
      }
      if (this.options.rotateChunks) {
        // wrap back around.
        this.chunkRotationNum = this.chunkRotationNum === 3 ? 0 : this.chunkRotationNum + 1;
      }

      if (list.length > 0) {
        // closest to new chunk if newChunks, farthest away if not.
        return this.options.newChunks
          ? list[0]
          : list[list.length - 1 - Math.floor((list.length / 10) * Math.random())];
      }
    }
    return null;
  }

  public override async perform(): Promise<boolean> {
    super.perform();
    let bl = this.findLocation();
    if (!bl) {
      this.complete(false, "no suitable blocks.");
      return false;
    }

    try {
      await this.bot.pathfinder.goto(new goals.GoalGetToBlock(bl.x, bl.y, bl.z));
      this.lastLocation = this.bot.entity.position.offset(0, -1, 0).floored();
      this.complete(true);
      return true;
    } catch (e: any) {
      // just going to end.
      this.complete(false, "failed to traverse to goal.");
      return false;
    }
  }

  public override async cancel(): Promise<boolean> {
    this.bot.pathfinder.stop();
    this.bot.pathfinder.setGoal(null);
    return super.cancel();
  }
}
