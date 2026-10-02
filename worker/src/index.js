/**
 * Worker untuk sinkronisasi centang "sudah dilamar".
 *
 * Isi database cuma daftar db_id (angka) - bukan data lowongan.
 * Data lowongan tetap di-build statis ke GitHub Pages oleh job-automation.
 *
 * Endpoint:
 *   GET    /applied        -> { ids: number[], updatedAt: string|null }
 *   POST   /applied        body { ids: number[] }  (ganti seluruh daftar)
 *   DELETE /applied        kosongkan semua
 *
 * Auth: header X-Auth harus cocok dengan AUTH_TOKEN (secret di wrangler).
 * Token dicek per-request; tidak ada user/pass, cukup satu rahasia bersama.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,X-Auth",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function authorized(request, env) {
  const got = request.headers.get("X-Auth") || "";
  // Bandingkan waktu-konstan biar tidak bocor lewat timing.
  if (got.length !== env.AUTH_TOKEN.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ env.AUTH_TOKEN.charCodeAt(i);
  return diff === 0;
}

async function readAll(env) {
  const { results } = await env.DB.prepare(
    "SELECT db_id FROM applied ORDER BY db_id"
  ).all();
  return (results || []).map((r) => r.db_id);
}

async function replaceAll(env, ids, device) {
  // Ganti total dalam satu transaksi supaya tidak pernah ada daftar setengah jadi.
  const now = new Date().toISOString();
  // Hanya bilangan bulat positif yang valid. Jangan pakai Math.trunc: 1.7 jadi 1
  // dan db_id palsu bisa tersimpan.
  const clean = [
    ...new Set(ids.filter((n) => typeof n === "number" && Number.isInteger(n) && n > 0)),
  ].slice(0, 20000);

  const statements = [
    env.DB.prepare("DELETE FROM applied"),
    ...clean.map((n) =>
      env.DB.prepare(
        "INSERT INTO applied (db_id, applied_at, device) VALUES (?, ?, ?)"
      ).bind(n, now, device || null)
    ),
    env.DB.prepare("INSERT INTO sync_log (at, device, total) VALUES (?, ?, ?)").bind(
      now,
      device || null,
      clean.length
    ),
  ];
  // D1 batch = satu transaksi atomik.
  await env.DB.batch(statements);
  return clean;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

const url = new URL(request.url);

  // Health check TANPA auth (dipakai monitoring / curl). Tidak membocorkan data.
  if (url.pathname === "/health") {
    return json({ ok: true, at: new Date().toISOString() });
  }

  if (!authorized(request, env)) {
    return json({ error: "unauthorized" }, 401);
  }

  if (url.pathname !== "/applied") {
    return json({ error: "not found" }, 404);
  }

    try {
      if (request.method === "GET") {
        const ids = await readAll(env);
        const last = await env.DB.prepare(
          "SELECT at FROM sync_log ORDER BY id DESC LIMIT 1"
        ).first();
        return json({ ids, updatedAt: (last && last.at) || null });
      }

      if (request.method === "POST") {
        const body = await request.json().catch(() => null);
        if (!body || !Array.isArray(body.ids)) {
          return json({ error: "body harus { ids: number[] }" }, 400);
        }
        const saved = await replaceAll(env, body.ids, body.device);
        return json({ ok: true, count: saved.length, updatedAt: new Date().toISOString() });
      }

      if (request.method === "DELETE") {
        await replaceAll(env, [], null);
        return json({ ok: true, count: 0, updatedAt: new Date().toISOString() });
      }

      return json({ error: "method not allowed" }, 405);
    } catch (e) {
      return json({ error: String(e && e.message ? e.message : e) }, 500);
    }
  },
};