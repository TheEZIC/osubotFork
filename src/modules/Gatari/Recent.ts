import { Command } from "../../Command";
import { Module } from "../../Module";
import Calculator from '../../pp/bancho';
import Util from "../../Util";

export default class GatariRecent extends Command {
    constructor(module: Module) {
        super(["r", "rp", "recent"], module, async (ctx, self, args) => {
            let dbUser = await self.module.bot.database.servers.gatari.getUser(ctx.senderId);
            if(ctx.hasReplyMessage)
                dbUser.nickname = (await self.module.bot.database.servers.gatari.getUser(ctx.replyMessage.senderId)).nickname;
            if(ctx.hasForwards)
                dbUser.nickname = (await self.module.bot.database.servers.gatari.getUser(ctx.forwards[0].senderId)).nickname;
            if(args.nickname[0])
                dbUser.nickname = args.nickname.join(" ");
            if(!dbUser.nickname)
                return ctx.reply("Не указан ник!");
            let mode = args.mode === null ? dbUser.mode || 0 : args.mode;
            try {
                let recent = await self.module.bot.api.gatari.getUserRecent(dbUser.nickname, mode);
                let map = await self.module.bot.api.bancho.getBeatmap(recent.beatmapId, recent.mode, recent.mods.diff());
                let cover = await self.module.bot.database.covers.getCover(map.id.set);
                let calc = new Calculator(map, recent.mods);
                let keyboard = Util.createKeyboard([
                    [{
                        text: '[G] Мой скор на карте',
                        command: `{map${map.id.map}}g c`
                    }],
                    ctx.isChat ? [{
                        text: '[G] Топ чата на карте',
                        command: `{map${map.id.map}}g lb`
                    }] : []
                ]);
                ctx.reply(`[Server: ${self.module.name}]\n${self.module.bot.templates.RecentScore(recent, map, calc, self.module.link)}`, {
                    attachment: cover,
                    keyboard
                });
                self.module.bot.maps.setMap(ctx.peerId, map);
            } catch (e) {
                let err = await self.module.bot.database.errors.addError("g", ctx, String(e));
                ctx.reply(`[Server: ${self.module.name}]\n${Util.error(String(e))} (${err})`);
            }
        });
    } 
}