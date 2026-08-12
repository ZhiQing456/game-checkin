"use client";

import { useMemo, useState } from "react";
import { addDays, formatDateShort, formatMinutes, startOfMonth, startOfWeek, todayLocal } from "@/lib/format";
import {
  activeDays,
  averagePerActiveDay,
  dailyTotals,
  filterByRange,
  groupByGame,
  leaderboard,
  sumMinutes,
} from "@/lib/stats";
import type { RecordRow } from "@/lib/types";

type Period = "week" | "month" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "本周" },
  { key: "month", label: "本月" },
  { key: "all", label: "全部" },
];

export function StatsTab({
  nickname,
  records,
}: {
  nickname: string;
  records: RecordRow[];
}) {
  const [period, setPeriod] = useState<Period>("week");
  const today = todayLocal();

  const range = useMemo(() => {
    if (period === "week") return { from: startOfWeek(today), to: today };
    if (period === "month") return { from: startOfMonth(today), to: today };
    return { from: "0000-00-00", to: "9999-12-31" };
  }, [period, today]);

  const filtered = useMemo(
    () => filterByRange(records, range.from, range.to),
    [records, range]
  );

  const total = sumMinutes(filtered);
  const days = activeDays(filtered);
  const avg = averagePerActiveDay(filtered);
  const players = useMemo(() => new Set(filtered.map((r) => r.nickname)).size, [filtered]);
  const byGame = useMemo(() => groupByGame(filtered), [filtered]);
  const board = useMemo(() => leaderboard(filtered), [filtered]);
  const daily = useMemo(() => dailyTotals(filtered), [filtered]);

  // 每日趋势：按时段取最近若干天
  const trendDays = useMemo(() => {
    let count = period === "week" ? 7 : period === "month" ? 30 : 14;
    const list: { date: string; minutes: number }[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const date = addDays(today, -i);
      if (date >= range.from) list.push({ date, minutes: daily.get(date) ?? 0 });
    }
    return list;
  }, [period, today, daily, range.from]);

  const maxGame = Math.max(1, ...byGame.map((g) => g.minutes));
  const maxTrend = Math.max(1, ...trendDays.map((d) => d.minutes));
  const maxBoard = Math.max(1, ...board.map((b) => b.minutes));

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? "";

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h2>统计 · {periodLabel}</h2>
        <p className="sub">
          {range.from !== "0000-00-00"
            ? `${formatDateShort(range.from)} 至 ${formatDateShort(range.to)}`
            : "全部时间"}
        </p>

        <div className="period-tabs">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={`period-tab ${period === p.key ? "active" : ""}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-label">总时长</div>
            <div className="stat-value">{formatMinutes(total)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">打卡天数</div>
            <div className="stat-value">{days}</div>
            <div className="stat-note">天</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">日均时长</div>
            <div className="stat-value">{formatMinutes(Math.round(avg))}</div>
            <div className="stat-note">按有记录的天数计算</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">参与人数</div>
            <div className="stat-value">{players}</div>
            <div className="stat-note">人</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="card">
          <h2 className="section-title">每日趋势</h2>
          <p className="sub">最近 {trendDays.length} 天</p>
          <div className="trend">
            {trendDays.map((d) => (
              <div key={d.date} className="trend-col" title={`${d.date}：${formatMinutes(d.minutes)}`}>
                <span className="trend-val">{d.minutes > 0 ? Math.round(d.minutes / 60) : ""}</span>
                <div
                  className={`bar ${d.minutes === 0 ? "zero" : ""}`}
                  style={{ height: `${Math.max(4, (d.minutes / maxTrend) * 100)}%` }}
                />
                <span className="trend-day">{d.date.slice(8, 10)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="card">
          <h2 className="section-title">按游戏汇总</h2>
          <p className="sub">本期各游戏累计时长</p>
          {byGame.length === 0 ? (
            <p className="empty-tip">本期还没有数据</p>
          ) : (
            <div className="bar-list">
              {byGame.map((g) => (
                <div key={g.game} className="bar-item">
                  <span className="bar-name" title={g.game}>{g.game}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(g.minutes / maxGame) * 100}%` }} />
                  </div>
                  <span className="bar-value">{formatMinutes(g.minutes)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <div className="card">
          <h2 className="section-title">排行榜（本期）</h2>
          <p className="sub">按累计时长从高到低</p>
          {board.length === 0 ? (
            <p className="empty-tip">本期还没有人打卡</p>
          ) : (
            board.map((b, idx) => (
              <div key={b.nickname} className={`lb-row ${b.nickname === nickname ? "me" : ""}`}>
                <span className="lb-rank">{idx + 1}</span>
                <span className="lb-name">
                  {b.nickname}
                  {b.nickname === nickname && <span className="lb-me-tag">我</span>}
                </span>
                <span className="lb-minutes">{formatMinutes(b.minutes)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
