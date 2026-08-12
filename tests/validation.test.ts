import { describe, expect, it } from "vitest";
import { validateRecordInput } from "../lib/validation";

describe("validateRecordInput", () => {
  it("接受合法输入并裁剪空白", () => {
    const r = validateRecordInput({
      nickname: "  小明 ",
      game: " 王者荣耀 ",
      date: "2026-08-12",
      minutes: 90,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toEqual({
        nickname: "小明",
        game: "王者荣耀",
        date: "2026-08-12",
        minutes: 90,
      });
    }
  });

  it("拒绝空昵称/超长昵称", () => {
    expect(validateRecordInput({ nickname: "  ", game: "原神", date: "2026-08-12", minutes: 30 }).ok).toBe(false);
    expect(validateRecordInput({ nickname: "x".repeat(31), game: "原神", date: "2026-08-12", minutes: 30 }).ok).toBe(false);
  });

  it("拒绝空游戏名/超长游戏名", () => {
    expect(validateRecordInput({ nickname: "小明", game: "", date: "2026-08-12", minutes: 30 }).ok).toBe(false);
    expect(validateRecordInput({ nickname: "小明", game: "x".repeat(51), date: "2026-08-12", minutes: 30 }).ok).toBe(false);
  });

  it("拒绝非法日期", () => {
    expect(validateRecordInput({ nickname: "小明", game: "原神", date: "2026/08/12", minutes: 30 }).ok).toBe(false);
    expect(validateRecordInput({ nickname: "小明", game: "原神", date: "2026-02-30", minutes: 30 }).ok).toBe(false);
    expect(validateRecordInput({ nickname: "小明", game: "原神", date: "2026-13-01", minutes: 30 }).ok).toBe(false);
  });

  it("拒绝非正数/非整数/超上限时长", () => {
    expect(validateRecordInput({ nickname: "小明", game: "原神", date: "2026-08-12", minutes: 0 }).ok).toBe(false);
    expect(validateRecordInput({ nickname: "小明", game: "原神", date: "2026-08-12", minutes: -10 }).ok).toBe(false);
    expect(validateRecordInput({ nickname: "小明", game: "原神", date: "2026-08-12", minutes: 1.5 }).ok).toBe(false);
    expect(validateRecordInput({ nickname: "小明", game: "原神", date: "2026-08-12", minutes: 24 * 60 + 1 }).ok).toBe(false);
    expect(validateRecordInput({ nickname: "小明", game: "原神", date: "2026-08-12", minutes: "90" }).ok).toBe(false);
  });

  it("拒绝非对象请求体", () => {
    expect(validateRecordInput(null).ok).toBe(false);
    expect(validateRecordInput("abc").ok).toBe(false);
    expect(validateRecordInput([]).ok).toBe(false);
  });
});
