# 🎮 游戏时长打卡（多人版）

一个中文界面的每日打卡网页：按游戏记录每天玩了多久，支持**日历查看、周/月统计、全员时长排行榜**。每人选个昵称即可使用，无需注册。

## 功能

- **打卡**：选/新建游戏名，输入小时和分钟即可保存；当天记录可修改、删除
- **日历**：月历格子显示每天总时长（颜色越深玩得越久），点某天可补录/修改/删除
- **统计**：本周/本月/全部 时段切换，总时长、打卡天数、日均、按游戏汇总、每日趋势
- **排行榜**：按累计时长从高到低排名，本期数据实时更新
- **多人**：首次打开选昵称（存浏览器本地），各记各的，排行榜汇总所有人

## 本地开发

```bash
pnpm install
pnpm dev        # 打开 http://localhost:3000
```

未配置数据库时自动使用本地 `local.db`（仅开发调试用，可随时删除）。

运行测试：

```bash
pnpm test
```

## 部署到公网（免费，约 10 分钟）

整体流程：**GitHub 建仓库 → Vercel 导入部署 → Turso 建数据库 → 配置环境变量**。

### 1. 推送代码到 GitHub

1. 注册/登录 [GitHub](https://github.com)，新建一个仓库（Public/Private 均可）
2. 在项目目录执行：

```bash
git init
git add .
git commit -m "init: 游戏时长打卡"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

### 2. 在 Vercel 部署

1. 注册/登录 [Vercel](https://vercel.com)（可用 GitHub 账号直接登录）
2. 点 **Add New → Project**，选择刚推送的仓库 → **Deploy**
3. 部署成功后得到一个 `https://xxxx.vercel.app` 网址（可自定义）

### 3. 创建 Turso 数据库并配置

1. 注册/登录 [Turso](https://turso.tech)（免费额度足够好友小群使用）
2. 在 Dashboard 点 **Create Database**，记下数据库名
3. 创建访问令牌（Token），复制 `URL` 和 `Token` 两串内容
4. 回到 Vercel 项目 → **Settings → Environment Variables**，添加：

| 变量名 | 值 |
| --- | --- |
| `TURSO_DATABASE_URL` | `libsql://<数据库名>.turso.io` |
| `TURSO_AUTH_TOKEN` | `<你的 Token>` |

5. 到 **Deployments** 点 **Redeploy**（或重新部署最新提交）
6. 打开网址，把链接发给朋友即可一起打卡 🎉

## API 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/records` | 返回全部记录 |
| POST | `/api/records` | 新增/覆盖一条记录（同昵称+游戏+日期则覆盖时长） |
| PUT | `/api/records` | 按 id 修改游戏名/时长 |
| DELETE | `/api/records?id=...` | 删除单条记录 |
| GET | `/api/leaderboard` | 按昵称汇总总时长，降序返回排行榜 |

数据表 `records`：`nickname`（昵称）、`game`（游戏名）、`date`（YYYY-MM-DD）、`minutes`（分钟），唯一约束 `(nickname, game, date)`。

## 技术栈

- Next.js 15（App Router）+ React 19 + TypeScript
- Turso（libSQL/SQLite 云数据库）
- Vercel 免费托管（API 为 Node.js Serverless Functions）
- Vitest 单元测试（本地 SQLite 验证 SQL 逻辑）

## 已知说明

- 昵称即身份，无密码；重名时界面会给出合并警告，请自行约定唯一昵称
- 日期按浏览器本地时区计算
- 免费额度面向好友小群，数据量非常小，完全够用
