# Setup sinkronisasi centang (Cloudflare Worker + D1)

Status "sudah dilamar" sekarang bisa sinkron antar perangkat (HP, laptop, browser
beda). Antesanya hanya tersimpan di `localStorage` satu browser, jadi hilang kalau
ganti perangkat atau clear cache.

**Gratis, tanpa kartu kredit.** Cloudflare Workers free plan tidak punya jeda idle
(kasus Supabase free project yang berhenti setelah 7 hari tidak berlaku di sini).

Yang disimpan di server **hanya daftar angka `db_id`** - bukan judul lowongan, bukan
data pribadi. Data lowongan tetap di-build statis oleh `job-automation` seperti
sekarang, jadi halaman tetap cepat dan tetap jalan kalau Worker mati.

---

## Cara kerja

```
job-automation  --->  data/lamaran.json  --->  GitHub Pages   (data lowongan, statis)
                                                           
ceklis di HP   <-->  Worker  <-->  D1                      (daftar db_id)
                      ^
                      |  X-Auth: passphrase
                 localStorage (cache offline)
```

- `localStorage` tetap jadi cache, jadi halaman tetap jalan offline.
- Setiap kali centang berubah, daftar dikirim ke Worker (delay 0,8 detik).
- Saat halaman dibuka / koneksi kembali online, Worker mengembalikan daftar
  terbaru dan digabung dengan lokal (union) - jadi tidak ada centang yang
  hilang diam-diam.

---

## Bagian 1 - Deploy Worker (sekali saja)

Butuh akun Cloudflare dulu: <https://dash.cloudflare.com/sign-up>. Gratis, tidak
minta kartu kredit. Butuh verifikasi email saja.

Buka terminal, lalu:

```bash
cd ~/Desktop/lamaran-upload/worker
npm install
```

### 1. Buat database D1

```bash
npx wrangler d1 create lamaran-applied
```

Wrangler akan login lewat browser, lalu mencetak sesuatu seperti:

```
[[d1_databases]]
binding = "DB"
database_name = "lamaran-applied"
database_id = "e1a2b3c4-d5e6-7890-abcd-ef1234567890"
```

### 2. Tempel `database_id` ke `wrangler.toml`

Buka `worker/wrangler.toml`, ganti baris:

```toml
database_id = "ISI-DARI-WRANGLER-D1-CREATE"
```

dengan ID asli dari langkah 1. (Baris blok `[[d1_databases]]` yang ter-comment
di file itu boleh dihapus - yang aktif cukup satu.)

### 3. Buat tabel

```bash
npx wrangler d1 execute lamaran-applied --file=schema.sql
```

Kalau lebih suka lewat dashboard: **Workers & Pages > D1 > lamaran-applied >
Console**, tempel isi `schema.sql`, klik **Execute**.

### 4. Simpan passphrase

```bash
npx wrangler secret put AUTH_TOKEN
```

Ketik passphrase yang ingin kamu pakai (mis. `lowongan-pribadi-2026`), lalu
Enter. **Ini yang nanti kamu ketik di dashboard juga.** Jangan pakai password yang
dipakai di layanan lain.

Passphrase disimpan sebagai secret Worker, bukan di `wrangler.toml` - jadi tidak
bocor ke git.

### 5. Deploy

```bash
npx wrangler deploy
```

Contohnya selesai jadi:

```
Published lamaran-applied
  https://lamaran-applied. subdomain-anda.workers.dev
```

Salin URL itu (pakai untuk langkah 2).

### Cek cepat

```bash
curl https://lamaran-applied.subdomain-anda.workers.dev/health
# {"ok":true,"at":"..."}
```

`/health` tidak butuh passphrase, jadi aman dipakai untuk monitoring.

---

## Bagian 2 - Sambungkan dashboard

### 1. Simpan URL Worker

Buat file `.env.local` di root `lamaran-upload` (sudah otomatis masuk
`.gitignore`, jadi tidak ikut ter-commit):

