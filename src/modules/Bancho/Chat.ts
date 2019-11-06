import { Command } from "../../Command";
import { Module } from "../../Module";
import Util from "../../Util";

export default class BanchoChat extends Command {
    constructor(module: Module) {
        super(["chat"], module, async (ctx, self, args) => {
            if(ctx.isChat) {
                try {
                    let members = (await self.module.bot.vk.api.messages.getConversationMembers({
                        peer_id: ctx.peerId
                    })).profiles;
                    let ids = [];
                    let users = [];
                    for(let i = 0; i < members.length; i++) {
                        let u = await self.module.bot.database.servers.bancho.getUser(members[i].id);
                        if(u.nickname && !ids.includes(u.uid)) {
                            users.push(u);
                            ids.push(u.uid);
                        }
                    }
                    users.filter(a => a.rank > 0 && a.pp > 0);
                    users.sort((a,b) => {
                        if(a.rank > b.rank)
                            return 1;
                        else if(a.rank < b.rank)
                            return -1;
                        else return 0;
                    });
                    ctx.reply(`[Server: ${self.module.name}]\nТоп${users.length > 15 ? '-15' : ''} беседы (ID ${ctx.chatId}):\n${users.splice(0, 15).map((user, i) => `#${i+1} ${user.nickname} | ${Util.round(user.pp, 1)} | Ранк ${user.rank} | ${Util.round(user.acc, 2)}%`).join("\n")}`);
                } catch(e) {
                    console.log(e.toString());
                    ctx.reply("Ошибка");
                }
            } else if(ctx.isFromUser) {
                if(!args.string[0])
                    return ctx.reply("Укажите ID беседы!");
                let id = parseInt(args.string[0]);
                if(isNaN(id))
                    return ctx.reply("Некорректный ID!");
                try {
                    let members = (await self.module.bot.vk.api.messages.getConversationMembers({
                        peer_id: id + 2000000000
                    })).profiles;
                    let ids = [];
                    let users = [];
                    for(let i = 0; i < members.length; i++) {
                        let u = await self.module.bot.database.servers.bancho.getUser(members[i].id);
                        if(u.nickname && !ids.includes(u.uid)) {
                            users.push(u);
                            ids.push(u.uid);
                        }
                    }
                    users.filter(a => a.rank > 0 && a.pp > 0);
                    users.sort((a,b) => {
                        if(a.rank > b.rank)
                            return 1;
                        else if(a.rank < b.rank)
                            return -1;
                        else return 0;
                    });
                    ctx.reply(`[Server: ${self.module.name}]\nТоп беседы (ID ${id}):\n${users.map((user, i) => `#${i+1} ${user.nickname} | ${Util.round(user.pp, 1)} | Ранк ${user.rank} | ${Util.round(user.acc, 2)}%`).join("\n")}`);
                } catch(e) {
                    console.log(e.toString());
                    ctx.reply("Ошибка");
                }
            }
        });
    }
}