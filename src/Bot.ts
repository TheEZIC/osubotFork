import { VK, MessageContext, DocumentAttachment } from 'vk-io';
import { Module } from './Module';
import Database from './Database';
import Bancho from './modules/Bancho';
import { Command } from './Command';
import { APICollection } from './API';
import { Templates, ITemplates } from './templates';
import Maps from './Maps';
import { ReplayParser } from './Replay';
import * as axios from 'axios';
import News from './News';
import Admin from './modules/Admin';
import Main from './modules/Main';
import BanchoPP from './pp/bancho';
import Gatari from './modules/Gatari';
import IsMap from './MapRegexp';
import Ripple from './modules/Ripple';
import Donaters from './Donaters';

interface IBotConfig {
    vk: {
        token: string,
        id: number,
        owner: number
    },
    tokens: {
        bancho: string,
        ripple: string
    }
}

export default class Bot {
    config: IBotConfig;
    vk: VK;
    modules: Module[];
    database: Database;
    api: APICollection;
    templates: ITemplates;
    maps: Maps;
    news: News;
    donaters: Donaters;
    constructor(config: IBotConfig) {
        this.config = config;

        this.vk = new VK({
            token: config.vk.token,
            pollingGroupId: config.vk.id
        });
        this.modules = [];

        this.registerModule([
            new Bancho(this),
            new Gatari(this),
            new Ripple(this),
            new Admin(this),
            new Main(this)
        ]);

        this.database = new Database(this.vk);

        this.initDB();

        this.api = new APICollection(this);

        this.templates = Templates;

        this.maps = new Maps(this);

        this.vk.updates.on("message", async (ctx) => {
            if(ctx.isOutbox || ctx.isFromGroup || ctx.isEvent)
                return;
            let replayDoc = this.checkReplay(ctx);
            let hasMap = IsMap(ctx.text);
            if(replayDoc) {
                try {
                    let { data: file } = await axios.default.get(replayDoc.url, {
                        responseType: "arraybuffer"
                    });
                    let parser = new ReplayParser(file);
                    let replay = parser.getReplay();
                    let map = await this.api.bancho.getBeatmap(replay.beatmapHash);
                    if(replay.mods.diff()) 
                        map = await this.api.bancho.getBeatmap(map.id.map, replay.mode, replay.mods.diff());
                    let calc = new BanchoPP(map, replay.mods);
                    ctx.reply(this.templates.Replay(replay, map, calc));
                    this.maps.setMap(ctx.peerId, map);
                } catch(e) {
                    ctx.reply("Произошла ошибка при обработке реплея!");
                }
            } else if(hasMap) {
                this.maps.sendMap(hasMap, ctx);
            } else {
                if(!ctx.hasText) return;
                if(ctx.text.toLowerCase().startsWith("map ")) {
                    this.maps.stats(ctx);
                } else {
                    for(let module of this.modules) {
                        let check: Command = module.checkContext(ctx);
                        if(check) {
                            check.process(ctx);
                        }
                    }
                }
            }
        });

        this.news = new News(this);

        this.donaters = new Donaters();
    }

    registerModule(module: Module | Module[]) {
        if(Array.isArray(module))
            this.modules.push(...module);
        else
            this.modules.push(module);
    }

    initDB(): void {
        this.database.run("CREATE TABLE IF NOT EXISTS bancho (id INTEGER, uid INTEGER, mode INTEGER, pp REAL DEFAULT 0, rank INTEGER DEFAULT 999999, acc REAL DEFAULT 100)");
        this.database.run("CREATE TABLE IF NOT EXISTS gatari (id INTEGER, uid INTEGER, mode INTEGER, pp REAL DEFAULT 0, rank INTEGER DEFAULT 999999, acc REAL DEFAULT 100)");
        this.database.run("CREATE TABLE IF NOT EXISTS ripple (id INTEGER, uid INTEGER, mode INTEGER, pp REAL DEFAULT 0, rank INTEGER DEFAULT 999999, acc REAL DEFAULT 100)");
        this.database.run("CREATE TABLE IF NOT EXISTS akatsuki (id INTEGER, uid INTEGER, mode INTEGER, pp REAL DEFAULT 0, rank INTEGER DEFAULT 999999, acc REAL DEFAULT 100)");
        this.database.run("CREATE TABLE IF NOT EXISTS covers (id INTEGER attachment TEXT)");
        this.database.run("CREATE TABLE IF NOT EXISTS errors (code TEXT, info TEXT, error TEXT)");
    }

    async start() {
        await this.vk.updates.start();
        console.log('Started');
    }

    async stop() {
        await this.vk.updates.stop();
        console.log('Stopped');
    }

    checkReplay(ctx: MessageContext): DocumentAttachment {
        if(!ctx.hasAttachments("doc"))
            return null;
        return ctx.getAttachments("doc").filter(doc => doc.extension == "osr")[0];
    }
}