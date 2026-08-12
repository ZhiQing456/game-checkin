const base = "https://game-checkin-jet.vercel.app";
const j = (m, b) => ({ method: m, headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined });
async function attempt(name, fn) {
  for (let i = 1; i <= 5; i++) {
    try { const out = await fn(); console.log(name, "OK:", out); return; }
    catch (e) { console.log(name, `attempt ${i} failed:`, e.message); await new Promise(r => setTimeout(r, 3000)); }
  }
}
(async () => {
  await attempt("page", async () => {
    const r = await fetch(base + "/", { cache: "no-store" });
    return `status=${r.status}`;
  });
  await attempt("GET records", async () => {
    const r = await fetch(base + "/api/records", { cache: "no-store" });
    const d = await r.json();
    return `status=${r.status} records=${JSON.stringify(d.records ?? d.error)}`;
  });
  await attempt("POST", async () => {
    const r = await fetch(base + "/api/records", { ...j("POST", { nickname: "测试用户", game: "测试游戏", date: "2026-08-12", minutes: 45 }), cache: "no-store" });
    return `status=${r.status} ${JSON.stringify(await r.json())}`;
  });
  await attempt("leaderboard", async () => {
    const r = await fetch(base + "/api/leaderboard", { cache: "no-store" });
    return `status=${r.status} ${JSON.stringify(await r.json())}`;
  });
  await attempt("cleanup", async () => {
    const r = await fetch(base + "/api/records", { cache: "no-store" });
    const recs = (await r.json()).records || [];
    for (const rec of recs) await fetch(`${base}/api/records?id=${rec.id}`, { method: "DELETE" });
    return `deleted=${recs.length}`;
  });
})();
