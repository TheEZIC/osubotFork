import { Command } from "../../Command";
import { Module } from "../../Module";

export default class GatariUser extends Command {
    constructor(module: Module) {
        super(["u", "user"], module, async (ctx, self, args) => {
            let dbUser = await self.module.bot.database.servers.gatari.getUser(ctx.senderId);
            if(ctx.hasReplyMessage)
                dbUser.nickname = (await self.module.bot.database.servers.gatari.getUser(ctx.replyMessage.senderId)).nickname;
            if(ctx.hasForwards)
                dbUser.nickname = (await self.module.bot.database.servers.gatari.getUser(ctx.forwards[0].senderId)).nickname;
            if(args.nickname[0])
                dbUser.nickname = args.nickname.join(" ");
            if(!dbUser.nickname)
                return ctx.reply("Не указан ник!");
            try {
                let user = await self.module.bot.api.gatari.getUser(dbUser.nickname, dbUser.mode || 0);
                self.module.bot.database.servers.gatari.updateInfo(user);
                ctx.reply(`[Server: ${self.module.name}]\n${self.module.bot.templates.User(user, dbUser.mode || 0, self.module.link)}`);
            } catch (e) {
                let error = await self.module.bot.database.errors.addError("g", ctx, String(e));
                ctx.reply(`[Server: ${self.module.name}]\nИгрок не найден! (${error})`);
            }
        });
    }
}