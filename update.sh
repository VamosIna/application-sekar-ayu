#!/usr/bin/env bash
#
# Satu perintah untuk refresh data + deploy:
#   scrape -> detail -> enrich+match -> draft -> subjects -> html/xlsx/json
#   -> build Next.js -> git commit (push tetap manual)
#
# Pakai:
#   ./update.sh              # refresh penuh + commit
#   ./update.sh --json-only  # lewati scrape/LLM, cuma regenerate JSON + build
#   ./update.sh --no-build   # refresh + commit tanpa build lokal
#   ./update.sh --push       # sekaligus push (hati-hati: website langsung berubah)
#
set -euo pipefail

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JOBS_DIR="${JOBS_DIR:-$HOME/job-automation}"

JSON_ONLY=0; DO_BUILD=1; DO_PUSH=0
for arg in "$@"; do
  case "$arg" in
    --json-only) JSON_ONLY=1 ;;
    --no-build)  DO_BUILD=0 ;;
    --push)      DO_PUSH=1 ;;
    -h|--help)   sed -n '2,12p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "argumen tidak dikenal: $arg (lihat --help)"; exit 1 ;;
  esac
done

cd "$JOBS_DIR"
# shellcheck disable=SC1091
source .venv/bin/activate

if [ "$JSON_ONLY" -eq 1 ]; then
  echo "==> Mode JSON-only: skip scrape & LLM"
  python main.py json --limit 600
else
  echo "==> Refresh penuh (bisa 10-25 menit, banyak panggilan LLM gratis)"
  python main.py refresh
fi

# Deteksi kalau JSON tidak berubah sama sekali -> jangan commit noise.
# Bandingkan isi lowongan, BUKAN file mentah: `generated_at` selalu berubah tiap
# run, jadi `git diff --quiet` selalu false. Yang kita pedulikan: jumlah lowongan
# dan `first_seen` per lowongan benar-benar berubah atau tidak.
CHANGED=$(python3 - "$SITE_DIR" <<'PY'
import json, subprocess, sys
from pathlib import Path

site = Path(sys.argv[1])

def fingerprint(data_dir: Path):
    """Tanda(lowongan) stabil: id + first_seen, tanpa timestamp."""
    p = data_dir / "lamaran.json"
    if not p.exists():
        return None
    d = json.loads(p.read_text("utf-8"))
    return {
        j.get("db_id"): (j.get("first_seen"), j.get("score"), j.get("title"))
        for j in d.get("jobs", [])
    }

current = fingerprint(site / "data")
if current is None:
    print("FIRST")
    sys.exit(0)

# Bandingkan dengan isi yang sudah di-commit.
prev_json = subprocess.run(
    ["git", "-C", str(site), "show", "HEAD:data/lamaran.json"],
    capture_output=True, text=True,
)
if prev_json.returncode != 0:
    print("FIRST")          # belum ada commit sebelumnya
    sys.exit(0)

try:
    prev = json.loads(prev_json.stdout)
except ValueError:
    print("FIRST")
    sys.exit(0)

prev_map = {j.get("db_id"): (j.get("first_seen"), j.get("score"), j.get("title"))
            for j in prev.get("jobs", [])}

added = set(current) - set(prev_map)
removed = set(prev_map) - set(current)
changed = sum(1 for k in set(current) & set(prev_map) if current[k] != prev_map[k])

if added or removed or changed:
    print(f"CHANGED +{len(added)} -{len(removed)} ~{changed}")
else:
    print("SAME")
PY
)

case "$CHANGED" in
  SAME) SKIP_COMMIT=1 ;;
  *)    SKIP_COMMIT=0; [ -n "$CHANGED" ] && echo "==> Perubahan data: $CHANGED" ;;
esac

if [ "$DO_BUILD" -eq 1 ]; then
  echo "==> Build Next.js"
  cd "$SITE_DIR"
  [ -d node_modules ] || npm ci
  npm run build
fi

if [ "$SKIP_COMMIT" -eq 1 ] && [ "$DO_PUSH" -eq 0 ]; then
  echo "==> Selesai (tidak ada perubahan data). Tidak ada commit dibuat."
  exit 0
fi

cd "$SITE_DIR"
TOTAL=$(python3 -c "import json;d=json.load(open('data/lamaran.json'));print(d['totals']['all'])")
NEW=$(python3 -c "import json;d=json.load(open('data/lamaran.json'));print(d['totals'].get('new',0))")
GEN=$(python3 -c "import json;d=json.load(open('data/lamaran.json'));print(d['generated_at'])")

if [ "$SKIP_COMMIT" -eq 0 ]; then
  git add -A data
  git commit -m "data: ${TOTAL} lowongan (${NEW} baru) @ ${GEN}"
  echo "==> Commit dibuat"
else
  echo "==> Data tetap, hanya commit workflow/kelistrikan bila ada"
  git add -A
  git diff --cached --quiet || git commit -m "chore: update $(date +%Y-%m-%d)"
fi

if [ "$DO_PUSH" -eq 1 ]; then
  echo "==> Push ke origin/main (GitHub Actions akan auto-deploy)"
  git push origin main
  echo "==> Selesai. Cek Actions: https://github.com/$(git remote get-url origin | sed 's|.*github.com[:/]||;s|\.git$||')/actions"
else
  echo
  echo "==> Selesai. Belum di-push."
  echo "    Review dulu:  cd $SITE_DIR && git show --stat HEAD && git diff HEAD~1 -- data | head -40"
  echo "    Deploy:       git push origin main"
fi