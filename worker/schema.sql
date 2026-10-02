-- Skema untuk centang "sudah dilamar" yang sinkron lintas perangkat.
-- Dipakai Cloudflare D1 (free 5GB, tanpa kartu kredit).
--
-- Jalankan di D1 lewat salah satu:
--   npx wrangler d1 execute lamaran-applied --file=schema.sql
--   atau tempel di dashboard Cloudflare > Workers & Pages > D1 > Console.

-- Hanya satu baris per lowongan. db_id = jobs.id di SQLite job-automation,
-- yang stabil selamanya (AUTOINCREMENT + url_hash UNIQUE).
CREATE TABLE IF NOT EXISTS applied (
  db_id     INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL,
  -- device penanda perangkat terakhir yang mencentang (untuk debug saja)
  device    TEXT
);

CREATE INDEX IF NOT EXISTS idx_applied_at ON applied(applied_at);

-- Riwayat singkat (opsional, buat lihat kapan terakhir update).
CREATE TABLE IF NOT EXISTS sync_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  at          TEXT NOT NULL,
  device      TEXT,
  total       INTEGER
);