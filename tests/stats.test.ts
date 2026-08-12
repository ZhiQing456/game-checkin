import { describe, expect, it } from "vitest";
import type { RecordRow } from "../lib/types";
import {
  activeDays,
  averagePerActiveDay,
  dailyTotals,
  filterByRange,
  groupByGame,
  leaderboard,
  sumMinutes,
} from "../lib/stats";

function rec(id: number, nickname: string, game: string, date: string, minutes: number): RecordRow {
  return { id, nickname, game, date, minutes };
}

const sample: RecordRow[] = [
  rec(1, "小明", "王者荣耀", "2026-08-10", 120),
  rec(2, "小明", "原神", "2026-08-10", 60),
  rec(3, "小明", "王者荣耀", "2026-08-11", 90),
  rec(4, "小红", "原神", "2026-08-11", 240),
  rec(5, "小红", "王者荣耀", "2026-08-12", 30),
  rec(6, "小明", "元梦之星", "2026-08-12", 45),
];

describe("stats 纯函数", () => {
  it("filterByRange 包含两端", () => {
    const filtered = filterByRange(sample, "2026-08-11", "2026-08-12");
    expect(filtered.map((r) => r.id).sort()).toEqual([3, 4, 5, 6]);
  });

  it("sumMinutes 求和", () => {
    expect(sumMinutes(sample)).toBe(585);
  });

  it("groupByGame 按游戏汇总并降序", () => {
    const byGame = groupByGame(sample);
    expect(byGame).toEqual([
      { game: "王者荣耀", minutes: 240 },
      { game: "原神", minutes: 300 },
      { game: "元梦之星", minutes: 45 },
    ].sort((a, b) => b.minutes - a.minutes));
    expect(byGame[0].game).toBe("原神");
  });

  it("leaderboard 按昵称汇总降序", () => {
    const board = leaderboard(sample);
    expect(board).toEqual([
      { nickname: "小明", minutes: 315 },
      { nickname: "小红", minutes: 270 },
    ]);
  });

  it("dailyTotals 每天总时长", () => {
    const daily = dailyTotals(sample);
    expect(daily.get("2026-08-10")).toBe(180);
    expect(daily.get("2026-08-11")).toBe(330);
    expect(daily.get("2026-08-12")).toBe(75);
  });

  it("activeDays 与日均", () => {
    expect(activeDays(sample)).toBe(3);
    expect(averagePerActiveDay(sample)).toBeCloseTo(195);
    expect(averagePerActiveDay([])).toBe(0);
  });
});
