import { Bot } from "mineflayer";
import { AFKModule } from "./module";

export class LookAroundModule extends AFKModule {


    public constructor(bot: Bot) {
        super(bot)
    }

    public async perform(): Promise<boolean> {
        super.perform();
        let yaw = 2*Math.random()*Math.PI - (0.5*Math.PI);
        let pitch = Math.random()*Math.PI - (0.5*Math.PI);
        await this.bot.look(yaw,pitch,false);
        this.complete(true);
        return true;
    }

    public async cancel(): Promise<boolean> {
        await this.bot.look(this.bot.entity.yaw, this.bot.entity.pitch, true) // override continued head movement.
        
        super.cancel();
        return true;
    }
}