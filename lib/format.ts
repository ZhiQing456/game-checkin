export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Date → 'YYYY-MM-DD'（本地时区） */
export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 今天的本地日期字符串 */
export function todayLocal(): string {
  return toDateString(new Date());
}

/** 'YYYY-MM-DD' → 本地 Date */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const WEEKDAYS_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function formatDateCN(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAYS_CN[d.getDay()]}`;
}

export function formatDateShort(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 分钟 → 'X 小时 Y 分钟' */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} 分钟`;
  if (m === 0) return `${h} 小时`;
  return `${h} 小时 ${m} 分钟`;
}

/** 分钟 → 'Xh Ym' 紧凑格式 */
export function formatMinutesShort(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
}

export function addDays(dateStr: string, delta: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + delta);
  return toDateString(d);
}

/** 本周一（周一为一周开始） */
export function startOfWeek(dateStr: string): string {
  const d = parseDate(dateStr);
  const day = d.getDay(); // 0=周日
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateString(d);
}

/** 本月第一天 */
export function startOfMonth(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
}

/** 'YYYY-MM' → 当月天数 */
export function daysInMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** 'YYYY-MM' → 当月第一天是星期几（0=周日） */
export function firstWeekday(yearMonth: string): number {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m - 1, 1).getDay();
}
