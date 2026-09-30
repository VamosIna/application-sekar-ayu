import raw from "@/data/lamaran.json";
import type { HistoryEntry, Job, JobMethod, Payload, View } from "./types";

const data = raw as unknown as Payload;

export const jobs: Job[] = data.jobs;
export const categories: string[] = data.categories;
export const cv = data.cv;
export const totals = data.totals;
export const minScore = data.min_score;
export const generatedAt = data.generated_at;
export const history: HistoryEntry[] = [...(data.history ?? [])].sort((a, b) =>
  a.date < b.date ? -1 : 1
);
export const lastUpdate: HistoryEntry | undefined = history[history.length - 1];

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function viewsFor(method: JobMethod): View[] {
  const methodJobs = jobs.filter((j) => j.method === method);
  const list: View[] = [
    { id: `${method}-all`, method, label: "Semua", category: null, count: methodJobs.length },
  ];
  for (const category of categories) {
    const count = methodJobs.filter((j) => j.category === category).length;
    if (count > 0) {
      list.push({
        id: `${method}-${slug(category)}`,
        method,
        label: category,
        category,
        count,
      });
    }
  }
  return list;
}

export const emailViews: View[] = viewsFor("email");
export const portalViews: View[] = viewsFor("portal");
export const allViews: View[] = [...emailViews, ...portalViews];

export const DEFAULT_VIEW = emailViews[0]?.id ?? "email-all";

export function getView(id: string): View | undefined {
  return allViews.find((v) => v.id === id);
}

export function jobsForView(id: string): Job[] {
  const view = getView(id);
  if (!view) return [];
  return jobs.filter(
    (j) => j.method === view.method && (view.category === null || j.category === view.category)
  );
}

export function methodLabel(method: JobMethod): string {
  return method === "email" ? "Via Email" : "Via Portal";
}

export interface Option {
  value: string;
  label: string;
  count: number;
}

export const locationOptions: Option[] = (() => {
  const m = new Map<string, number>();
  jobs.forEach((j) => {
    const loc = (j.location || "").trim();
    if (loc) m.set(loc, (m.get(loc) || 0) + 1);
  });
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => ({ value, label: value, count }));
})();

export function categoryOptions(method: "all" | JobMethod): Option[] {
  const base = method === "all" ? jobs : jobs.filter((j) => j.method === method);
  const m = new Map<string, number>();
  base.forEach((j) => m.set(j.category, (m.get(j.category) || 0) + 1));
  return categories
    .filter((c) => m.has(c))
    .map((c) => ({ value: c, label: c, count: m.get(c) as number }));
}

export function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}
