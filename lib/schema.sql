-- 每日游戏时长打卡：单表记录
CREATE TABLE IF NOT EXISTS records (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname   TEXT    NOT NULL,
  game       TEXT    NOT NULL,
  date       TEXT    NOT NULL,               -- 'YYYY-MM-DD'（浏览器本地时区）
  minutes    INTEGER NOT NULL CHECK (minutes > 0),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_records_unique
  ON records (nickname, game, date);

CREATE INDEX IF NOT EXISTS idx_records_nickname_date
  ON records (nickname, date);

CREATE INDEX IF NOT EXISTS idx_records_date
  ON records (date);
