"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { seedAppliedIds } from "./data";
import { planSync, sanitizeIds } from "./sync-plan";

/**
 * Centang "sudah dilamar".
 *
 * - Sumber utama: Worker + D1, supaya sinkron antar perangkat.
 * - Cache lokal: localStorage, supaya tetap jalan offline & instan.
 * - Tanpa NEXT_PUBLIC_SYNC_URL: murni localStorage, seperti versi sebelumnya.
 *
 * Konflik diselesaikan last-write-wins dengan timestamp server:
 * setiap kali perangkat ini berhasil sync, timestamp server yang dilihat
 * disimpan. Saat halaman dibuka lagi, kalau timestamp server berubah berarti
 * ada perangkat lain yang mencentang/membatalkan, jadi server yang menang.
 * Kalau timestamp tidak berubah, perubahan lokal yang belum terupload yang
 * dikirim. Ini membuat "batalkan centang" ikut menyeberang ke perangkat lain
 * (kalau selalu union, centang yang dihapus akan muncul lagi dari cache).
 */

const KEY = "lamaran.applied.v1";
const SEEDED_KEY = "lamaran.applied.seeded.v1";
const AUTH_KEY = "lamaran.sync.token";
const SEEN_KEY = "lamaran.sync.seen.v1";
const DEBOUNCE_MS = 800;

export const SYNC_URL = process.env.NEXT_PUBLIC_SYNC_URL?.replace(/\/+$/, "") || "";

export const syncEnabled = Boolean(SYNC_URL);

export type SyncState =
  | "idle"
  | "syncing"
  | "ok"
  | "error"
  | "offline"
  | "disabled";

// ------------------------------------------------------------ local storage

function readSet(key: string): Set<number> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((n): n is number => typeof n === "number" && Number.isInteger(n) && n > 0)
    );
  } catch {
    return null;
  }
}

function readApplied(): Set<number> {
  return readSet(KEY) ?? new Set();
}

function writeApplied(ids: Set<number>): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...ids]));
    return true;
  } catch {
    return false;
  }
}

function readStr(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeStr(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* abaikan */
  }
}

function deviceId(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Macintosh/.test(ua)) return "mac";
  if (/Windows/.test(ua)) return "windows";
  return "web";
}

// ------------------------------------------------------------ worker calls

type Remote = { ids: number[]; updatedAt: string | null };

