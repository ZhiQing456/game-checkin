import { createClient, type Client } from "@libsql/client";
import type { RecordRow } from "./types";
import fs from "node:fs";
import path from "node:path";

let cached: Client | null = null;

/**
 * 获取数据库客户端。
 * - 生产环境必须配置 TURSO_DATABASE_URL（Turso 云端 SQLite）
 * - 本地开发未配置时回退到 ./local.db 文件，方便离线调试
 */
export function getDb(): Client {
  if (cached) return cached;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  let client: Client;
  if (url) {
    client = createClient({ url, authToken });
  } else if (process.env.NODE_ENV !== "production") {
    const dir = path.join(process.cwd(), "local.db");
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    console.warn(
      "[db] 未检测到 TURSO_DATABASE_URL，使用本地文件 local.db（仅限开发调试）"
    );
    client = createClient({ url: `file:${dir.replace(/\\/g, "/")}` });
  } else {
    throw new Error("生产环境缺少 TURSO_DATABASE_URL 环境变量");
  }

  cached = client;
  return client;
}

let schemaReady: Promise<void> | null = null;

/** 幂等初始化表结构（可重复调用，无副作用）
 * 注意：Turso 的 HTTP 协议不支持 executeMultiple，须逐条执行或使用 batch */
export function ensureSchema(db: Client = getDb()): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = fs.readFileSync(path.join(process.cwd(), "lib", "schema.sql"), "utf-8");
      const stmts = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (stmts.length === 1) {
        await db.execute(stmts[0]);
      } else {
        await db.batch(stmts);
      }
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

/** 把数据库行转换成前端用的 RecordRow */
export function rowToRecord(row: unknown): any {
  const r = row as Record<string, unknown>;
  return {
    id: Number(r.id),
    nickname: String(r.nickname),
    game: String(r.game),
    date: String(r.date),
    minutes: Number(r.minutes),
    created_at: r.created_at ? String(r.created_at) : undefined,
    updated_at: r.updated_at ? String(r.updated_at) : undefined,
  };
}




