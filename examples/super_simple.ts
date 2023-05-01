import antiafk, { unloadDefaultModules } from "../src/index";
import { BlockWalk, SwingArm } from "../src/modules";
import { Bot, createBot } from "mineflayer";

const bot = createBot({
    username: "antiafk-testing",
    host: process.argv[2] ?? "localhost",
    port: Number(process.argv[3]) ?? 25565,
});

bot.loadPlugin(antiafk);


bot.once("spawn", () => {

    unloadDefaultModules(bot);
    bot.antiafk.addModules(BlockWalk, SwingArm)
    
    bot.antiafk.setOptionsForModule(BlockWalk, {
        enabled: true,
        distance: 16,
        time: 10000,
    })
    bot.antiafk.setOptionsForModule(SwingArm, {enabled: true})

    bot.antiafk.start();

    bot.antiafk.on('moduleCompleted', (mod, suc, res) => console.log('complete', mod.constructor.name, suc, res))
    bot.antiafk.on('moduleStarted', (module) => console.log('start', module.constructor.name))
  
  

});

bot.on("health", () => {
    if (bot.health < 5) bot.antiafk.stop();
});