import { NextResponse } from "next/server";
import { getDb, ensureSchema, rowToRecord } from "@/lib/db";
import { validateRecordInput } from "@/lib/validation";
import type { RecordRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/records —— 返回全部记录（小规模好友群够用） */
export async function GET() {
  try {
    const db = getDb();
    await ensureSchema(db);
    const result = await db.execute(
      "SELECT id, nickname, game, date, minutes, created_at, updated_at FROM records ORDER BY date DESC, game ASC"
    );
    const records = result.rows.map(rowToRecord) as RecordRow[];
    return NextResponse.json({ records });
  } catch (err) {
    console.error("[records:GET]", err);
    return NextResponse.json(
      { error: "读取记录失败，请稍后重试" },
      { status: 500 }
    );
  }
}

/** POST /api/records —— 新增/覆盖一条记录（同昵称+游戏+日期则覆盖时长） */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = validateRecordInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { nickname, game, date, minutes } = parsed.data;

  try {
    const db = getDb();
    await ensureSchema(db);
    await db.execute({
      sql: `INSERT INTO records (nickname, game, date, minutes, created_at, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT (nickname, game, date) DO UPDATE SET
              minutes = excluded.minutes,
              updated_at = datetime('now')`,
      args: [nickname, game, date, minutes],
    });

    const row = await db.execute({
      sql: "SELECT id, nickname, game, date, minutes, created_at, updated_at FROM records WHERE nickname = ? AND game = ? AND date = ?",
      args: [nickname, game, date],
    });
    const record = row.rows[0] ? rowToRecord(row.rows[0]) : null;
    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    console.error("[records:POST]", err);
    return NextResponse.json(
      { error: "保存记录失败，请稍后重试" },
      { status: 500 }
    );
  }
}

/** PUT /api/records —— 按 id 修改游戏名/时长（保留昵称与日期） */
export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "请求体必须是 JSON 对象" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const id = Number(b.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "缺少合法的 id 参数" }, { status: 400 });
  }
  const game = typeof b.game === "string" ? b.game.trim() : "";
  if (!game || game.length > 50) {
    return NextResponse.json({ error: "游戏名不合法" }, { status: 400 });
  }
  const minutes = typeof b.minutes === "number" ? b.minutes : NaN;
  if (!Number.isInteger(minutes) || minutes <= 0 || minutes > 24 * 60) {
    return NextResponse.json({ error: "时长不合法" }, { status: 400 });
  }
  const nickname = typeof b.nickname === "string" ? b.nickname.trim() : "";
  const date = typeof b.date === "string" ? b.date.trim() : "";
  if (!nickname || !date) {
    return NextResponse.json({ error: "缺少昵称或日期" }, { status: 400 });
  }

  try {
    const db = getDb();
    await ensureSchema(db);

    // 避免与同一天同昵称的其他记录撞唯一约束
    const conflict = await db.execute({
      sql: "SELECT id FROM records WHERE nickname = ? AND game = ? AND date = ? AND id != ?",
      args: [nickname, game, date, id],
    });
    if (conflict.rows.length > 0) {
      return NextResponse.json(
        { error: "该游戏在当天已有记录，请直接修改那条记录" },
        { status: 409 }
      );
    }

    const result = await db.execute({
      sql: "UPDATE records SET game = ?, minutes = ?, updated_at = datetime('now') WHERE id = ?",
      args: [game, minutes, id],
    });
    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "记录不存在或已被删除" }, { status: 404 });
    }

    const row = await db.execute({
      sql: "SELECT id, nickname, game, date, minutes, created_at, updated_at FROM records WHERE id = ?",
      args: [id],
    });
    const record = row.rows[0] ? rowToRecord(row.rows[0]) : null;
    return NextResponse.json({ record });
  } catch (err) {
    console.error("[records:PUT]", err);
    return NextResponse.json(
      { error: "修改记录失败，请稍后重试" },
      { status: 500 }
    );
  }
}

/** DELETE /api/records?id=... —— 删除单条记录 */
export async function DELETE(req: Request) {
  const raw = new URL(req.url).searchParams.get("id");
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "缺少合法的 id 参数" }, { status: 400 });
  }

  try {
    const db = getDb();
    await ensureSchema(db);
    const result = await db.execute({
      sql: "DELETE FROM records WHERE id = ?",
      args: [id],
    });
    return NextResponse.json({ ok: true, deleted: result.rowsAffected });
  } catch (err) {
    console.error("[records:DELETE]", err);
    return NextResponse.json(
      { error: "删除记录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
