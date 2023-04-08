import { Bot, BotEvents, createBot } from "mineflayer";
import antiafk, {
  AFKModule,
  AFKModuleOptions,
  AFKPassive,
  AFKPassiveOptions,
} from "../src/index";

import { promisify } from "util";
import { KillAuraPassive } from "../src/passives/killaura";
import { pathfinder } from "mineflayer-pathfinder";
const sleep = promisify(setTimeout);

const bot = createBot({
  username: "antiafk-testing",
  host: process.argv[2] ?? "localhost",
  port: Number(process.argv[3]) ?? 25565,
  hideErrors: false,
});

bot.loadPlugin(pathfinder)
bot.loadPlugin(antiafk);

// Example of a custom AFK module setting.
interface TestModuleOptions extends AFKModuleOptions {
  messageToSend: string;
}

// Example of a custom AFK module.
// These can be inserted at runtime.
class TestModule extends AFKModule<TestModuleOptions> {

  public override async perform(): Promise<boolean> {
    super.perform();

    this.bot.chat("began test module. " + this.options.messageToSend);
    await sleep(1000);

    this.complete(true);
    return true;
  }

  public override async cancel(): Promise<boolean> {
    this.bot.chat("canceled test module.");
    return super.cancel();
  }
}

import type {Block} from 'prismarine-block'

// class TestPassive extends AFKPassive<AFKPassiveOptions, 'blockUpdate'> {
 
//   protected eventWanted = "blockUpdate" as const;

//   public listener = (oldBlock: Block | null, newBlock: Block) => {
    
//   }
 
// }

class TestPassive1 extends AFKPassive<AFKPassiveOptions, 'diggingCompleted'> {
  protected eventWanted = "diggingCompleted" as const;

  public listener = (block: Block) => {
    console.log([block.name, block.position])
  };
}


bot.once("spawn", async () => {
  // insert generic type of module wanted.
  // instantiation is handled internally.
  // bot.antiafk.addModules(TestModule);
  bot.antiafk.addPassives(TestPassive1);

  bot.antiafk.on('moduleCompleted', (mod, suc, res) => console.log('complete', mod.constructor.name, suc, res))
  bot.antiafk.on('moduleStarted', (module) => console.log('start', module.constructor.name))


  // Weak type coercion. 
  bot.antiafk.setModuleOptions({
    TestModule: {
      enabled: true,
      messageToSend: "hi",
    },
  });

  // alternatively, for stronger type coercion:
  bot.antiafk.setOptionsForModule(TestModule, {
    enabled: true,
    messageToSend: "bye",
  });

  // demonstration of setting multiple module settings at a time.
  // note: these are the default settings.
  bot.antiafk.setModuleOptions({
    WalkAroundModule: {
      enabled: true,
      newChunks: true,
      rotateChunks: true,
      searchRadius: 8,
    },
    ChatBotModule: {
      enabled: false,
      random: false,
      messages: ["NextGEN Anti-afk Module", "test", "test1", "test2"],
      delay: 2000,
      variation: 300,
    },
    LookAroundModule: {
      enabled: true,
    },
    RandomMovementModule: {
      enabled: false,
    },
    BlockBreakModule: {
      enabled: true,
      // locate all easily broken blocks via this method.
      preferBlockIds: bot.registry.blocksArray
        .filter((b) => b.hardness && b.hardness <= 0.5 && b.boundingBox === 'block')
        .map((b) => b.id),
    },
  });

  // demonstration of setting passive options
  // passives follow the same conventions as modules
  bot.antiafk.setPassiveOptions({
    KillAuraPassive: {
      enabled: true,
      multi: true,
      reach: 5,
    },
  });

  bot.antiafk.setOptionsForPassive(KillAuraPassive, {
    enabled: true,
    multi: false,
    reach: 3,
    playerWhitelist: ["Generel_Schwerz"]
  })

  // dynamically remove modules.
  // module settings are persistent across removal.
  // bot.antiafk.removeModules(TestModule);

  bot.antiafk.start()

 
});

bot.on("chat", async (username, message) => {
  const split = message.split(" ");
  switch (split[0]) {
    case "start":
      bot.antiafk.start();
      break;
    case "stop":
    case "cease":
      bot.antiafk.stop();
      break;
    case "forcestop":
      bot.chat("stopping???");
      bot.antiafk.forceStop();
      break;
  }
});


bot.on('error', (error) => console.log('bot end', error))
bot._client.on('end', (reason) => console.log('client end', reason))
bot._client.on('error', (error) => console.log('client error', error))