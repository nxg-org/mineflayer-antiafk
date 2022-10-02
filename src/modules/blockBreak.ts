import { Bot } from "mineflayer";
import { AFKModule, AFKModuleOptions } from "./module";
import { Vec3 } from "vec3";
import type { Block } from "prismarine-block"
import { goals } from "mineflayer-pathfinder";
import { mergeDeepNoArrayConcat } from "../utils";


export class BlockBreakModuleOptions implements AFKModuleOptions {
    constructor(
        public enabled: boolean = false,
        public preferBlockIds: number[] = [],
        public avoidBlockIds: number[] = [],
        public searchRadius: number = 16
    ) { }

    public static standard(bot: Bot, maxGoodHardness: number = 0.5, minAvoidHardness: number = 1.4) {
        return new BlockBreakModuleOptions(
            false,
            Object.values(bot.registry.blocks).filter(b => b.hardness && b.hardness <= maxGoodHardness).map(b => b.id),
            Object.values(bot.registry.blocks).filter(b => b.hardness && b.hardness >= minAvoidHardness).map(b => b.id),
            16
        )   
    }
}


export class BlockBreakModule extends AFKModule {
    public options: BlockBreakModuleOptions;
    private lastLocation: Vec3 | null;

    constructor(bot: Bot, options: Partial<BlockBreakModuleOptions>) {
        super(bot)
        this.lastLocation = null;
        this.options = !!options ? mergeDeepNoArrayConcat(BlockBreakModuleOptions.standard(bot), options) : BlockBreakModuleOptions.standard(bot)
    }


    private checkBlockList(list: Vec3[]): Block[] | false {
        let blocks = list.map(pos => this.bot.blockAt(pos)).filter(b => !!b) as Block[]
        if (!!this.lastLocation) blocks = blocks.filter(bl => !bl.position.equals(this.lastLocation!))
        blocks = blocks.filter(bl => this.bot.canSeeBlock(bl) && this.bot.canDigBlock(bl));
        return blocks.length > 0 ? blocks : false;
    }

    private findBlock(): Block | null {
        let list = this.bot.findBlocks({
            matching: (b) => this.options.preferBlockIds.includes(b.type),
            maxDistance: this.options.searchRadius,
            count: 400,
        });

        if (!this.checkBlockList(list)) {
            list = this.bot.findBlocks({
                matching: (b) => !this.options.avoidBlockIds.includes(b.type),
                maxDistance: this.options.searchRadius,
                count: 400,
            });
        }

        let blocks = this.checkBlockList(list);
        if (!blocks) {
            return null;
        } else {
            blocks = blocks.sort((a, b) => this.bot.entity.position.distanceSquared(a.position) - this.bot.entity.position.distanceSquared(b.position))
            return  blocks[blocks.length - 1 - (Math.floor((blocks.length / 10) * Math.random()))];
        }
      

      
    }

    public async perform(): Promise<boolean> {
        let bl = this.findBlock();
        if (!bl) return false;
        this.isActive = true;
        this.lastLocation = bl.position;
        try {
            await this.bot.pathfinder.goto(new goals.GoalLookAtBlock(bl.position, this.bot.world))
            await this.bot.dig(bl, true, 'raycast')
            this.complete(true);
            return true
        } catch (e: any) {
            // just going to end.
            this.complete(false);
            return false;
        }

    }
    public async cancel(): Promise<boolean> {
        this.bot.pathfinder.stop();
        this.bot.pathfinder.setGoal(null);
        this.bot.stopDigging();
        this.complete(false);
        return true;
    }



}