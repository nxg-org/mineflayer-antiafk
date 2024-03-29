import { Bot } from 'mineflayer'
import { customMerge, sleep } from '../utils'
import { AFKModule, AFKModuleOptions } from './module'

export interface ChatBotOpts extends AFKModuleOptions {
  messages: string[]
  random: boolean
  delay: number
  variation: number
  count?: number
}

const tmp = { enabled: false, messages: ['NextGEN Anti-afk Module'], random: false, delay: 3000, variation: 150 }

export class ChatBot extends AFKModule<ChatBotOpts> {
  public constructor (bot: Bot, options: Partial<ChatBotOpts> = {}) {
    super(bot, customMerge(tmp, options))
  }

  public override async perform (): Promise<boolean> {
    super.perform()
    const max = this.options.count ?? this.options.messages.length
    let i = 0
    while (i < max && !this.shouldCancel) {
      this.bot.chat(this.options.messages[this.options.random ? Math.floor(this.options.messages.length * Math.random()) : i % this.options.messages.length])
      if (i++ - 1 < max) await sleep(this.options.delay + (this.options.variation * (Math.random() > 0.5 ? -Math.random() : Math.random())))
    }
    this.complete(true)
    return true
  }
}
