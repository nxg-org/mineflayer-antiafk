import { AFKModule, AFKModuleOptions } from './module'
import { performance } from 'perf_hooks'
import { Vec3 } from 'vec3'
import { sleep } from '../utils'

export type IBlockWalkOpts = AFKModuleOptions & {
  distance?: number
  time?: number
}

export class BlockWalkOpts implements IBlockWalkOpts {
  constructor (public enabled: boolean = false, public distance: number) {}

  public static standard () {
    return new BlockWalkOpts(true, 16)
  }
}

/**
 * The only issue with this class right now
 * is that it wanders slowly over time if left alone.
 * I can fix that easily by making the search radius be based around the intiial starting point of the bot
 * instead of chunk offsets
 * but that requires me to acknowledge when the module is actually started.
 */
export class BlockWalk extends AFKModule<IBlockWalkOpts> {
  public override async perform (): Promise<boolean> {
    super.perform()
    for (let i = 0; i < 4; i++) {
      await this.bot.look((Math.PI / 2) * i, 0, true)
      this.bot.clearControlStates()
      this.bot.setControlState('forward', true)

      const sPos = this.bot.entity.position.clone()
      const sTime = performance.now()

      while (!this.shouldCancel) {
        if (this.options.time) { if (performance.now() - sTime > this.options.time) break }
        if (this.options.distance) { if (this.bot.entity.position.xzDistanceTo(sPos) > this.options.distance) break }

        await sleep(50)
      }
      if (this.shouldCancel) break
    }
    if (this.shouldCancel) return this.complete(false, 'Canceled!')
    return this.complete(true)
  }

  public override async cancel (): Promise<boolean> {
    this.bot.pathfinder.stop()
    return await super.cancel()
  }
}
