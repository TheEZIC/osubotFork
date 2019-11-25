import { Command } from "../../Command";
import { Module } from "../../Module";
import Calculator from "../../pp/bancho";
import Mods from "../../pp/Mods";
import Util from "../../Util";

export default class EnjuuCompare extends Command {
    constructor(module: Module) {
        super(["c", "compare"], module, async (ctx, self, args) => {
            let dbUser = await self.module.bot.database.servers.enjuu.getUser(ctx.senderId);
            if(ctx.hasReplyMessage)
                dbUser.nickname = (await self.module.bot.database.servers.enjuu.getUser(ctx.replyMessage.senderId)).nickname;
            if(ctx.hasForwards)
                dbUser.nickname = (await self.module.bot.database.servers.enjuu.getUser(ctx.forwards[0].senderId)).nickname;
            if(args.nickname[0])
                dbUser.nickname = args.nickname.join(" ");
            if(!dbUser.nickname)
                return ctx.reply("Не указан ник!");
            try {
                let chat = self.module.bot.maps.getChat(ctx.peerId);
                if(!chat)
                    return ctx.reply("Отправьте карту!");
                let score = await self.module.bot.api.enjuu.getScore(dbUser.nickname, chat.map.id.map, dbUser.mode || 0, args.mods.length == 0 ? undefined : new Mods(args.mods).sum());
                let map = await self.module.bot.api.bancho.getBeatmap(chat.map.id.map, dbUser.mode || 0, score.mods.diff());
                let cover = await self.module.bot.database.covers.getCover(map.id.set);
                let calc = new Calculator(map, score.mods);
                ctx.reply(`[Server: ${self.module.name}]\n${self.module.bot.templates.Compare(score, map, calc)}`, {
                    attachment: cover
                });
            } catch(e) {
                let err = await self.module.bot.database.errors.addError("r", ctx, String(e));
                ctx.reply(`[Server: ${self.module.name}]\n${Util.error(String(e))} (${err})`);
            }
        });
    }
}