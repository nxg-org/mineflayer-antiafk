import { AFKModule } from './module'

export class SwingArm extends AFKModule {
  public override async perform (): Promise<boolean> {
    super.perform()
    this.bot.swingArm('right', true)
    return this.complete(true)
  }
}
