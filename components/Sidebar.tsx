"use client";

import { emailViews, portalViews, totals } from "@/lib/data";
import type { JobMethod, View } from "@/lib/types";

interface SidebarProps {
  view: string;
  onSelect: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

interface GroupProps {
  title: string;
  total: number;
  items: View[];
  tone: JobMethod;
  view: string;
  onSelect: (id: string) => void;
}

function Group({ title, total, items, tone, view, onSelect }: GroupProps) {
  return (
    <div className={`group ${tone}`}>
      <div className="group-head">
        <span>{title}</span>
        <span className="tot">{total}</span>
      </div>
      <ul className="nav-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              className={`nav-btn ${tone} ${view === item.id ? "active" : ""}`}
              onClick={() => onSelect(item.id)}
            >
              <span>{item.label}</span>
              <span className="cnt">{item.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Sidebar({ view, onSelect, open, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-head">
        <h2>Daftar Lamaran</h2>
        <button className="close-btn" onClick={onClose} aria-label="Tutup menu">
          &times;
        </button>
      </div>
      <Group
        title="Via Email"
        total={totals.email}
        items={emailViews}
        tone="email"
        view={view}
        onSelect={onSelect}
      />
      <Group
        title="Via Portal"
        total={totals.portal}
        items={portalViews}
        tone="portal"
        view={view}
        onSelect={onSelect}
      />
    </aside>
  );
}
