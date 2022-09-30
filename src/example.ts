import { createBot } from "mineflayer";
import antiafk from "./index";


const bot = createBot({
    username: "antiafk-testing",
    host: process.argv[2] ?? "localhost",
    port: Number(process.argv[3]) ?? 25565,
});

bot.loadPlugin(antiafk);


bot.once("spawn", () => bot.antiafk.setOptions(
{
            walkAround: {
                enabled: true,
                newChunks: false, 
                rotateChunks: false,
                searchRadius: 8
            },
            chatBot: {
                enabled: false,
                messages: ["test", "test1", "test2"],
                delay: 1000,
                variation: 300
            },
            lookAround: {
                enabled: true
            },
            randomMovement: {
                enabled: true
            }
        },
    )
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
