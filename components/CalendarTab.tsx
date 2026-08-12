"use client";

import { useMemo, useState } from "react";
import {
  daysInMonth,
  firstWeekday,
  formatDateCN,
  formatMinutes,
  formatMinutesShort,
  pad2,
  todayLocal,
} from "@/lib/format";
import type { RecordRow } from "@/lib/types";
import { RecordEditor, type RecordFormValue, type SubmitResult } from "./RecordEditor";

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

function intensityOf(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes <= 60) return 1;
  if (minutes <= 180) return 2;
  if (minutes <= 360) return 3;
  if (minutes <= 540) return 4;
  return 5;
}

export function CalendarTab({
  games,
  records,
  onAdd,
  onUpdate,
  onDelete,
}: {
  games: string[];
  records: RecordRow[];
  onAdd: (v: RecordFormValue) => Promise<SubmitResult>;
  onUpdate: (id: number, v: RecordFormValue) => Promise<SubmitResult>;
  onDelete: (id: number) => void;
}) {
  const today = todayLocal();
  const [cursor, setCursor] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState<string>(today);
  const [editing, setEditing] = useState<RecordRow | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const year = Number(cursor.slice(0, 4));
  const month = Number(cursor.slice(5, 7));

  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records) map.set(r.date, (map.get(r.date) ?? 0) + r.minutes);
    return map;
  }, [records]);

  const cells: (string | null)[] = useMemo(() => {
    const dim = daysInMonth(cursor);
    const offset = (firstWeekday(cursor) + 6) % 7; // 周一开头
    const list: (string | null)[] = [];
    for (let i = 0; i < offset; i++) list.push(null);
    for (let d = 1; d <= dim; d++) list.push(`${cursor}-${pad2(d)}`);
    return list;
  }, [cursor]);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setCursor(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
  };

  const selectedRecords = useMemo(
    () =>
      records
        .filter((r) => r.date === selected)
        .sort((a, b) => b.minutes - a.minutes),
    [records, selected]
  );
  const selectedTotal = selectedRecords.reduce((acc, r) => acc + r.minutes, 0);
  const knownGames = useMemo(
    () =>
      [...new Set([...games, ...selectedRecords.map((r) => r.game)])].sort((a, b) =>
        a.localeCompare(b, "zh")
      ),
    [games, selectedRecords]
  );

  function handleDelete(id: number) {
    if (!window.confirm("确定删除这条记录吗？")) return;
    onDelete(id);
    if (editing?.id === id) setEditing(null);
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="calendar-nav">
          <button className="btn btn-ghost btn-sm" onClick={() => shiftMonth(-1)}>
            ‹ 上月
          </button>
          <span className="month-title">
            {year} 年 {month} 月
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => shiftMonth(1)}>
            下月 ›
          </button>
        </div>

        <div className="cal-weekdays">
          {WEEKDAY_LABELS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div className="cal-grid">
          {cells.map((dateStr, i) => {
            if (!dateStr) return <div key={`empty-${i}`} className="cal-cell empty" />;
            const minutes = totals.get(dateStr) ?? 0;
            const lv = intensityOf(minutes);
            return (
              <div
                key={dateStr}
                className={`cal-cell ${dateStr === today ? "today" : ""} ${
                  dateStr === selected ? "selected" : ""
                }`}
                onClick={() => {
                  setSelected(dateStr);
                  setEditing(null);
                  setShowAdd(false);
                }}
              >
                <span className="cal-day-num">{Number(dateStr.slice(8, 10))}</span>
                {minutes > 0 ? (
                  <span className={`cal-total lv${lv}`}>{formatMinutesShort(minutes)}</span>
                ) : (
                  <span className="cal-empty-total">—</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="cal-legend">
          <span>强度：</span>
          {[1, 2, 3, 4, 5].map((lv) => (
            <span key={lv} className={`legend-dot lv${lv}`} />
          ))}
          <span>（按当天总时长）</span>
        </div>
      </div>

      <div className="card">
        <h2>{formatDateCN(selected)}</h2>
        <p className="sub">
          当天共 {formatMinutes(selectedTotal)}
          {selectedRecords.length > 0 && `（${selectedRecords.length} 款游戏）`}
        </p>

        {showAdd ? (
          <div className="card" style={{ marginBottom: 14, background: "var(--card-2)" }}>
            <RecordEditor
              key={`add-${selected}`}
              games={knownGames}
              initial={{ game: "", date: selected, minutes: 0 }}
              allowDateChange={false}
              submitLabel="添加打卡"
              onSubmit={onAdd}
              onCancel={() => setShowAdd(false)}
            />
          </div>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            style={{ marginBottom: 14 }}
            onClick={() => {
              setShowAdd(true);
              setEditing(null);
            }}
          >
            + 给这天添加打卡
          </button>
        )}

        {selectedRecords.length === 0 && !showAdd ? (
          <p className="empty-tip">这一天还没有记录</p>
        ) : (
          selectedRecords.map((r) =>
            editing?.id === r.id ? (
              <div key={r.id} className="card" style={{ marginBottom: 10, background: "var(--card-2)" }}>
                <RecordEditor
                  key={`edit-${r.id}`}
                  games={knownGames}
                  initial={{ game: r.game, date: r.date, minutes: r.minutes }}
                  allowDateChange={false}
                  submitLabel="保存修改"
                  onSubmit={(v) => onUpdate(r.id, v)}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <div key={r.id} className="list-item">
                <div>
                  <span className="game">{r.game}</span>
                  <span className="duration"> {formatMinutes(r.minutes)}</span>
                </div>
                <div className="ops">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditing(r);
                      setShowAdd(false);
                    }}
                  >
                    修改
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>
                    删除
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}

