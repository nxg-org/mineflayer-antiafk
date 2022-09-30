import { Bot, ControlState } from "mineflayer";
import { sleep } from "../utils";
import { AFKModule } from "./module";

export class RandomMovementModule extends AFKModule {


    private static readonly controlStates: ControlState[] = ["jump", "sprint", "sneak", "left", "right", "forward", "back"]

    public constructor(bot: Bot) {
        super(bot)
    }


    /**
     * It doesn't matter whether or not conflicting keycontrols occur
     * since they simply cancel out in prismarine-physics.
     * I will not bother with checking for that.
     * I will change if people ask me to.
     * @returns Whether bot moved in accordance to randomMovement's decisions.
     */
    public async perform(): Promise<boolean> {
        if (this.bot.pathfinder.isMoving()) return false;
        let currentStates: [ControlState, boolean][] = RandomMovementModule.controlStates.map(name => [name, Math.random() > 0.5])
        currentStates.map(([name, val]) => this.bot.setControlState(name, val))
        await sleep(1000);
        this.complete(true)
        return true;
    }

    public async cancel(): Promise<boolean> {
        if (this.bot.pathfinder.isMoving()) return false;
        RandomMovementModule.controlStates.map(name => this.bot.setControlState(name, false))
        this.complete(false)
        return true;
    }



}