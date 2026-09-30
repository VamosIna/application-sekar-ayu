"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "lamaran.applied.v1";

function read(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((n): n is number => typeof n === "number"));
    }
  } catch {
    /* ignore */
  }
  return new Set();
}

function write(ids: Set<number>): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...ids]));
    // verifikasi benar-benar tersimpan
    return window.localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Daftar lowongan yang sudah dilamar, disimpan persisten di localStorage
 * browser (per-perangkat). Setiap perubahan langsung ditulis & diverifikasi.
 */
export function useApplied() {
  const [applied, setApplied] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [persisted, setPersisted] = useState(true);

  // muat sekali dari storage + sinkron antar-tab
  useEffect(() => {
    setApplied(read());
    setLoaded(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setApplied(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // tulis setiap kali berubah
  useEffect(() => {
    if (!loaded) return;
    setPersisted(write(applied));
  }, [applied, loaded]);

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
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const clear = useCallback(() => setApplied(new Set()), []);

  return { applied, loaded, persisted, toggle, markAll, clear };
}
