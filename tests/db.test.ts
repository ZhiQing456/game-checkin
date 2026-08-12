import { beforeAll, describe, expect, it } from "vitest";
import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

let db: Client;

beforeAll(async () => {
  // 用内存 SQLite 验证 SQL 逻辑，避免本地文件残留
  db = createClient({ url: ":memory:" });
  const schema = fs.readFileSync(path.join(process.cwd(), "lib", "schema.sql"), "utf-8");
  await db.executeMultiple(schema);
});

describe("records 表（SQLite）", () => {
  it("upsert：同昵称+游戏+日期覆盖时长，不新增行", async () => {
    const upsert = (minutes: number) =>
      db.execute({
        sql: `INSERT INTO records (nickname, game, date, minutes, created_at, updated_at)
              VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
              ON CONFLICT (nickname, game, date) DO UPDATE SET
                minutes = excluded.minutes,
                updated_at = datetime('now')`,
        args: ["小明", "王者荣耀", "2026-08-12", minutes],
      });

    await upsert(90);
    await upsert(120);

    const rows = await db.execute({
      sql: "SELECT * FROM records WHERE nickname = ? AND game = ? AND date = ?",
      args: ["小明", "王者荣耀", "2026-08-12"],
    });
    expect(rows.rows.length).toBe(1);
    expect(Number(rows.rows[0].minutes)).toBe(120);
  });

  it("同一天不同游戏各自成行", async () => {
    await db.execute({
      sql: "INSERT INTO records (nickname, game, date, minutes) VALUES (?, ?, ?, ?)",
      args: ["小明", "原神", "2026-08-12", 60],
    });
    const rows = await db.execute({
      sql: "SELECT * FROM records WHERE nickname = ? AND date = ?",
      args: ["小明", "2026-08-12"],
    });
    expect(rows.rows.length).toBe(2);
  });

  it("排行榜：按昵称汇总总时长降序", async () => {
    await db.execute({
      sql: "INSERT INTO records (nickname, game, date, minutes) VALUES (?, ?, ?, ?)",
      args: ["小红", "原神", "2026-08-12", 240],
    });
    const result = await db.execute(
      "SELECT nickname, SUM(minutes) AS total_minutes FROM records GROUP BY nickname ORDER BY total_minutes DESC"
    );
    const board = result.rows.map((r: any) => ({
      nickname: String(r.nickname),
      total_minutes: Number(r.total_minutes),
    }));
    // 小红 240 > 小明 120+60=180
    expect(board[0]).toEqual({ nickname: "小红", total_minutes: 240 });
    expect(board[1]).toEqual({ nickname: "小明", total_minutes: 180 });
  });

  it("按 id 删除", async () => {
    const before = await db.execute("SELECT COUNT(*) AS c FROM records");
    const totalBefore = Number(before.rows[0].c);
    const row = await db.execute("SELECT id FROM records WHERE nickname = ? LIMIT 1", ["小明"]);
    const id = Number(row.rows[0].id);
    const del = await db.execute({ sql: "DELETE FROM records WHERE id = ?", args: [id] });
    expect(del.rowsAffected).toBe(1);
    const after = await db.execute("SELECT COUNT(*) AS c FROM records");
    expect(Number(after.rows[0].c)).toBe(totalBefore - 1);
  });

  it("分钟数 CHECK 约束生效（<=0 被拒绝）", async () => {
    await expect(
      db.execute({
        sql: "INSERT INTO records (nickname, game, date, minutes) VALUES (?, ?, ?, ?)",
        args: ["测试", "游戏", "2026-08-12", 0],
      })
    ).rejects.toThrow();
  });
});
