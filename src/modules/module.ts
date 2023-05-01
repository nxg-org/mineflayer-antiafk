import { Bot } from 'mineflayer'
import { customMerge } from '../utils'
import type { AntiAFK } from '../antiafk'

export interface AFKModuleOptions {
  enabled: boolean
}

export abstract class AFKModule<T extends AFKModuleOptions = AFKModuleOptions> {
  /**
     * Whether or not the module should currently be running.
     */
  public isActive: boolean

  /**
     * Helper "breaking boolean" from running while loops.
     * Use this to make {@link AntiAFK.prototype.forceStop | forceStop()} more effective.
     */
  protected shouldCancel: boolean = false

  /**
     * Options for module.
     * Note: This is usually overriden. Just a default.
     */
  public options: T

  public constructor (protected readonly bot: Bot, options: Partial<T> = {}) {
    this.isActive = false
    this.options = customMerge({ enabled: false }, options)
  }

  /**
     * Function to perform when entering module.
     * When implementing, always call super.perform() OR set isActive to true.
     * @returns {boolean} Whether module's action succeeded or not.
     */
  public async perform (): Promise<boolean> {
    this.isActive = true
    this.shouldCancel = false;
    return true
  }

  /**
     * Force cancel the module by setting {@link AFKModule.prototype.shouldCancel | shouldCancel} to true.
     * When implementing a module, all loops should break at {@link AFKModule.prototype.shouldCancel | shouldCancel} being true.
     * @returns {boolean} Whether or not cancellation of module completed successfully.
     */
  public async cancel (): Promise<boolean> {
    this.shouldCancel = true
    this.bot.antiafk.emit('moduleCanceled', this)
    this.cleanup()
    return true
  }

  public cleanup (): Promise<void> | void {
    this.bot.clearControlStates()
  }

  /**
     * Set options of current module.
     * @param {Partial<AFKModuleOptions> options Options for module.
     * @param {AFKModuleOptions} initial Initial options for module,
     *     {@link AFKModule.prototype.options | already specified options} if not.
     */
  public setOptions (options: Partial<AFKModuleOptions>, initial?: AFKModuleOptions): void {
    this.options = customMerge(initial ?? this.options, options)
  }

  /**
     * Handle completion of module
     * @param toEmit
     */
  public complete (success: boolean, reason?: string, ...toEmit: any[]): boolean {
    this.isActive = false;
    this.bot.antiafk.emit('moduleCompleted', this, success, reason, ...toEmit)
    this.cleanup()
    return success
  };

  /**
     * Signal completion of module.
     * @param {string} msg Name of event
     * @param {...any[]} any Other data to send.
     */
  public signal (msg: string, ...any: any[]) {
    this.bot.antiafk.emit('custom', msg, this, ...any)
  }

  public toString (): string {
    return `${this.constructor.name}{isActive: ${this.isActive}}`
  }
}
