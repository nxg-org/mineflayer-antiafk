import { AFKModule, AFKModuleOptions } from "./module";
import { performance } from "perf_hooks";
import { Vec3 } from "vec3";
import { sleep } from "../utils";

export type IBoxWalk = AFKModuleOptions & {
  distance?: number;
  travelTime?: number;
  waitTime: number;
};

export class BoxWalkOpts implements IBoxWalk {
  constructor(public enabled: boolean = false, public distance: number, public waitTime: number = 0) {}

  public static standard() {
    return new BoxWalkOpts(true, 16);
  }
}

/**
 * The only issue with this class right now
 * is that it wanders slowly over time if left alone.
 * I can fix that easily by making the search radius be based around the intiial starting point of the bot
 * instead of chunk offsets
 * but that requires me to acknowledge when the module is actually started.
 */
export class BoxWalk extends AFKModule<IBoxWalk> {
  public override async perform(): Promise<boolean> {
    super.perform();
    for (let i = 0; i < 4; i++) {
      await this.bot.look((Math.PI / 2) * i, 0, true);
      this.bot.clearControlStates();
      this.bot.setControlState("forward", true);

      const sPos = this.bot.entity.position.clone();
      const sTime = performance.now();

      while (!this.shouldCancel) {
        if (this.options.travelTime) if (performance.now() - sTime > this.options.travelTime) break;
        if (this.options.distance) if (this.bot.entity.position.xzDistanceTo(sPos) > this.options.distance) break;

        await sleep(50);
      }
      if (this.shouldCancel) break;
      await sleep(this.options.waitTime)
    }
    if (this.shouldCancel) return this.complete(false, "Canceled!");
    return this.complete(true);
  }

  public override async cancel(): Promise<boolean> {
    this.bot.pathfinder.stop();
    return super.cancel();
  }
}
