import type { RecordRow } from "./types";

export interface GameTotal {
  game: string;
  minutes: number;
}

export interface NicknameTotal {
  nickname: string;
  minutes: number;
}

/** 计算某段时间内（含两端）的记录 */
export function filterByRange(
  records: RecordRow[],
  from: string,
  to: string
): RecordRow[] {
  return records.filter((r) => r.date >= from && r.date <= to);
}

/** 总分钟数 */
export function sumMinutes(records: RecordRow[]): number {
  return records.reduce((acc, r) => acc + r.minutes, 0);
}

/** 按游戏汇总（降序） */
export function groupByGame(records: RecordRow[]): GameTotal[] {
  const map = new Map<string, number>();
  for (const r of records) {
    map.set(r.game, (map.get(r.game) ?? 0) + r.minutes);
  }
  return [...map.entries()]
    .map(([game, minutes]) => ({ game, minutes }))
    .sort((a, b) => b.minutes - a.minutes || a.game.localeCompare(b.game));
}

/** 按昵称汇总（降序）——排行榜 */
export function leaderboard(records: RecordRow[]): NicknameTotal[] {
  const map = new Map<string, number>();
  for (const r of records) {
    map.set(r.nickname, (map.get(r.nickname) ?? 0) + r.minutes);
  }
  return [...map.entries()]
    .map(([nickname, minutes]) => ({ nickname, minutes }))
    .sort((a, b) => b.minutes - a.minutes || a.nickname.localeCompare(b.nickname));
}

/** 每天总时长：{ 'YYYY-MM-DD': 分钟数 } */
export function dailyTotals(records: RecordRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of records) {
    map.set(r.date, (map.get(r.date) ?? 0) + r.minutes);
  }
  return map;
}

/** 有记录的天数 */
export function activeDays(records: RecordRow[]): number {
  return new Set(records.map((r) => r.date)).size;
}

/** 日均时长 = 总时长 / 有记录的天数 */
export function averagePerActiveDay(records: RecordRow[]): number {
  const days = activeDays(records);
  return days === 0 ? 0 : sumMinutes(records) / days;
}