```bash
cd ~/Desktop/lamaran-upload
echo 'NEXT_PUBLIC_SYNC_URL=https://lamaran-applied.subdomain-anda.workers.dev' >> .env.local
```

`NEXT_PUBLIC_*` memang ikut ter-*bundle* ke JS di halaman - itu normal dan aman,
karena yang rahasia adalah passphrase-nya, bukan URL-nya.

### 2. Build ulang

```bash
./update.sh --no-build   # skip; ini untuk refresh data saja
```

Build saja tanpa refresh data:

```bash
npm run build
```

Atau via `update.sh` biasa (refresh data + build). Minta build ulang **wajib**
setiap kali URL Worker berubah, karena URL-nya dibekukan saat build.

### 3. Sambungkan di browser

Buka dashboard, di baris judul akan muncul tombol **Sambungkan**.

1. Klik **Sambungkan**.
2. Ketik passphrase yang sama dengan langkah Bagian 1.4.
3. Klik **Hubungkan**.

Centang yang sudah ada tidak hilang - centang lama ikut ter-*merge* ke
server.

---

## Pemakaian harian

Tidak ada yang perlu dilakukan. Centang tersimpan otomatis.

Kalau mau centang dari perangkat lain: buka dashboard di perangkat itu, klik
**Sambungkan**, ketik passphrase yang sama.

Kalau muncul badge merah **Gagal menyimpan**: centang tetap aman di perangkat itu
(writes ke `localStorage` selalu jalan), tapi belum terupload. Cek koneksi /
apakah Worker masih hidup, lalu centang satu lowongan lagi untuk memaksa retry.

Kalau badge oranye **Offline**: normal, tidak apa-apa. Akan tersinkron sendiri
saat koneksi kembali.

---

## Perintah harian

Semua tetap sama seperti sebelumnya - sinkronisasi tidak mengubah alur kerja:

```bash
cd ~/Desktop/lamaran-upload
./update.sh          # refresh pipeline + build + commit data
# lalu review, lalu:
git push
```

Kalau belum setup Worker, dashboard tetap jalan persis seperti sekarang
(localStorage). Tidak ada error, tidak ada tombol tambahan.

---

## Troubleshooting

**"Passphrase salah, atau Worker belum bisa dijangkau."**
- Salah ketik? Perhatikan: passphrase bersifat case-sensitive.
- Worker sudah `wrangler deploy` setelah secret dibuat?
- URL di `.env.local` sudah benar (https, tanpa slash di akhir)?
- Sudah `npm run build` ulang setelah ganti `.env.local`?

**Tombol "Sambungkan" tidak muncul.**
`NEXT_PUBLIC_SYNC_URL` belum diisi, atau belum di-build ulang. Perbaiki
`.env.local`, lalu build lagi.

**`wrangler d1 create` minta login.**
`npx wrangler login` akan buka tab browser untuk otorisasi - sekali saja, lalu
terpakai seterusnya di komputer ini.

**Auth token bocor ke git?**
Cek `worker/wrangler.toml` tidak punya baris `AUTH_TOKEN = "..."`. Seharusnya
tidak ada sama sekali - token disimulasikan via `wrangler secret put`.

**Mau reset semua centang di semua perangkat.**
Di dashboard klik tombol rotasi (reset) **di perangkat yang sudah tersambung**.
Sekalian hapus isi database:

```bash
cd ~/Desktop/lamaran-upload/worker
npx wrangler d1 execute lamaran-applied --command 'DELETE FROM applied'
```

---

## Biaya & batas (free plan)

| Yang              | Batas free                          |
| ----------------- | ----------------------------------- |
| Penyimpanan D1    | 5 GB                                |
| Baris dibaca/hari | 5 juta                              |
| Baris ditulis/hari| 100.000                             |
| Worker requests   | 100.000/hari                        |

Ribuan lowongan x beberapa device = ribuan request per hari. Jauh di bawah batas.
Kalau nanti benar-benar tembus, solusi paling murah adalah naik ke
**Workers Paid** ($5/bulan, sudah termasuk 10 juta request) - tidak perlu ganti
platform.
