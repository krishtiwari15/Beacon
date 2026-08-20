export type Opportunity = {
  id: number;
  title: string;
  type: string | null;
  category: string | null;
  organization: string | null;
  location: string | null;
  eligibility: string | null;
  deadline: string | null; // YYYY-MM-DD
  source_url: string | null;
  tags: string[];
  stipend: string | null;
  difficulty: string | null;
  work_mode: string | null;
  logo_url: string | null;
};

export type SavedStatus = "saved" | "applied" | "interview" | "rejected" | "accepted";

export const STATUS_OPTIONS: SavedStatus[] = ["saved", "applied", "interview", "rejected", "accepted"];

export const STATUS_LABELS: Record<SavedStatus, string> = {
  saved: "📌 Saved",
  applied: "📨 Applied",
  interview: "🎤 Interview",
  rejected: "❌ Rejected",
  accepted: "✅ Accepted",
};

export const TYPE_COLORS: Record<string, string> = {
  internship: "#f5c518",
  scholarship: "#e0b020",
  fellowship: "#d4a017",
  hackathon: "#ffcc33",
  competition: "#e8b923",
  research: "#c9a227",
  remote_job: "#bfa030",
};

export const DIFF_COLORS: Record<string, string> = {
  Beginner: "#34c98a",
  Intermediate: "#f5c518",
  Advanced: "#ff6b4d",
};

export function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const d = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export function deadlineLabel(deadline: string | null): { text: string; className: string } {
  const d = daysUntil(deadline);
  if (d === null) return { text: "🗓️ Rolling / No deadline", className: "text-zinc-400" };
  if (d < 0) return { text: "⛔ Deadline passed", className: "text-red-400 font-semibold" };
  const label = d === 1 ? "1 day left" : `${d} days left`;
  if (d <= 7) return { text: `⏳ ${label}`, className: "text-red-400 font-semibold" };
  if (d <= 30) return { text: `⏳ ${label}`, className: "text-amber-400 font-semibold" };
  return { text: `⏳ ${label}`, className: "text-emerald-400 font-semibold" };
}

export function typeLabel(type: string | null): string {
  return (type ?? "opportunity").replace(/_/g, " ");
}
