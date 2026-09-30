export type JobMethod = "email" | "portal";

export interface DimensionScore {
  score: number;
  weight: number;
  label: string;
  note?: string;
}

export type Breakdown = Record<string, DimensionScore>;

export interface Job {
  db_id: number;
  method: JobMethod;
  category: string;
  title: string;
  company: string;
  location: string;
  score: number | null;
  source: string;
  source_label: string;
  url: string;
  posted_at: string;
  to: string;
  subject: string;
  subject_source: string;
  body: string;
  reasons: string[];
  gaps: string[];
  breakdown: Breakdown | null;
  first_seen?: string;
  updated_at?: string;
  is_new?: boolean;
}

export interface CvInfo {
  url: string;
  name: string;
}

export interface Totals {
  all: number;
  email: number;
  portal: number;
  new?: number;
}

export interface HistoryEntry {
  date: string;
  at: string;
  total: number | null;
  new: number;
  seeded?: boolean;
}

export interface Payload {
  generated_at: string;
  min_score: number;
  categories: string[];
  cv: CvInfo;
  totals: Totals;
  score_weights?: Record<string, number>;
  score_dimensions?: Record<string, string>;
  history: HistoryEntry[];
  jobs: Job[];
}

export interface View {
  id: string;
  method: JobMethod;
  label: string;
  category: string | null;
  count: number;
}
