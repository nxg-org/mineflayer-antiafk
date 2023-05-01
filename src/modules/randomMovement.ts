import { Bot, ControlState } from 'mineflayer'
import { sleep } from '../utils'
import { AFKModule, AFKModuleOptions } from './module'

export class RandomMovement extends AFKModule<AFKModuleOptions> {
  private static readonly controlStates: ControlState[] = ['jump', 'sprint', 'sneak', 'left', 'right', 'forward', 'back']
  private readonly liquidBlocks: number[]

  public constructor (bot: Bot, options: Partial<AFKModuleOptions> = {}) {
    super(bot, options)

    this.liquidBlocks = bot.pathfinder?.movements
      ? Array.from(bot.pathfinder?.movements.liquids)
      : [
          bot.registry.blocksByName.water.id,
          bot.registry.blocksByName.lava.id
        ]
  }

  /**
     * It doesn't matter whether or not conflicting keycontrols occur
     * since they simply cancel out in prismarine-physics.
     * I will not bother with checking for that.
     * I will change if people ask me to.
     * @returns Whether bot moved in accordance to randomMovement's decisions.
     */
  public override async perform (): Promise<boolean> {
    super.perform()
    if (this.bot.pathfinder?.isMoving()) {
      this.complete(false, 'pathfinder exists and is already moving.')
      return false
    }
    const currentStates: Array<[ControlState, boolean]> = RandomMovement.controlStates.map(name => [name, Math.random() > 0.5])
    currentStates.map(([name, val]) => this.bot.setControlState(name, val))

    if (this.liquidBlocks.includes(this.bot.blockAt(this.bot.entity.position)?.type ?? -1)) {
      this.bot.setControlState('jump', true)
    }

    this.bot.swingArm('right')

    await sleep(1000)
    this.complete(true)
    return true
  }

  public complete (success: boolean, reason?: string): boolean {
    RandomMovement.controlStates.map(name => this.bot.setControlState(name, false))
    return super.complete(success, reason)
  }
}
