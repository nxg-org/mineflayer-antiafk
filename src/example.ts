import { createBot } from "mineflayer";
import antiafk from "./index";
import autoEat from "@nxg-org/mineflayer-auto-eat";


const bot = createBot({
    username: "antiafk-testing",
    host: process.argv[2] ?? "localhost",
    port: Number(process.argv[3]) ?? 25565,
});

bot.loadPlugin(autoEat);
bot.loadPlugin(antiafk);



bot.once("spawn", () => {
    bot.antiafk.setModuleOptions(
        {
            walkAround: {
                enabled: true,
                newChunks: true,
                rotateChunks: true,
                searchRadius: 8
            },
            chatBot: {
                enabled: true,
                random: false,
                messages: ["test", "test1", "test2"],
                delay: 1000,
                variation: 300
            },
            lookAround: {
                enabled: true
            },
            randomMovement: {
                enabled: true
            },
            blockBreak: {
                enabled: true,
                // locate all easily broken blocks via this method.
                preferBlockIds: Object.values(bot.registry.blocks).filter(b => b.hardness && b.hardness >= 0.5).map(b => b.id)
            },
        },
    );
    bot.antiafk.setPassiveOptions({
        killAura: {
            enabled: true,
            multi: true,
            reach: 5
        },
        eat: {
            enabled: true
        }
    })
}
)

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
