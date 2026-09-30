"use client";

import { useMemo, useState } from "react";
import { formatDate, history } from "@/lib/data";
import type { HistoryEntry } from "@/lib/types";

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parseDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return { y, m, d };
}

export default function UpdateCalendar() {
  const map = useMemo(() => {
    const m = new Map<string, HistoryEntry>();
    history.forEach((h) => m.set(h.date, h));
    return m;
  }, []);

  const latest = history[history.length - 1];
  const initial = latest
    ? parseDate(latest.date)
    : (() => {
        const n = new Date();
        return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
      })();

  const [month, setMonth] = useState({ y: initial.y, m: initial.m });
  const [selected, setSelected] = useState<string | null>(latest?.date ?? null);

  const firstWeekday = (new Date(month.y, month.m - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(month.y, month.m, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function shift(delta: number) {
    setMonth((v) => {
      const m = v.m + delta;
      if (m < 1) return { y: v.y - 1, m: 12 };
      if (m > 12) return { y: v.y + 1, m: 1 };
      return { y: v.y, m };
    });
  }

  function goTo(date: string) {
    setSelected(date);
    const p = parseDate(date);
    setMonth({ y: p.y, m: p.m });
  }

  const selectedEntry = selected ? map.get(selected) : undefined;

  return (
    <section className="calendar">
      <div className="cal-head">
        <button onClick={() => shift(-1)} aria-label="Bulan sebelumnya">
          &lsaquo;
        </button>
        <div className="cal-title">
          {MONTHS[month.m - 1]} {month.y}
        </div>
        <button onClick={() => shift(1)} aria-label="Bulan berikutnya">
          &rsaquo;
        </button>
      </div>

      <div className="cal-grid">
        {DAYS.map((d) => (
          <div key={d} className="cal-dow">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} className="cal-cell empty-cell" />;
          const key = `${month.y}-${pad(month.m)}-${pad(d)}`;
          const entry = map.get(key);
          return (
            <button
              key={key}
              className={`cal-cell ${entry ? "has-update" : ""} ${
                selected === key ? "selected" : ""
              }`}
              onClick={() => entry && goTo(key)}
              disabled={!entry}
            >
              <span>{d}</span>
              {entry ? <span className="dot" /> : null}
            </button>
          );
        })}
      </div>

      {selectedEntry ? (
        <div className="cal-detail">
          <b>{formatDate(selectedEntry.date)}</b>
          {selectedEntry.total != null ? <> &middot; {selectedEntry.total} lowongan</> : null}
          {selectedEntry.new ? <> &middot; {selectedEntry.new} baru</> : null}
        </div>
      ) : null}

      <ul className="cal-list">
        {[...history].reverse().map((h) => (
          <li key={h.date}>
            <button
              className={selected === h.date ? "active" : ""}
              onClick={() => goTo(h.date)}
            >
              <span>{formatDate(h.date)}</span>
              <span className="cal-meta">
                {h.total != null ? `${h.total} lowongan` : "data awal"}
                {h.new ? ` · ${h.new} baru` : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
