import { Bot } from "mineflayer";
import { AFKModule, AFKModuleOptions } from "./module";

export class LookAroundModule extends AFKModule<AFKModuleOptions> {

    public constructor(bot: Bot, options: Partial<AFKModuleOptions> = {}) {
        super(bot, options)
    }

    public override async perform(): Promise<boolean> {
        super.perform();
        let yaw = 2*Math.random()*Math.PI - (0.5*Math.PI);
        let pitch = Math.random()*Math.PI - (0.5*Math.PI);
        await this.bot.look(yaw,pitch,false);
        this.complete(true);
        return true;
    }

    public override async cancel(): Promise<boolean> {
        await this.bot.look(this.bot.entity.yaw, this.bot.entity.pitch, true) // override continued head movement.
        return super.cancel();
    }
}