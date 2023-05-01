import { Bot } from 'mineflayer'
import { AFKModule, AFKModuleOptions } from './module'

export class LookAround extends AFKModule {
  public override async perform (): Promise<boolean> {
    super.perform()
    const yaw = 2 * Math.random() * Math.PI - (0.5 * Math.PI)
    const pitch = Math.random() * Math.PI - (0.5 * Math.PI)
    await this.bot.look(yaw, pitch, false)
    return this.complete(true)
  }

  public override async cancel (): Promise<boolean> {
    await this.bot.look(this.bot.entity.yaw, this.bot.entity.pitch, true) // override continued head movement.
    return await super.cancel()
  }
}
