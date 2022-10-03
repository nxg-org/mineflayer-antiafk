import { Bot } from "mineflayer";
import { AFKModule, AFKModuleOptions } from "./module";
import { Vec3 } from "vec3";
import type { Block } from "prismarine-block"
import { goals, Movements } from "mineflayer-pathfinder";
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
    private avoidSurroundingBlocks: number[];

    private readonly offsets: Vec3[] = [new Vec3(1, 0, 0), new Vec3(0, 1, 0), new Vec3(0, 0, -1)]

    // private readonly breakingMovements: Movements;




    constructor(bot: Bot, options: Partial<BlockBreakModuleOptions>) {
        super(bot)
        this.lastLocation = null;
        this.options = !!options ? mergeDeepNoArrayConcat(BlockBreakModuleOptions.standard(bot), options) : BlockBreakModuleOptions.standard(bot)
        this.avoidSurroundingBlocks = [bot.registry.blocksByName.water.id, bot.registry.blocksByName.lava.id];
        // this.breakingMovements = new Movements(bot, bot.registry);
        // this.breakingMovements.blocksToAvoid.add(bot.registry.blocksByName.water.id);
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
            return blocks[blocks.length - 1 - (Math.floor((blocks.length / 10) * Math.random()))];
        }



    }

    public async perform(): Promise<boolean> {
        super.perform();
        let bl = this.findBlock();
        if (!bl) {
            this.complete(false);
            return false;
        }
      
        this.lastLocation = bl.position;
        try {
            // const oldMovements = this.bot.pathfinder.movements;
            // this.bot.pathfinder.setMovements(this.breakingMovements)
            await this.bot.pathfinder.goto(new goals.GoalLookAtBlock(bl.position, this.bot.world))
            // this.bot.pathfinder.setMovements(oldMovements);


            let killMe1 = false;
            if (this.bot.pathfinder.movements.liquids.has(this.bot.blockAt(this.bot.entity.position)!.type) 
            && this.bot.pathfinder.movements.liquids.has(this.bot.blockAt(this.bot.entity.position.offset(0, -1, 0))!.type) ) {
                killMe1 = true;
                this.bot.setControlState("jump", true);
            }

            // bro I can't even catch the error. it's internally in dig. Fuck off.
            await this.bot.dig(bl, true, 'raycast')

            if (killMe1) {
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
    public async cancel(): Promise<boolean> {
        this.bot.pathfinder.stop();
        this.bot.pathfinder.setGoal(null);
        this.bot.stopDigging();
        
        super.cancel();
        return true;
    }



}