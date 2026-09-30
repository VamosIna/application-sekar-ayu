# lamaran-site

Situs statis (Next.js) untuk daftar lamaran **Sekar Ayu Herdyningrum**.
Data berasal dari `job-automation` (`python main.py refresh`) dan dibaca dari
`data/lamaran.json`.

## Cara kerja singkat

```
~/job-automation                     ~/Desktop/lamaran-site
  main.py refresh  ──tulis──►  ~/Desktop/lamaran.json  ──salak oto──►  data/lamaran.json  ──►  Next.js build
       └─ juga menulis lamaran.html & lowongan.xlsx
```

- `main.py refresh` **selalu** membuat `~/Desktop/lamaran.json`.
- JSON itu **akumulatif**: lowongan lama tetap ada walau sudah kadaluarsa.
- Ada tanggal update terakhir: `generated_at` (global) + `first_seen`/`updated_at` per lowongan.
- Hasil JSON otomatis disalin ke `data/lamaran.json` di project ini (kalau foldernya ada).

## Update konten (rutin)

```bash
cd ~/job-automation && source .venv/bin/activate
python main.py refresh          # -> lamaran.json (+ html + xlsx), tersalin ke project ini
```

Kalau hanya mau regenerasi JSON (tanpa scrape ulang):

```bash
python main.py json
# atau ke lokasi lain:
python main.py json --out ~/Desktop/lamaran.json
```

Setelah JSON masuk, rebuild situs:

```bash
cd ~/Desktop/lamaran-site
npm install        # sekali saja
npm run build      # hasil statis ada di folder out/
```

## Jalankan lokal

```bash
npm run dev        # http://localhost:3000
```

## Tombol "Buka di Gmail"

- Di **iPhone/iPad**: mencoba membuka **app Gmail** (`googlegmail://`). Kalau app
  tidak terpasang, otomatis fallback ke **compose web Gmail** — draft (To/Subject/Body)
  tetap terisi siap kirim.
- Di **Android/desktop**: langsung membuka compose web Gmail di tab baru, draft terisi.

Tombol lain: **Download CV**, **Copy cover letter** (untuk lamaran via portal),
dan **Lowongan** (link postingan asli).

## Deploy ke GitHub Pages

Project ini sudah siap: `next.config.mjs` memakai `output: "export"`, dan ada
workflow di `.github/workflows/deploy.yml`.

1. Buat repo baru di akun GitHub **pribadi** (jangan pakai akun yang ada "ayana").
2. Push project ini (branch `main`):
   ```bash
   cd ~/Desktop/lamaran-site
   git init -b main
   git add .
   git commit -m "init lamaran site"
   git remote add origin git@github.com:<username>/<repo>.git
   git push -u origin main
   ```
3. Di GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Setiap push ke `main`, GitHub Actions build & deploy otomatis.
   - Repo `<username>.github.io` → URL `https://<username>.github.io/`
   - Repo biasa (mis. `lamaran`) → URL `https://<username>.github.io/lamaran/`
   - `basePath` diisi otomatis oleh workflow (via `NEXT_PUBLIC_BASE_PATH`).

Tes build lokal dengan basePath (opsional):

```bash
NEXT_PUBLIC_BASE_PATH=/lamaran npm run build
```

## Struktur

```
app/            layout + page + globals.css
components/     LamaranApp, Sidebar, JobCard
lib/            data.ts (baca JSON), gmail.ts (deep-link iOS), types.ts
data/lamaran.json   data dari job-automation (di-commit agar CI bisa build)
public/.nojekyll
.github/workflows/deploy.yml
```
