import { Command } from "../../Command";
import { Module } from "../../Module";

export default class UptimeCommand extends Command {
    constructor(module: Module) {
        super("uptime", module, (ctx, self) => {
            let time = Math.floor((Date.now() - self.module.bot.startTime) / 1e3);
            
            ctx.send(`Время работы бота: ${Math.floor(time / 3600 / 24)}д ${Math.floor(time / 3600) % 24}ч ${Math.floor(time / 60) % 60}м ${time % 60}с`);
        });
    }
}