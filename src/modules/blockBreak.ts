import { Bot } from "mineflayer";
import { AFKModule, AFKModuleOptions } from "./module";
import { Vec3 } from "vec3";
import type { Block } from "prismarine-block"
import { goals, Movements } from "mineflayer-pathfinder";
import { customMerge as customMerge } from "../utils";


export class BlockBreakModuleOptions implements AFKModuleOptions {
    constructor(
        public enabled: boolean = false,
        public preferBlockIds: Set<number> = new Set(),
        public avoidBlockIds: Set<number> = new Set(),
        public searchRadius: number = 16
    ) { }

    public static standard(bot: Bot, maxGoodHardness: number = 0.5, minAvoidHardness: number = 1.4) {
        return new BlockBreakModuleOptions(
            false,
            new Set(Object.values(bot.registry.blocks).filter(b => b.hardness && b.hardness <= maxGoodHardness).map(b => b.id)),
            new Set(Object.values(bot.registry.blocks).filter(b => b.hardness && b.hardness >= minAvoidHardness).map(b => b.id)),
            16
        )
    }
}


export class BlockBreakModule extends AFKModule<BlockBreakModuleOptions> {
    private lastLocation: Vec3 | null;
    private avoidSurroundingBlocks: number[];

    private readonly offsets: Vec3[] = [new Vec3(1, 0, 0), new Vec3(0, 1, 0), new Vec3(0, 0, -1)]

    constructor(bot: Bot, options: Partial<BlockBreakModuleOptions> = {}) {
        super(bot, customMerge(BlockBreakModuleOptions.standard(bot), options))
        this.lastLocation = null;
        this.avoidSurroundingBlocks = [bot.registry.blocksByName.water.id, bot.registry.blocksByName.lava.id];
    }

    /**
     * Every block we pass to here is already found.
     * Therefore there is no need to check for null.
     */
    private badLiquidCheck(block: Block): boolean {
        return this.offsets.some(off => {
            const first = this.bot.blockAt(block.position.plus(off))
            const second = this.bot.blockAt(block.position.minus(off));
            const third = this.bot.blockAt(block.position.plus(off.scaled(2)))
            const fourth = this.bot.blockAt(block.position.minus(off.scaled(2))); // laziness.
     
            if (!first || !second || !third || !fourth) return true;
            const killMe = [first, second, third, fourth]
            return killMe.some(bl => this.avoidSurroundingBlocks.includes(bl.type));
        })


    }

    private checkBlockList(list: Vec3[]): Block[] | false {
        let blocks = list.map(pos => this.bot.blockAt(pos)).filter(b => !!b) as Block[]
        if (!!this.lastLocation) blocks = blocks.filter(bl => !bl.position.equals(this.lastLocation!))
        blocks = blocks.filter(bl => this.bot.canSeeBlock(bl) && this.bot.canDigBlock(bl) && !this.badLiquidCheck(bl));
        return blocks.length > 0 ? blocks : false;
    }

    private findBlock(): Block | null {
        let list = this.bot.findBlocks({
            matching: (b) => this.options.preferBlockIds.has(b.type),
            maxDistance: this.options.searchRadius,
            count: 400,
        });

        if (!this.checkBlockList(list)) {
            list = this.bot.findBlocks({
                matching: (b) => !this.options.avoidBlockIds.has(b.type),
                maxDistance: this.options.searchRadius,
                count: 400,
            });
        }

        let blocks = this.checkBlockList(list);
        if (!blocks) {
            return null;
        } else {
            blocks = blocks.sort((a, b) => this.bot.entity.position.distanceSquared(a.position) - this.bot.entity.position.distanceSquared(b.position))
            return blocks[blocks.length - 1 - (Math.floor((blocks.length / 10) * Math.random()))];
        }



    }

    public override async perform(): Promise<boolean> {
        super.perform();
        let bl = this.findBlock();
        if (!bl) {
            this.complete(false);
            return false;
        }
      
        this.lastLocation = bl.position;
        try {
            await this.bot.pathfinder.goto(new goals.GoalLookAtBlock(bl.position, this.bot.world))

            // note: this is to make the bot stop sinking when digging.
            let pleaseStayAfloat = false;
            if (this.bot.pathfinder.movements.liquids.has(this.bot.blockAt(this.bot.entity.position)?.type ?? -1) 
            && this.bot.pathfinder.movements.liquids.has(this.bot.blockAt(this.bot.entity.position.offset(0, -1, 0))?.type ?? -1 ) ) {
                pleaseStayAfloat = true;
                this.bot.setControlState("jump", true);
            }

            // Note: this may error.
            // I cannot catch this error as it is internal.
            // So basically, this may crash. :thumbsup:
            await this.bot.dig(bl, true, 'raycast')

            if (pleaseStayAfloat) {
                this.bot.setControlState("jump", false);
            }

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
        this.bot.stopDigging();
        return super.cancel();
    }



}