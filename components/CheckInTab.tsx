"use client";

import { useMemo, useState } from "react";
import { formatDateCN, formatMinutes, todayLocal } from "@/lib/format";
import type { RecordRow } from "@/lib/types";
import { RecordEditor, type RecordFormValue, type SubmitResult } from "./RecordEditor";

export function CheckInTab({
  nickname,
  games,
  records,
  onAdd,
  onUpdate,
  onDelete,
}: {
  nickname: string;
  games: string[];
  records: RecordRow[];
  onAdd: (v: RecordFormValue) => Promise<SubmitResult>;
  onUpdate: (id: number, v: RecordFormValue) => Promise<SubmitResult>;
  onDelete: (id: number) => void;
}) {
  const today = todayLocal();
  const todayRecords = useMemo(
    () => records.filter((r) => r.date === today).sort((a, b) => b.minutes - a.minutes),
    [records, today]
  );
  const todayTotal = todayRecords.reduce((acc, r) => acc + r.minutes, 0);

  const [editing, setEditing] = useState<RecordRow | null>(null);
  const [showAdd, setShowAdd] = useState(true);

  const knownGames = useMemo(
    () => [...new Set([...games, ...todayRecords.map((r) => r.game)])].sort((a, b) => a.localeCompare(b, "zh")),
    [games, todayRecords]
  );

  function handleDelete(id: number) {
    if (!window.confirm("确定删除这条记录吗？")) return;
    onDelete(id);
    if (editing?.id === id) setEditing(null);
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h2>今天打卡 · {formatDateCN(today)}</h2>
        <p className="sub">
          {nickname}，今天已记录 {formatMinutes(todayTotal)}
          {todayRecords.length > 0 && `（${todayRecords.length} 款游戏）`}
        </p>

        {showAdd ? (
          <RecordEditor
            key="add"
            games={knownGames}
            submitLabel="打卡"
            onSubmit={onAdd}
          />
        ) : (
          <button className="btn btn-ghost" onClick={() => setShowAdd(true)}>
            + 添加打卡
          </button>
        )}
      </div>

      <div className="card">
        <h2>今日记录</h2>
        <p className="sub">可随时修改或删除</p>

        {todayRecords.length === 0 ? (
          <p className="empty-tip">今天还没有打卡记录，加油！</p>
        ) : (
          todayRecords.map((r) =>
            editing?.id === r.id ? (
              <div key={r.id} className="card" style={{ marginBottom: 10, background: "var(--card-2)" }}>
                <RecordEditor
                  key={`edit-${r.id}`}
                  games={knownGames}
                  initial={{ game: r.game, date: r.date, minutes: r.minutes }}
                  submitLabel="保存修改"
                  onSubmit={(v) => onUpdate(r.id, v)}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <div key={r.id} className="list-item">
                <div>
                  <div className="game">{r.game}</div>
                  <div className="date-label">{formatMinutes(r.minutes)}</div>
                </div>
                <div className="ops">
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(r)}>
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
