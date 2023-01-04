import { Bot, BotEvents, createBot } from "mineflayer";
import antiafk, { AFKModule, AFKModuleOptions, AFKPassive } from "./index";
import type {Block} from "prismarine-block"

import { promisify } from "util";
const sleep = promisify(setTimeout);

const bot = createBot({
    username: "antiafk-testing",
    host: process.argv[2] ?? "localhost",
    port: Number(process.argv[3]) ?? 25565,
});

bot.loadPlugin(antiafk);



// Example of a custom AFK module setting.
interface TestModuleOptions extends AFKModuleOptions {
    messageToSend: string
}

// Example of a custom AFK module.
// These can be inserted at runtime.
class TestModule extends AFKModule {

    // weak typing convention.
    // specify a member-level "options" variable for strong conventions.
    public constructor(bot: Bot, options?: TestModuleOptions) {
        super(bot, options);
    }

    // // example:
    // public options: TestModuleOptions;
    // public constructor(bot: Bot, options?: TestModuleOptions) {
    //     super(bot);
    //     this.options = options ?? {enabled: false, messageToSend: "hi"};
    // }

    public override async perform(): Promise<boolean> {
        super.perform();

        this.bot.chat("began test module. " + this.options.messageToSend);
        await sleep(1000);

        this.complete(true);
        return true;
    }

    public override async cancel(): Promise<boolean> {
        this.bot.chat("canceled test module.")
        
        this.complete(false);
        return true;
    }
}


// Example passive for AFK.
class TestPassive extends AFKPassive {
    protected eventWanted: keyof BotEvents = "diggingCompleted"

    public listener = (...blocks: Block[]) => {
        console.log(blocks.map(b => [b.name, b.position]));
    };
}




bot.once("spawn", async () => {

    // insert generic type of module wanted.
    // instantiation is handled internally.
    bot.antiafk.addModules(TestModule);
    bot.antiafk.addPassives(TestPassive);

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
                preferBlockIds: Object.values(bot.registry.blocks).filter(b => b.hardness && b.hardness <= 0.5).map(b => b.id)
            },
        },
    );

    // demonstration of setting passive options
    // passives follow the same conventions as modules
    bot.antiafk.setPassiveOptions({
        KillAuraPassive: {
            enabled: true,
            multi: true,
            reach: 5
        },
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

