import { AFKModule } from './module'

export class SwingArm extends AFKModule {
  public override async perform (): Promise<boolean> {
    super.perform()
    this.bot.swingArm('right')
    return this.complete(true)
  }
}
