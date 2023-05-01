import { Bot, ControlState } from 'mineflayer'
import { randomElement, sleep } from '../utils'
import { AFKModule, AFKModuleOptions } from './module'
import { performance } from 'perf_hooks'

type WalkDir = 'forward' | 'back' | 'left' | 'right'
const walkActions = ['forward', 'back', 'left', 'right'] as const

export type ISimpleWalkOpts = AFKModuleOptions & {
  randomChoices: boolean
  choices: readonly WalkDir[]
  time?: number
  distance?: number
}

export class SimpleWalkOpts implements ISimpleWalkOpts {
  constructor (
    public enabled: boolean = false,
    public randomChoices: boolean = false,
    public choices: readonly WalkDir[] = walkActions,
    public time?: number,
    public distance?: number
  ) {}

  public static standard () {
    return new SimpleWalkOpts(true)
  }

  public static random () {
    return new SimpleWalkOpts(false)
  }
}

/**
 * The only issue with this class right now
 * is that it wanders slowly over time if left alone.
 * I can fix that easily by making the search radius be based around the intiial starting point of the bot
 * instead of chunk offsets
 * but that requires me to acknowledge when the module is actually started.
 */
export class SimpleWalk extends AFKModule<ISimpleWalkOpts> {
  private lastIdx = 0
  private getDirection (): WalkDir {
    if (this.options.randomChoices) return randomElement(this.options.choices)
    return this.options.choices[this.lastIdx++ % this.options.choices.length]
  }

  private getOppositeDir (dir: WalkDir): WalkDir {
    switch (dir) {
      case 'forward': return 'back'
      case 'back': return 'forward'
      case 'left': return 'right'
      case 'right': return 'left'
    }
  }

  public override async perform (): Promise<boolean> {
    super.perform()

    const choice = this.getDirection()
    const opposite = this.getOppositeDir(choice)

    const sTime = performance.now()
    const sPos = this.bot.entity.position.clone()
    while (!this.shouldCancel) {
      if (this.options.time) { if (performance.now() - sTime > this.options.time) break }
      if (this.options.distance) { if (this.bot.entity.position.xzDistanceTo(sPos) > this.options.distance) break }

      if ((this.bot.entity as any).isInWater) this.bot.setControlState('jump', true)

      this.bot.clearControlStates()
      this.bot.setControlState(choice, true)

      await sleep(50)
    }

    if (this.shouldCancel) return this.complete(false, 'Canceled!')
    return this.complete(true)
  }

  public override async cancel (): Promise<boolean> {
    this.bot.pathfinder.stop()
    return await super.cancel()
  }
}
