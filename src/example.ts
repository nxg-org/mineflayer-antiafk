import { createBot } from "mineflayer";
import antiafk from "./index";


const bot = createBot({
    username: "antiafk-testing",
    host: process.argv[2] ?? "localhost",
    port: Number(process.argv[3]) ?? 25565,
});

bot.loadPlugin(antiafk);


bot.once("spawn", () => bot.antiafk.setOptions({walk: {newChunks: true, rotateChunks: true}})
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
            bot.antiafk.forceStop()
            break;
    }
});
