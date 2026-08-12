import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "@/lib/db";
import type { LeaderboardRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/leaderboard —— 按昵称汇总总时长，降序 */
export async function GET() {
  try {
    const db = getDb();
    await ensureSchema(db);
    const result = await db.execute(
      "SELECT nickname, SUM(minutes) AS total_minutes FROM records GROUP BY nickname ORDER BY total_minutes DESC"
    );
    const leaderboard = result.rows.map((r: any): LeaderboardRow => ({
      nickname: String(r.nickname),
      total_minutes: Number(r.total_minutes),
    }));
    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error("[leaderboard:GET]", err);
    return NextResponse.json(
      { error: "读取排行榜失败，请稍后重试" },
      { status: 500 }
    );
  }
}
