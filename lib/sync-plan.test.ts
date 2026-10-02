/**
 * Tes logika rekonsiliasi centang. Jalankan: node --test lib/sync-plan.test.ts
 * (Node >= 22.6 bisa menjalankan .ts langsung lewat type stripping.)
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { planSync, sanitizeIds } from "./sync-plan.ts";

test("sanitizeIds membuang nilai tidak sah dan menghapus duplikat", () => {
  assert.deepEqual(sanitizeIds([3, 1, 3, -5, 0, 1.7, "8", null, 2]), [1, 2, 3]);
  assert.deepEqual(sanitizeIds([]), []);
});

test("perangkat baru (belum pernah sync) ikut server", () => {
  const p = planSync([5, 6], [1, 2, 3], "2026-01-02T00:00:00Z", "");
  assert.equal(p.action, "take-server");
  assert.deepEqual(p.ids, [1, 2, 3]);
});

test("uncheck di perangkat lain menimpa cache lama (tidak union)", () => {
  // Perangkat ini masih punya [1,2,3] dari sync lalu. Perangkat lain
  // membatalkan centang 2 lalu 3 -> server jadi [1].
  const p = planSync([1, 2, 3], [1], "2026-01-02T10:00:00Z", "2026-01-02T00:00:00Z");
  assert.equal(p.action, "take-server");
  assert.deepEqual(p.ids, [1], "centang yang dibatalkan tidak boleh hidup lagi");
});

test("server tidak berubah -> perubahan lokal yang dikirim", () => {
  const p = planSync([1, 2, 3], [1, 2], "2026-01-02T00:00:00Z", "2026-01-02T00:00:00Z");
  assert.equal(p.action, "push-local");
  assert.deepEqual(p.ids, [1, 2, 3]);
});

test("server belum pernah ada isinya -> upload lokal (perangkat pertama)", () => {
  const p = planSync([9, 10], [], null, "");
  assert.equal(p.action, "push-local");
  assert.deepEqual(p.ids, [9, 10]);
});

test("server kosong tapi pernah ada isinya -> ikut kosong (reset propagated)", () => {
  const p = planSync([1, 2, 3], [], "2026-01-02T10:00:00Z", "2026-01-02T00:00:00Z");
  assert.equal(p.action, "take-server");
  assert.deepEqual(p.ids, []);
});

test("putuskan lalu sambungkan ulang: server dianggap berubah", () => {
  // Setelah disconnect SEEN_KEY dihapus -> lastSeenServerAt kosong,
  // jadi server yang winning.
  const p = planSync([7, 8], [4, 5], "2026-01-02T10:00:00Z", "");
  assert.equal(p.action, "take-server");
  assert.deepEqual(p.ids, [4, 5]);
});

test("dua perangkat dengan waktu berbeda tidak salah baca", () => {
  // Selama timestamp server benar-benar berubah, server menang; kalau tidak,
  // perubahan lokal yang dikirim.
  const before = planSync([1], [1, 2], "t1", "t1");
  assert.equal(before.action, "push-local");
  const after = planSync([1], [1, 2], "t2", "t1");
  assert.equal(after.action, "take-server");
});
