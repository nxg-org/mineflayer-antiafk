import { Bot } from 'mineflayer'
import { AFKModule, AFKModuleOptions } from './module'
import { Vec3 } from 'vec3'
import type { Block } from 'prismarine-block'
import { goals, Movements } from 'mineflayer-pathfinder'
import { customMerge } from '../utils'

export interface IBlockBreakOpts extends AFKModuleOptions {
  preferBlockIds: number[]
  avoidBlockIds: number[]
  searchRadius: number
  timeout: number
}

export class BlockBreakOpts implements IBlockBreakOpts {
  constructor (
    public enabled: boolean = false,
    public preferBlockIds: number[] = [],
    public avoidBlockIds: number[] = [],
    public searchRadius: number = 16,
    public timeout: number = 10000
  ) {}

  public static standard (bot: Bot, maxGoodHardness: number = 0.5, minAvoidHardness: number = 1.4) {
    return new BlockBreakOpts(
      false,
      bot.registry.blocksArray.filter((b) => b.hardness && b.hardness <= maxGoodHardness).map((b) => b.id),
      bot.registry.blocksArray.filter((b) => b.hardness && b.hardness >= minAvoidHardness).map((b) => b.id)
    )
  }
}

export class BlockBreak extends AFKModule<IBlockBreakOpts> {
  private lastLocation: Vec3 | null
  private readonly avoidSurroundingBlocks: number[]

  private readonly offsets: Vec3[] = [new Vec3(1, 0, 0), new Vec3(0, 1, 0), new Vec3(0, 0, -1)]

  constructor (bot: Bot, options: Partial<IBlockBreakOpts> = {}) {
    super(bot, customMerge(BlockBreakOpts.standard(bot), options))
    this.lastLocation = null
    this.avoidSurroundingBlocks = [bot.registry.blocksByName.water.id, bot.registry.blocksByName.lava.id]
  }

  /**
   * Every block we pass to here is already found.
   * Therefore there is no need to check for null.
   */
  private badLiquidCheck (block: Block): boolean {
    return this.offsets.some((off) => {
      const first = this.bot.blockAt(block.position.plus(off))
      const second = this.bot.blockAt(block.position.minus(off))
      const third = this.bot.blockAt(block.position.plus(off.scaled(2)))
      const fourth = this.bot.blockAt(block.position.minus(off.scaled(2))) // laziness.

      if ((first == null) || (second == null) || (third == null) || (fourth == null)) return true
      const killMe = [first, second, third, fourth]
      return killMe.some((bl) => this.avoidSurroundingBlocks.includes(bl.type))
    })
  }

  private checkBlockList (list: Vec3[]): Block[] | false {
    let blocks = list.map((pos) => this.bot.blockAt(pos)).filter((b) => !(b == null)) as Block[]
    if (this.lastLocation != null) blocks = blocks.filter((bl) => !bl.position.equals(this.lastLocation!))
    blocks = blocks.filter((bl) => this.bot.canSeeBlock(bl) && this.bot.canDigBlock(bl) && !this.badLiquidCheck(bl))
    return blocks.length > 0 ? blocks : false
  }

  private findBlock (): Block | null {
    let list = this.bot.findBlocks({
      matching: (b) => this.options.preferBlockIds.includes(b.type) && b.boundingBox === 'block',
      maxDistance: this.options.searchRadius,
      count: 400
    })

    if (!this.checkBlockList(list)) {
      list = this.bot.findBlocks({
        matching: (b) => !this.options.avoidBlockIds.includes(b.type) && b.boundingBox === 'block',
        maxDistance: this.options.searchRadius,
        count: 400
      })
    }

    let blocks = this.checkBlockList(list)
    if (!blocks) {
      return null
    } else {
      blocks = blocks.sort(
        (a, b) =>
          this.bot.entity.position.distanceSquared(a.position) - this.bot.entity.position.distanceSquared(b.position)
      )
      return blocks[blocks.length - 1 - Math.floor((blocks.length / 10) * Math.random())]
    }
  }

  private noXZMovementWatcher () {
    let lastRunTime = performance.now()
    const currentPos = this.bot.entity.position.clone()
    const listener = (pos: Vec3) => {
      if (!this.isActive) this.bot.off('move', listener)
      if (currentPos.x === pos.x && currentPos.z === pos.z) {
        if (performance.now() - lastRunTime > this.options.timeout) {
          this.bot.off('move', listener)

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
    const bl = this.findBlock()
    if (bl == null) {
      this.complete(false, 'no suitable blocks to break.')
      return false
    }

    this.noXZMovementWatcher()

    this.lastLocation = bl.position
    let complete = false
    let message
    try {
      const goal = new goals.GoalGetToBlock(bl.position.x, bl.position.y, bl.position.z)
      await this.bot.pathfinder.goto(goal)
      await this.bot.lookAt(bl.position)
      const bl1 = this.bot.blockAtCursor()
      if (bl1 != null) await this.bot.dig(bl1, true, 'raycast')
      else throw Error('Did not find block when raycasting!')
      complete = true
    } catch (e: any) {
      message = String(e)
    } finally {
      this.complete(complete, message)
      return complete
    }
  }

  public override async cancel (): Promise<boolean> {
    this.bot.pathfinder.stop()
    this.bot.stopDigging()
    return await super.cancel()
  }
}
