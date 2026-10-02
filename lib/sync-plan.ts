/**
 * Logika rekonsiliasi centang: server (D1) vs cache lokal.
 *
 * Dipisah dari `applied.ts` supaya bisa diuji tanpa React/browser.
 *
 * Aturan: last-write-wins berdasarkan timestamp server.
 * - Kalau timestamp server berbeda dari yang perangkat ini terakhir lihat,
 *   berarti ada perangkat lain yang mencentang atau membatalkan -> server menang.
 * - Kalau sama, tidak ada yang berubah di server -> perubahan lokal yang
 *   belum terupload yang dikirim.
 */

export type SyncPlan =
  | { action: "take-server"; ids: number[] }
  | { action: "push-local"; ids: number[] };

/** Buang nilai yang bukan db_id yang sah (bilangan bulat positif). */
export function sanitizeIds(input: readonly unknown[]): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (const n of input) {
    if (typeof n !== "number" || !Number.isInteger(n) || n <= 0) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out.sort((a, b) => a - b);
}

export function planSync(
  localIds: readonly unknown[],
  remoteIds: readonly unknown[],
  remoteUpdatedAt: string | null,
  lastSeenServerAt: string
): SyncPlan {
  const serverChanged = Boolean(remoteUpdatedAt) && remoteUpdatedAt !== lastSeenServerAt;

  if (serverChanged) {
    return { action: "take-server", ids: sanitizeIds(remoteIds) };
  }
  return { action: "push-local", ids: sanitizeIds(localIds) };
}
