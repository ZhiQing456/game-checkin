export interface RecordInput {
  nickname: string;
  game: string;
  date: string;
  minutes: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_MINUTES = 24 * 60; // 一天最多 24 小时

/** 校验并规范化打卡输入，返回 { ok: true, data } 或 { ok: false, error } */
export function validateRecordInput(body: unknown):
  | { ok: true; data: RecordInput }
  | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "请求体必须是 JSON 对象" };
  }
  const b = body as Record<string, unknown>;

  const nickname = typeof b.nickname === "string" ? b.nickname.trim() : "";
  if (!nickname) return { ok: false, error: "昵称不能为空" };
  if (nickname.length > 30) return { ok: false, error: "昵称最长 30 个字符" };

  const game = typeof b.game === "string" ? b.game.trim() : "";
  if (!game) return { ok: false, error: "游戏名不能为空" };
  if (game.length > 50) return { ok: false, error: "游戏名最长 50 个字符" };

  const date = typeof b.date === "string" ? b.date.trim() : "";
  if (!DATE_RE.test(date)) return { ok: false, error: "日期格式必须是 YYYY-MM-DD" };
  const [yy, mm, dd] = date.split("-").map(Number);
  const dt = new Date(yy, mm - 1, dd);
  if (dt.getFullYear() !== yy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) {
    return { ok: false, error: "日期不合法" };
  }

  const minutes = typeof b.minutes === "number" ? b.minutes : NaN;
  if (!Number.isInteger(minutes) || minutes <= 0) {
    return { ok: false, error: "时长必须是大于 0 的整数分钟" };
  }
  if (minutes > MAX_MINUTES) {
    return { ok: false, error: `单条时长不能超过 ${MAX_MINUTES} 分钟` };
  }

  return { ok: true, data: { nickname, game, date, minutes } };
}

