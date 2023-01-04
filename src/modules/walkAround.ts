import { Bot } from "mineflayer";
import { goals, Pathfinder } from "mineflayer-pathfinder";
import { Vec3 } from "vec3";
import { customMerge } from "../utils";
import { AFKModule, AFKModuleOptions } from "./module";


export class WalkAroundModuleOptions implements AFKModuleOptions {
    constructor(
        public enabled: boolean = false,
        public newChunks: boolean = false,
        public rotateChunks: boolean = false,
        // public stayNearOrigin: boolean = false,
        public preferBlockIds: number[] = [],
        public avoidBlockIds: number[] = [],
        public timeout: number = 10000,
        public searchRadius: number = 16
    ) { }



    public static standard(bot: Bot) {
        return new WalkAroundModuleOptions(
            false,
            false, 
            false, 
            // false,
            [bot.registry.blocksByName.grass.id, bot.registry.blocksByName.cobblestone.id], 
            [bot.registry.blocksByName.water.id, bot.registry.blocksByName.lava.id, bot.registry.blocksByName.air.id]
        )   
    }
    public static TwoBTwoT(bot: Bot) {
        return new WalkAroundModuleOptions(
            false,
            true, 
            true, 
            // true,
            [bot.registry.blocksByName.grass.id], 
            [bot.registry.blocksByName.water.id, bot.registry.blocksByName.lava.id, bot.registry.blocksByName.air.id]
        )
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
    private static readonly offsets: Vec3[] = [new Vec3(16, 0, 0), new Vec3(0, 0, 16), new Vec3(-16, 0, 0), new Vec3(0, 0, -16)]

    constructor(bot: Bot, options: Partial<WalkAroundModuleOptions> = {}) {
        super(bot, customMerge(WalkAroundModuleOptions.standard(bot), options));
        this.lastLocation = null;
    }

    private findLocation(): Vec3 | null {
        let point: Vec3;
        if (this.options.newChunks) {
            point = this.bot.entity.position.plus(WalkAroundModule.offsets[this.options.rotateChunks ? this.chunkRotationNum : Math.floor(4 * Math.random())]);
        } else {
            point = this.bot.entity.position;
        }
        let list = this.bot.findBlocks({
            matching: (b) => this.options.preferBlockIds.includes(b.type),
            maxDistance: this.options.searchRadius,
            count: 400,
            point
        });

        // safe to assume air above since grass is growing there
        list = list.filter(bl => !this.lastLocation?.equals(bl));

        list = list.length > 0 ? list : this.bot.findBlocks({
            matching: (b) => !this.options.avoidBlockIds.includes(b.type),
            maxDistance: this.options.searchRadius,
            count: 400,
            point
        });
  
        list = list.filter(bl =>  !this.lastLocation?.equals(bl)
            && this.bot.blockAt(bl.offset(0, 1, 0))!.type == this.bot.registry.blocksByName.air.id
            && this.bot.blockAt(bl.offset(0, 1, 0))!.type == this.bot.registry.blocksByName.air.id)

        // console.log("whatever:", list, list.length);
        if (this.lastLocation) {
            if (this.options.newChunks) list = list.sort((a, b) => this.lastLocation!.distanceSquared(b) - this.lastLocation!.distanceSquared(a));
            else list = list.sort((a, b) => this.lastLocation!.distanceSquared(a) - this.lastLocation!.distanceSquared(b));

        }
        if (this.options.rotateChunks) {
            this.chunkRotationNum = this.chunkRotationNum > 2 ? 0 : this.chunkRotationNum + 1;
        }

        // closest to new chunk if newChunks, farthest away if not.
        return list.length > 0 ? this.options.newChunks ? list[0] : list[list.length -1 - (Math.floor(list.length / 10 * Math.random()))]: null;
    }

    public override async perform(): Promise<boolean> {
        super.perform();
        let bl = this.findLocation();
        if (!bl) {
            super.complete(false);
            return false;
        }
        try {
            await this.bot.pathfinder.goto(new goals.GoalGetToBlock(bl.x, bl.y, bl.z))
            this.lastLocation = this.bot.entity.position.floored();
            this.complete(true);
            return true
        } catch (e: any) {
            // just going to end.
            this.complete(false);
            return false;
        }
    }

    public override async cancel(): Promise<boolean> {
        this.bot.pathfinder.stop();
        this.bot.pathfinder.setGoal(null);
        return super.cancel();
    }

}