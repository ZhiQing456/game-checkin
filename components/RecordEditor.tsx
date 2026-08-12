"use client";

import { useState } from "react";
import { todayLocal } from "@/lib/format";

export interface RecordFormValue {
  game: string;
  date: string;
  minutes: number;
}

export interface SubmitResult {
  ok: boolean;
  error?: string;
}

export function RecordEditor({
  games,
  initial,
  submitLabel = "保存",
  allowDateChange = true,
  onSubmit,
  onCancel,
}: {
  games: string[];
  initial?: { game: string; date: string; minutes: number } | null;
  submitLabel?: string;
  allowDateChange?: boolean;
  onSubmit: (value: RecordFormValue) => Promise<SubmitResult>;
  onCancel?: () => void;
}) {
  const [game, setGame] = useState(initial?.game ?? "");
  const [date, setDate] = useState(initial?.date ?? todayLocal());
  const [hours, setHours] = useState(initial ? Math.floor(initial.minutes / 60) : 0);
  const [minutes, setMinutes] = useState(initial ? initial.minutes % 60 : 0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const g = game.trim();
    if (!g) {
      setError("请输入游戏名");
      return;
    }
    const h = Math.floor(Number(hours) || 0);
    const m = Math.floor(Number(minutes) || 0);
    if (h < 0 || m < 0 || m > 59) {
      setError("时长不合法");
      return;
    }
    const total = h * 60 + m;
    if (total <= 0) {
      setError("时长必须大于 0");
      return;
    }
    if (total > 24 * 60) {
      setError("单条时长不能超过 24 小时");
      return;
    }

    setSaving(true);
    setError(null);
    const result = await onSubmit({ game: g, date, minutes: total });
    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "保存失败，请重试");
      return;
    }
    // 新增成功：清空游戏和时长，方便连续添加；编辑成功：由父组件关闭编辑器
    if (!initial) {
      setGame("");
      setHours(0);
      setMinutes(0);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor={`game-${initial?.game ?? "new"}`}>游戏名</label>
        <input
          id={`game-${initial?.game ?? "new"}`}
          className="input"
          list="game-options"
          placeholder="输入或选择游戏，如 王者荣耀"
          value={game}
          onChange={(e) => setGame(e.target.value)}
          maxLength={50}
        />
        <datalist id="game-options">
          {games.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
      </div>

      {allowDateChange && (
        <div className="field">
          <label htmlFor="record-date">日期</label>
          <input
            id="record-date"
            className="input input-sm"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      )}

      <div className="field">
        <label>时长</label>
        <div className="field-row">
          <div>
            <input
              className="input input-sm"
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              aria-label="小时"
            />
            <div className="cal-empty-total" style={{ color: "var(--text-2)" }}>小时</div>
          </div>
          <div>
            <input
              className="input input-sm"
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              aria-label="分钟"
            />
            <div className="cal-empty-total" style={{ color: "var(--text-2)" }}>分钟</div>
          </div>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "保存中…" : submitLabel}
        </button>
        {onCancel && (
          <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={saving}>
            取消
          </button>
        )}
      </div>
    </form>
  );
}
