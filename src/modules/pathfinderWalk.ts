import { Bot } from 'mineflayer'
import { goals } from 'mineflayer-pathfinder'
import { Vec3 } from 'vec3'
import { customMerge } from '../utils'
import { AFKModule, AFKModuleOptions } from './module'
import { performance } from 'perf_hooks'

export interface IPathfinderWalkOpts extends AFKModuleOptions {
  newChunks: boolean
  rotateChunks: boolean
  //  stayNearOrigin: boolean = false,
  preferBlockIds: number[]
  avoidBlockIds: number[]
  timeout: number
  searchRadius: number
}

export class PathfinderWalkOpts implements IPathfinderWalkOpts {
  constructor (
    public enabled: boolean = false,
    public newChunks: boolean = false,
    public rotateChunks: boolean = false,
    // public stayNearOrigin: boolean = false,
    public preferBlockIds: number[] = [],
    public avoidBlockIds: number[] = [],
    public searchRadius: number = 16,
    public timeout: number = 10000
  ) {}

  public static standard (bot: Bot) {
    return new PathfinderWalkOpts(
      false,
      false,
      false,
      // false,
      [bot.registry.blocksByName.grass.id, bot.registry.blocksByName.cobblestone.id],
      [bot.registry.blocksByName.water.id, bot.registry.blocksByName.lava.id, bot.registry.blocksByName.air.id]
    )
  }

  public static TwoBTwoT (bot: Bot) {
    return new PathfinderWalkOpts(
      false,
      true,
      true,
      // true,
      [
        bot.registry.blocksByName.grass.id,
        bot.registry.blocksByName.cobblestone.id,
        bot.registry.blocksByName.obsidian.id
      ],
      [bot.registry.blocksByName.water.id, bot.registry.blocksByName.lava.id, bot.registry.blocksByName.air.id]
    )
  }
}

/**
 * The only issue with this class right now
 * is that it wanders slowly over time if left alone.
 * I can fix that easily by making the search radius be based around the intiial starting point of the bot
 * instead of chunk offsets
 * but that requires me to acknowledge when the module is actually started.
 */
export class PathfinderWalk extends AFKModule<IPathfinderWalkOpts> {
  private lastLocation: Vec3 | null
  private chunkRotationNum = 0
  private static readonly offsets: Vec3[] = [
    new Vec3(16, 0, 0),
    new Vec3(0, 0, 16),
    new Vec3(-16, 0, 0),
    new Vec3(0, 0, -16)
  ]

  constructor (bot: Bot, options: Partial<IPathfinderWalkOpts> = {}) {
    super(bot, customMerge(PathfinderWalkOpts.standard(bot), options))
    this.lastLocation = null
  }

  private readonly goodPos = (bl: Vec3) => {
    return (
      !this.lastLocation?.equals(bl) &&
      this.bot.blockAt(bl.offset(0, 1, 0))!.type === this.bot.registry.blocksByName.air.id &&
      this.bot.blockAt(bl.offset(0, 2, 0))!.type === this.bot.registry.blocksByName.air.id &&
      this.bot.blockAt(bl.offset(1, 2, 0))!.type === this.bot.registry.blocksByName.air.id &&
      this.bot.blockAt(bl.offset(-1, 2, 0))!.type === this.bot.registry.blocksByName.air.id &&
      this.bot.blockAt(bl.offset(0, 2, 1))!.type === this.bot.registry.blocksByName.air.id &&
      this.bot.blockAt(bl.offset(0, 2, -1))!.type === this.bot.registry.blocksByName.air.id
    )
  }

  private findLocation (): Vec3 | null {
    let point: Vec3
    let list: Vec3[]
    const preferBl = new Set(this.options.preferBlockIds)
    const avoidBl = new Set(this.options.avoidBlockIds)

    // perform check only once if staying in same chunk.
    for (let i = this.options.newChunks ? 0 : 4; i < 4; i++) {
      if (this.options.newChunks) {
        point = this.bot.entity.position.plus(
          PathfinderWalk.offsets[this.options.rotateChunks ? this.chunkRotationNum : Math.floor(4 * Math.random())]
        )
      } else {
        point = this.bot.entity.position
      }

      list = this.bot
        .findBlocks({
          matching: (b) => preferBl.has(b.type),
          maxDistance: this.options.searchRadius,
          count: 400,
          point
        })
        .filter(this.goodPos)

      if (list.length === 0) {
        list = this.bot
          .findBlocks({
            matching: (b) => !avoidBl.has(b.type),
            maxDistance: this.options.searchRadius,
            count: 1600,
            point
          })
          .filter(this.goodPos)
      }

      if (this.lastLocation != null) {
        if (this.options.newChunks) { list = list.sort((a, b) => this.lastLocation!.distanceSquared(b) - this.lastLocation!.distanceSquared(a)) } else list = list.sort((a, b) => this.lastLocation!.distanceSquared(a) - this.lastLocation!.distanceSquared(b))
      }
      if (this.options.rotateChunks) {
        // wrap back around.
        this.chunkRotationNum = this.chunkRotationNum === 3 ? 0 : this.chunkRotationNum + 1
      }

      if (list.length > 0) {
        // closest to new chunk if newChunks, farthest away if not.
        return this.options.newChunks
          ? list[0]
          : list[list.length - 1 - Math.floor((list.length / 10) * Math.random())]
      }
    }
    return null
  }

  /**
   * Forceful override for position changes.
   * This will detect whether or not pathfinder is stuck.
   */
  private noXZMovementWatcher () {
    let lastRunTime = performance.now()
    const currentPos = this.bot.entity.position.clone()
    const listener = (pos: Vec3) => {
      if (!this.isActive) this.bot.off('move', listener)
      if (currentPos.x === pos.x && currentPos.z === pos.z) {
        if (performance.now() - lastRunTime > this.options.timeout) {
          this.bot.off('move', listener)
          console.log(this.isActive, 'cancelling')
          // rough patch, but it's fine for now.
          // only trigger cancel event if this is still running, otherwise quietly quit.
          if (this.isActive) this.cancel()
        }
      } else {
        lastRunTime = performance.now()
        currentPos.set(pos.x, pos.y, pos.z)
      }
    }

    this.bot.on('move', listener)
  }

  public override async perform (): Promise<boolean> {
    super.perform()
    const bl = this.findLocation()
    if (bl == null) {
      this.complete(false, 'no suitable blocks.')
      return false
    }

    this.noXZMovementWatcher()

    this.lastLocation = bl
    let complete = false
    let message
    try {
      await this.bot.pathfinder.goto(new goals.GoalGetToBlock(bl.x, bl.y, bl.z))
      this.lastLocation = this.bot.entity.position.offset(0, -1, 0).floored()
      complete = true
    } catch (e: any) {
      message = 'failed to traverse to goal. ' + String(e)
    } finally {
      return this.complete(complete, message)
    }
  }

  public override async cancel (): Promise<boolean> {
    this.bot.pathfinder.stop()
    return await super.cancel()
  }
}
