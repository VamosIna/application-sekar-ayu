# lamaran-upload

Situs statis (Next.js 15) untuk dashboard lamaran **Sekar Ayu Herdyningrum**.
Data berasal dari `~/job-automation` (`python main.py refresh`) dan dibaca dari
`data/lamaran.json`.

## Cara kerja

```
~/job-automation                          ~/Desktop/lamaran-upload
  main.py refresh  ──►  ~/Desktop/lamaran.json  ──►  data/lamaran*.json  ──►  Next.js build  ──►  push  ──►  GitHub Pages
       └─ juga menulis lamaran.html & lowongan.xlsx ke ~/Desktop
```

- `main.py refresh` selalu menulis `~/Desktop/lamaran.json` (output untuk dibaca manusia).
- Sekaligus menyalin **3 file** ke `data/` project ini:
  `lamaran.json` (semua), `lamaran_jabode.json`, `lamaran_bali.json`.
- Data **akumulatif**: lowongan lama tidak hilang walau sudah kadaluarsa.
- Tanggal update: `generated_at` (global) + `first_seen`/`updated_at` per lowongan.

> Folder tujuan bisa diubah lewat env `LAMARAN_SITE_DATA` (default: `~/Desktop/lamaran-upload/data`).

## Update harian (satu perintah)

```bash
cd ~/Desktop/lamaran-upload
./update.sh
```

Itu melakukan: refresh data → build Next.js → `git commit`. **Tidak** push —
review dulu, lalu:

```bash
git show --stat HEAD
git push origin main     # GitHub Actions auto-deploy ke GitHub Pages
```

### Opsi

| Perintah | Arti |
|---|---|
| `./update.sh` | Refresh penuh (10-25 menit, banyak panggilan LLM gratis) + build + commit |
| `./update.sh --json-only` | Lewati scrape & LLM, cuma regenerate JSON dari DB + build. **Cepat** (~10 detik) |
| `./update.sh --no-build` | Refresh + commit tanpa build lokal (biarkan CI yang build) |
| `./update.sh --push` | Sekalian push (langsung ganti website) |

Kalau `data/*.json` tidak berubah isinya, script tidak membuat commit kosong.

### Manual (tanpa script)

```bash
cd ~/job-automation && source .venv/bin/activate
python main.py refresh              # atau: python main.py json  (regenerate JSON saja)
cd ~/Desktop/lamaran-upload
npm run build && git add -A data && git commit -m "update" && git push
```

## Setup (sekali saja)

```bash
cd ~/Desktop/lamaran-upload
npm ci
```

Deploy lewat GitHub Pages:

1. Buat repo di akun GitHub **pribadi**, lalu:
   ```bash
   cd ~/Desktop/lamaran-upload
   git remote add origin git@github.com:<username>/<repo>.git
   git push -u origin main
   ```
2. GitHub → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Tunggu workflow hijau, cek URL yang muncul di log.

`basePath` diisi otomatis oleh workflow (`NEXT_PUBLIC_BASE_PATH`), jadi repo
`<username>.github.io` dan repo biasa (`/lamaran`) dua-duanya jalan tanpa ubah kode.

## Jalankan lokal

```bash
npm run dev     # http://localhost:3000
```

Tes build dengan basePath (opsional):

```bash
NEXT_PUBLIC_BASE_PATH=/lamaran npm run build
```

## Tombol aksi

- **Buka di Gmail** — iPhone/iPad coba app Gmail (`googlegmail://`), fallback ke
  compose web. To/Subject/Body terisi siap kirim. Draft email beneran tidak bisa
  di-attach lewat URL Gmail, jadi `cv.pdf` ditambahkan manual di `maildraft`
  (`python main.py maildraft` — buat draft sungguhan di folder Drafts + attach CV).
- **Copy cover letter** — untuk lamaran via portal.
- **Lowongan** — link postingan asli.
- **Centang "sudah dilamar"** — disimpan di `localStorage` browser sebagai cache, dan
  bisa disinkronkan antar perangkat lewat Cloudflare Worker + D1. 12 lowongan email
  dari batch pertama otomatis tercentang.

## Sinkronisasi centang (opsional)

Secara default centang hanya ada di browser ini (seperti semula). Kalau mau ikut
tersimpan di server sehingga bisa dibuka dari HP/laptop/browser lain, deploy
Worker gratis yang menyimpan **hanya daftar angka `db_id`**:

- Panduan lengkap: **[SETUP.md](./SETUP.md)**
- Kode Worker: `worker/`

Data lowongan tetap statis di GitHub Pages - tidak ada yang berubah di pipeline
`job-automation`. Kalau Worker tidak aktif, dashboard tetap jalan persis seperti
sekarang.

Ringkas, kalau sudah punya akun Cloudflare:

```bash
cd ~/Desktop/lamaran-upload/worker
npm install
npx wrangler d1 create lamaran-applied      # salin database_id ke wrangler.toml
npx wrangler d1 execute lamaran-applied --file=schema.sql
npx wrangler secret put AUTH_TOKEN         # passphrase
npx wrangler deploy                         # salin URL Worker
```

Lalu di root project, `echo 'NEXT_PUBLIC_SYNC_URL=<url-worker>' >> .env.local`,
build ulang, dan klik **Sambungkan** di dashboard.

Tes Worker tanpa deploy: `node worker/test.mjs`

## Struktur

```
app/                  layout + page + globals.css
components/           LamaranApp, Sidebar, JobCard, FilterBar, UpdateCalendar, SyncStatus
lib/                  data.ts (baca JSON), gmail.ts (deep-link iOS), applied.ts, types.ts
data/lamaran*.json    output job-automation — di-commit agar CI bisa build
worker/               Cloudflare Worker + D1 (opsional, untuk sinkron centang)
update.sh             refresh + build + commit
.github/workflows/deploy.yml
```

## Catatan

- `index.html` hasil build **±16 MB** (551 lowongan, `breakdown` + cover letter ikut
  ter-render). Gzip ≈ 0.8 MB, masih aman untuk GitHub Pages. Kalau nanti lowongan
  tumbuh > 2000, pertimbangkan trim `breakdown` dari payload.
- `data/` **harus** di-commit — frontend membacanya saat build, bukan runtime fetch.
- Tidak ada backend untuk data lowongan. Tidak ada server. Tidak ada kartu kredit.
- `NEXT_PUBLIC_SYNC_URL` hanya dipakai kalau kamu sengaja mengisinya; kalau kosong,
  semua `lib/applied.ts` berjalan murni `localStorage`.