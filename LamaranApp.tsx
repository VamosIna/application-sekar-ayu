"use client";

import { useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import JobCard from "./JobCard";
import UpdateCalendar from "./UpdateCalendar";
import {
  DEFAULT_VIEW,
  formatDate,
  generatedAt,
  getView,
  jobs,
  jobsForView,
  lastUpdate,
  methodLabel,
  totals,
} from "@/lib/data";

export default function LamaranApp() {
  const [view, setView] = useState(DEFAULT_VIEW);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const current = getView(view);

  const list = useMemo(() => {
    const base = jobsForView(view);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((j) =>
      `${j.title} ${j.company} ${j.location} ${j.category} ${j.source_label}`
        .toLowerCase()
        .includes(q)
    );
  }, [view, query]);

  function handleSelect(id: string) {
    setView(id);
    setDrawerOpen(false);
  }

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="icon-btn"
          aria-label="Buka menu"
          onClick={() => setDrawerOpen(true)}
        >
          <span className="burger" />
        </button>
        <div className="topbar-title">
          <h1>Sekar Ayu Herdyningrum</h1>
          <div className="sub">
            {jobs.length} lowongan &middot; {totals.email} via email &middot; {totals.portal} via
            portal
            {totals.new ? ` · ${totals.new} baru` : ""}
          </div>
        </div>
        <input
          className="search"
          type="search"
          placeholder="Cari posisi / perusahaan / kota"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cari lowongan"
        />
      </header>

      <div className="layout">
        <Sidebar
          view={view}
          onSelect={handleSelect}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        <main className="main">
          <details className="history-card" open>
            <summary>
              Riwayat update
              {lastUpdate ? ` · terakhir ${formatDate(lastUpdate.date)}` : ""}
            </summary>
            <UpdateCalendar />
          </details>

          <div className="view-head">
            <h2>
              {current ? methodLabel(current.method) : ""}
              {current && current.category ? ` · ${current.label}` : ""}
            </h2>
            <span className="view-count">{list.length} lowongan</span>
          </div>

          {list.map((job, i) => (
            <JobCard key={job.db_id} job={job} index={i + 1} />
          ))}

          {list.length === 0 && <div className="empty">Tidak ada lowongan yang cocok.</div>}

          <footer className="foot">
            Daftar lamaran Sekar Ayu Herdyningrum &middot; update terakhir{" "}
            {formatDate(generatedAt)}
          </footer>
        </main>
      </div>

      {drawerOpen && <div className="scrim" onClick={() => setDrawerOpen(false)} />}
    </div>
  );
}
