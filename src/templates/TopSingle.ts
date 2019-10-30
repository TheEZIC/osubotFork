import { APITopScore, APIBeatmap, APIUser, Mode } from "../Types";
import Util from "../Util";
import { IPPCalculator as ICalc } from '../pp/Calculator';

export default function(score: APITopScore, beatmap: APIBeatmap, user: APIUser, place: number, calc: ICalc, link: string) {
    return `Топ #${place} плей игрока ${user.nickname} (${Mode[score.mode]}):
${beatmap.artist} - ${beatmap.title} [${beatmap.version}] by ${beatmap.creator.nickname}
${Util.formatBeatmapLength(beatmap.length / calc.speedMultiplier)} | ${beatmap.stats} ${Math.round(beatmap.bpm * calc.speedMultiplier)}BPM | ${Util.round(beatmap.diff.stars, 2)}✩ ${score.mods}

Комбо: ${Util.formatCombo(score.combo, beatmap.combo)} | Точность: ${Util.round(score.accuracy() * 100, 2)}%
Хиткаунты: ${score.counts}
PP: ${score.pp} | Ранк: ${score.rank}

Карта: ${link}/b/${beatmap.id.map}`;
}