async function pull(token: string): Promise<Remote> {
  const res = await fetch(`${SYNC_URL}/applied`, {
    headers: { "X-Auth": token },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { ids?: unknown; updatedAt?: unknown };
  const ids = Array.isArray(data.ids) ? sanitizeIds(data.ids) : [];
  return { ids, updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : null };
}

async function push(ids: number[], token: string): Promise<string | null> {
  const res = await fetch(`${SYNC_URL}/applied`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth": token },
    body: JSON.stringify({ ids, device: deviceId() }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { updatedAt?: unknown };
  return typeof data.updatedAt === "string" ? data.updatedAt : null;
}

// ------------------------------------------------------------ hook

export function useApplied() {
  const [applied, setApplied] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [persisted, setPersisted] = useState(true);
  const [sync, setSync] = useState<SyncState>(syncEnabled ? "idle" : "disabled");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);

  const timer = useRef<number | null>(null);

  /** Kirim daftar lokal ke server dan catat timestamp barunya. */
  const flush = useCallback(async (ids: Set<number>, token: string) => {
    setSync("syncing");
    try {
      const at = await push([...ids], token);
      if (at) writeStr(SEEN_KEY, at);
      setLastSync(new Date().toISOString());
      setSync("ok");
    } catch {
      // Centang lokal tetap aman; dicoba lagi saat online / perubahan berikutnya.
      setSync(navigator.onLine ? "error" : "offline");
    }
  }, []);

  // Boot: seed sekali, lalu rekonsiliasi dengan server kalau tersambung.
  useEffect(() => {
    let cancelled = false;
    const token = readStr(AUTH_KEY);
    setHasToken(Boolean(token));

    async function boot() {
      let base = readSet(KEY) ?? new Set<number>();

      // Seed 12 lowongan email batch pertama, sekali saja per perangkat.
      if (!readStr(SEEDED_KEY)) {
        for (const id of seedAppliedIds) base.add(id);
        writeApplied(base);
        writeStr(SEEDED_KEY, "1");
      }

      if (syncEnabled && token) {
        setSync(navigator.onLine ? "syncing" : "offline");
        try {
          const remote = await pull(token);
          if (cancelled) return;

          const plan = planSync([...base], remote.ids, remote.updatedAt, readStr(SEEN_KEY));

          if (plan.action === "take-server") {
            base = new Set(plan.ids);
          }
          writeApplied(base);
          if (remote.updatedAt) writeStr(SEEN_KEY, remote.updatedAt);

          setApplied(base);
          setLoaded(true);
          setLastSync(new Date().toISOString());

          if (plan.action === "push-local") {
            if (navigator.onLine) await flush(base, token);
            else setSync("offline");
          } else {
            setSync("ok");
          }
          return;
        } catch {
          if (!cancelled) {
            setApplied(base);
            setLoaded(true);
            setSync(navigator.onLine ? "error" : "offline");
          }
          return;
        }
      }

      if (cancelled) return;
      setApplied(base);
      setLoaded(true);
    }

    void boot();

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setApplied(readApplied());
    };
    const onOnline = () => {
      if (!syncEnabled || !readStr(AUTH_KEY)) {
        setSync(syncEnabled ? "idle" : "disabled");
        return;
      }
      void flush(readApplied(), readStr(AUTH_KEY));
    };
    const onOffline = () => setSync("offline");

    window.addEventListener("storage", onStorage);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [flush]);

  // Tulis cache lokal tiap perubahan.
  useEffect(() => {
    if (!loaded) return;
    setPersisted(writeApplied(applied));
  }, [applied, loaded]);

  // Upload tertunda: debounce supaya centang beruntun tidak jadi banyak request.
  useEffect(() => {
    if (!loaded || !syncEnabled || !hasToken) return;
    const token = readStr(AUTH_KEY);
    if (!token) return;

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void flush(applied, token);
    }, DEBOUNCE_MS);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [applied, loaded, hasToken, flush]);

  const toggle = useCallback((id: number) => {
    setApplied((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const markAll = useCallback((ids: number[]) => {
    setApplied((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setApplied(new Set()), []);

  /** Simpan passphrase lalu langsung rekonsiliasi. Passphrase salah -> false. */
  const connect = useCallback(async (value: string) => {
    if (typeof window === "undefined") return false;
    const token = value.trim();
    if (!token) return false;
    setSync("syncing");
    try {
      const remote = await pull(token);
      window.localStorage.setItem(AUTH_KEY, token);
      setHasToken(true);

      const plan = planSync([...readApplied()], remote.ids, remote.updatedAt, readStr(SEEN_KEY));
      const base = new Set(plan.ids);

      writeApplied(base);
      setApplied(base);
      if (remote.updatedAt) writeStr(SEEN_KEY, remote.updatedAt);
      setLastSync(new Date().toISOString());

      if (plan.action === "push-local") await flush(base, token);
      else setSync("ok");
      return true;
    } catch {
      setSync("error");
      return false;
    }
  }, [flush]);

  /** Putuskan sinkron di perangkat ini. Data di server tidak dihapus. */
  const disconnect = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(AUTH_KEY);
      // Hapus juga timestamp supaya Passage ulang tidak salah anggap server berubah.
      window.localStorage.removeItem(SEEN_KEY);
    } catch {
      /* abaikan */
    }
    setHasToken(false);
    setSync(syncEnabled ? "idle" : "disabled");
  }, []);

  return {
    applied,
    loaded,
    persisted,
    toggle,
    markAll,
    clear,
    sync,
    lastSync,
    hasToken,
    connect,
    disconnect,
  };
}
