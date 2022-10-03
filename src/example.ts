import { Bot, createBot } from "mineflayer";
import antiafk, { AFKModule, AFKModuleOptions } from "./index";
import autoEat from "@nxg-org/mineflayer-auto-eat";

import { promisify } from "util";
const sleep = promisify(setTimeout);

const bot = createBot({
    username: "antiafk-testing",
    host: process.argv[2] ?? "localhost",
    port: Number(process.argv[3]) ?? 25565,
});

bot.loadPlugin(autoEat);
bot.loadPlugin(antiafk);



// Example of a custom AFK module setting.
interface TestModuleOptions extends AFKModuleOptions {
    messageToSend: "hi"
}

// Example of a custom AFK module.
// These can be inserted at runtime.
class TestModule extends AFKModule {

    public constructor(bot: Bot, options?: TestModuleOptions) {
        super(bot, options);
    }

    public async perform(): Promise<boolean> {
        this.bot.chat("began test module. " + this.options.messageToSend);
        await sleep(1000);
        return true;
    }

    public async cancel(): Promise<boolean> {
        this.bot.chat("canceled test module.")
        return true;
    }
}



bot.once("spawn", async () => {

    // insert generic type of module wanted.
    // instantiation is handled internally.
    bot.antiafk.addModules(TestModule);

    // set module settings via this method.
    // the name must EXACTLY match the name of the class.
    bot.antiafk.setModuleOptions({
        TestModule: {
            enabled: true,
            messageToSend: "hi",
        }
    })

    // alternatively:
    bot.antiafk.setOptionsForModule(TestModule, {
        enabled: true,
        messageToSend: "bye",
    })

    // demonstration of setting multiple module settings at a time.
    // note: these are the default settings.
    bot.antiafk.setModuleOptions(
        {
            WalkAroundModule: {
                enabled: true,
                newChunks: true,
                rotateChunks: true,
                searchRadius: 8
            },
            ChatBotModule: {
                enabled: true,
                random: false,
                messages: ["test", "test1", "test2"],
                delay: 1000,
                variation: 300
            },
            LookAroundModule: {
                enabled: true
            },
            RandomMovementModule: {
                enabled: true
            },
            BlockBreakModule: {
                enabled: true,
                // locate all easily broken blocks via this method.
                preferBlockIds: Object.values(bot.registry.blocks).filter(b => b.hardness && b.hardness >= 0.5).map(b => b.id)
            },
        },
    );

    // demonstration of setting passive options
    // passives follow the same conventions as modules
    // ONE CAVEAT: "eat" = enable mineflayer-auto-eat.
    bot.antiafk.setPassiveOptions({
        KillAuraPassive: {
            enabled: true,
            multi: true,
            reach: 5
        },
        // special since relies on nxg-org/mineflayer-auto-eat.
        eat: {
            enabled: true
        }
    })

    // dynamically remove modules.
    // module settings are persistent across removal.
    // bot.antiafk.removeModules(TestModule);
})

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
            bot.chat("stopping???")
            bot.antiafk.forceStop()
            break;
    }
});

