// CareerHealthService — a deterministic (no AI) rollup of real, tracked
// signals into one score. Only includes dimensions Beacon can actually
// measure from real data — no invented "Experience" or "Interview Prep"
// numbers with nothing behind them.

import { Profile } from "@/lib/profile";
import { Roadmap, roadmapProgress } from "@/lib/roadmap";

export type HealthDimension = { label: string; score: number };
export type CareerHealth = { overall: number; dimensions: HealthDimension[]; drivingFactor: string };

function profileCompleteness(p: Profile | null): number {
  if (!p) return 0;
  const fields = [p.full_name, p.education, p.skills?.length ? "x" : "", p.interests, p.career_goal, p.location, p.work_mode, p.age, p.cgpa, p.country];
  const filled = fields.filter((f) => f && f.trim?.() !== "").length;
  return Math.round((filled / fields.length) * 100);
}

export function computeCareerHealth(
  profile: Profile | null,
  roadmap: Roadmap | null,
  appliedCount: number,
  interviewReachCount: number,
  hasMentorListing: boolean,
): CareerHealth {
  const dimensions: HealthDimension[] = [
    { label: "Skills", score: Math.min(100, (profile?.skills?.length ?? 0) * 13) },
    { label: "Projects", score: Math.min(100, (profile?.projects?.length ?? 0) * 25) },
    { label: "Profile Completeness", score: profileCompleteness(profile) },
    { label: "Applications", score: Math.min(100, appliedCount * 15) },
    { label: "Interview Success", score: appliedCount > 0 ? Math.round((interviewReachCount / appliedCount) * 100) : 0 },
    { label: "Roadmap Progress", score: roadmap ? roadmapProgress(roadmap) : 0 },
    { label: "Networking", score: hasMentorListing ? 100 : 0 },
  ];

  const overall = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length);
  const lowest = [...dimensions].sort((a, b) => a.score - b.score)[0];

  return { overall, dimensions, drivingFactor: lowest.label };
}
