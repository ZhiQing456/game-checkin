"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarTab } from "@/components/CalendarTab";
import { CheckInTab } from "@/components/CheckInTab";
import { StatsTab } from "@/components/StatsTab";
import type { RecordFormValue, SubmitResult } from "@/components/RecordEditor";
import type { RecordRow } from "@/lib/types";

type Tab = "checkin" | "calendar" | "stats";

const NICKNAME_KEY = "game-checkin-nickname";
const TABS: { key: Tab; label: string }[] = [
  { key: "checkin", label: "打卡" },
  { key: "calendar", label: "日历" },
  { key: "stats", label: "统计" },
];

export default function Home() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [tab, setTab] = useState<Tab>("checkin");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await fetch("/api/records");
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      setRecords(Array.isArray(data.records) ? data.records : []);
    } catch {
      setLoadError("加载数据失败，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const saved = window.localStorage.getItem(NICKNAME_KEY);
    if (saved) setNickname(saved);
  }, []);

  const existingNicknames = useMemo(
    () => [...new Set(records.map((r) => r.nickname))].sort((a, b) => a.localeCompare(b, "zh")),
    [records]
  );
  const games = useMemo(
    () => [...new Set(records.map((r) => r.game))].sort((a, b) => a.localeCompare(b, "zh")),
    [records]
  );

  function saveNickname() {
    const name = nicknameDraft.trim();
    if (!name) return;
    window.localStorage.setItem(NICKNAME_KEY, name);
    setNickname(name);
  }

  function changeNickname() {
    const name = window.prompt("请输入新昵称（会新建一份记录）", nickname ?? "");
    if (name && name.trim()) {
      const trimmed = name.trim();
      window.localStorage.setItem(NICKNAME_KEY, trimmed);
      setNickname(trimmed);
      showToast(`昵称已切换为 ${trimmed}`);
    }
  }

  const addRecord = useCallback(
    async (v: RecordFormValue): Promise<SubmitResult> => {
      if (!nickname) return { ok: false, error: "请先设置昵称" };
      try {
        const res = await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nickname, ...v }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) return { ok: false, error: data?.error ?? "保存失败，请重试" };
        await refresh();
        showToast("已保存 ✓");
        return { ok: true };
      } catch {
        return { ok: false, error: "网络异常，保存失败" };
      }
    },
    [nickname, refresh, showToast]
  );

  const updateRecord = useCallback(
    async (id: number, v: RecordFormValue): Promise<SubmitResult> => {
      if (!nickname) return { ok: false, error: "请先设置昵称" };
      try {
        const res = await fetch("/api/records", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, game: v.game, minutes: v.minutes, nickname, date: v.date }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) return { ok: false, error: data?.error ?? "修改失败，请重试" };
        await refresh();
        showToast("已更新 ✓");
        return { ok: true };
      } catch {
        return { ok: false, error: "网络异常，修改失败" };
      }
    },
    [nickname, refresh, showToast]
  );

  const deleteRecord = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/records?id=${id}`, { method: "DELETE" });
        if (!res.ok) {
          showToast("删除失败，请重试");
          return;
        }
        await refresh();
        showToast("已删除");
      } catch {
        showToast("网络异常，删除失败");
      }
    },
    [refresh, showToast]
  );

  const duplicateWarning =
    nicknameDraft.trim().length > 0 && existingNicknames.includes(nicknameDraft.trim());

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="brand-logo">🎮</div>
          <div>
            <h1>游戏时长打卡</h1>
            <p>记录每天的游玩时光 · 好友一起打卡</p>
          </div>
        </div>
        {nickname && (
          <div className="user-chip">
            <span className="avatar">{nickname.slice(0, 1).toUpperCase()}</span>
            <span>{nickname}</span>
            <button onClick={changeNickname}>切换</button>
          </div>
        )}
      </header>

      {loading ? (
        <div className="loading">
          <span className="spinner" />
          正在加载数据…
        </div>
      ) : loadError ? (
        <div className="card">
          <p style={{ color: "var(--danger)" }}>{loadError}</p>
          <button className="btn btn-ghost" onClick={() => { setLoading(true); refresh(); }}>
            重试
          </button>
        </div>
      ) : (
        <>
          <nav className="tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`tab ${tab === t.key ? "active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {tab === "checkin" && nickname && (
            <CheckInTab
              nickname={nickname}
              games={games}
              records={records}
              onAdd={addRecord}
              onUpdate={updateRecord}
              onDelete={deleteRecord}
            />
          )}
          {tab === "calendar" && (
            <CalendarTab
              games={games}
              records={records}
              onAdd={addRecord}
              onUpdate={updateRecord}
              onDelete={deleteRecord}
            />
          )}
          {tab === "stats" && nickname && (
            <StatsTab nickname={nickname} records={records} />
          )}
        </>
      )}

      {!nickname && !loading && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>👋 欢迎使用</h2>
            <p className="sub">给自己起个昵称就能开始打卡，无需注册。</p>
            <div className="field">
              <label htmlFor="nickname-input">我的昵称</label>
              <input
                id="nickname-input"
                className="input"
                placeholder="如：小明、老张"
                maxLength={30}
                value={nicknameDraft}
                onChange={(e) => setNicknameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveNickname();
                }}
                autoFocus
              />
            </div>

            {existingNicknames.length > 0 && (
              <div>
                <div className="cal-empty-total" style={{ color: "var(--text-2)" }}>
                  已有昵称（点一下快速选择）：
                </div>
                <div className="existing-tags">
                  {existingNicknames.map((n) => (
                    <button key={n} className="existing-tag" onClick={() => setNicknameDraft(n)}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {duplicateWarning && (
              <div className="warn">
                该昵称已有打卡记录。若继续使用，你的记录会和 TA 的记录合并在一起。
              </div>
            )}

            <div className="form-actions">
              <button className="btn btn-primary" onClick={saveNickname} disabled={!nicknameDraft.trim()}>
                开始打卡
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
