/**
 * Tes lokal Worker tanpa Cloudflare. Mock D1 in-memory.
 * Jalankan: node worker/test.mjs
 */
import worker from "./src/index.js";

// ---------------------------------------------------------------- mock D1
function makeDB() {
  const applied = [];
  const syncLog = [];
  let logId = 0;

  function handle(st) {
    const up = st.sql.trim().toUpperCase();
    const p = st.getParams();
    if (up.startsWith("DELETE FROM APPLIED")) {
      applied.length = 0;
      return { success: true, meta: { changes: 1 } };
    }
    if (up.startsWith("INSERT INTO APPLIED")) {
      const [db_id, applied_at, device] = p;
      if (applied.some((r) => r.db_id === db_id)) {
        throw new Error("UNIQUE constraint failed: applied.db_id");
      }
      applied.push({ db_id, applied_at, device });
      return { success: true, meta: { changes: 1 } };
    }
    if (up.startsWith("INSERT INTO SYNC_LOG")) {
      const [at, device, total] = p;
      syncLog.push({ id: ++logId, at, device, total });
      return { success: true, meta: { changes: 1 } };
    }
    throw new Error("SQL tidak di-mock: " + st.sql);
  }

  const DB = {
    _applied: applied,
    _log: syncLog,
    // Cloudflare D1 API: prepare() mengembalikan objek statement; method
    // all()/first()/batch() dipanggil PADA statement itu, bukan pada DB.
    prepare(sql) {
      const params = [];
      const st = {
        sql,
        bind(...p) { params.length = 0; params.push(...p); return st; },
        getParams() { return params; },
        async all() {
          const up = sql.trim().toUpperCase();
          if (up.includes("FROM APPLIED")) {
            return { results: applied.map((r) => ({ db_id: r.db_id })) };
          }
          throw new Error("all() tidak di-mock: " + sql);
        },
        async first() {
          const up = sql.trim().toUpperCase();
          if (up.includes("FROM SYNC_LOG")) {
            const last = syncLog[syncLog.length - 1];
            return last ? { at: last.at } : null;
          }
          throw new Error("first() tidak di-mock: " + sql);
        },
        async run() { return handle(st); },
      };
      return st;
    },
    async batch(sts) { return sts.map(handle); },
  };
  return DB;
}

// ---------------------------------------------------------------- runner
const DB = makeDB();
const env = { DB, AUTH_TOKEN: "rahasia-kamu" };
const AUTH = { "X-Auth": "rahasia-kamu" };
const URL_ = "https://x.workers.dev";

let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
}
async function call(method, path, body, headers = AUTH) {
  return worker.fetch(new Request(URL_ + path, {
    method,
    headers: { ...headers, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }), env);
}

// ---------------------------------------------------------------- tests
console.log("== Auth ==");
check("token salah -> 401", (await call("GET", "/applied", undefined, { "X-Auth": "salah" })).status === 401);
check("tanpa header -> 401", (await call("GET", "/applied", undefined, {})).status === 401);
check("token panjang beda -> 401", (await call("GET", "/applied", undefined, { "X-Auth": "rahasia-kam" })).status === 401);
check("OPTIONS preflight -> 204", (await call("OPTIONS", "/applied", undefined, {})).status === 204);

console.log("\n== GET ==");
let r = await call("GET", "/applied");
let j = await r.json();
check("status 200", r.status === 200);
check("ids kosong di awal", Array.isArray(j.ids) && j.ids.length === 0, JSON.stringify(j));
check("updatedAt null di awal", j.updatedAt === null);

console.log("\n== Health (tanpa auth) ==");
r = await call("GET", "/health", undefined, {});
check("ok tanpa auth", r.status === 200 && (await r.json()).ok === true);

console.log("\n== POST ==");
r = await call("POST", "/applied", { ids: [322, 334, 449, 322, -5, 1.7, "abc", null], device: "iPhone" });
j = await r.json();
check("status 200", r.status === 200);
check("count = 3 (dedup + filter)", j.count === 3, JSON.stringify(j));
check("CORS header ada", r.headers.get("Access-Control-Allow-Origin") === "*");

r = await call("GET", "/applied");
j = await r.json();
check("GET mengembalikan 3 id urut", JSON.stringify(j.ids) === JSON.stringify([322, 334, 449]), JSON.stringify(j.ids));
check("sync_log terisi", DB._log.length === 1 && DB._log[0].total === 3);

console.log("\n== POST replace-all ==");
r = await call("POST", "/applied", { ids: [10], device: "MacBook" });
j = await r.json();
check("count jadi 1", j.count === 1);
r = await call("GET", "/applied");
check("GET = [10] (lama hilang)", JSON.stringify((await r.json()).ids) === JSON.stringify([10]));

console.log("\n== POST tidak valid ==");
check("ids string -> 400", (await call("POST", "/applied", { ids: "x" })).status === 400);
check("tanpa body -> 400", (await call("POST", "/applied", {})).status === 400);

console.log("\n== DELETE ==");
r = await call("DELETE", "/applied");
check("status 200", r.status === 200);
check("count 0", (await r.json()).count === 0);
r = await call("GET", "/applied");
check("GET kosong setelah DELETE", (await r.json()).ids.length === 0);

console.log("\n== 404 ==");
check("path lain -> 404", (await call("GET", "/lain")).status === 404);

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);