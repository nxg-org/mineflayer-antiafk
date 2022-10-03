import antiafk, { DEFAULT_MODULES, DEFAULT_PASSIVES } from "./index";
import { Bot, createBot } from "mineflayer";

const bot = createBot({
    username: "antiafk-testing",
    host: process.argv[2] ?? "localhost",
    port: Number(process.argv[3]) ?? 25565,
});

bot.loadPlugin(antiafk);


bot.on("spawn", () => {

    bot.antiafk.setModuleOptions({
        WalkAroundModule: { enabled: true },
        ChatBotModule: { enabled: false }
    })
    bot.antiafk.start();

});

bot.on("health", () => {
    if (bot.health < 5) bot.antiafk.stop();
});