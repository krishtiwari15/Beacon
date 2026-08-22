import type { Profile } from "@/lib/profile";

export type OnboardingStatus =
  | "not_started"
  | "resume_uploaded"
  | "profile_generated"
  | "opportunities_shown"
  | "tutorial_completed"
  | "completed";

// Deterministic, zero-AI profile-strength score -- same "never invent this
// number" principle as computeTrustScore/computeCareerHealth elsewhere in
// the app. Each real, filled field contributes a fixed share; nothing here
// is an AI guess.
const FIELDS: { key: keyof Profile; weight: number; label: string }[] = [
  { key: "education", weight: 15, label: "Education" },
  { key: "skills", weight: 20, label: "Skills" },
  { key: "projects", weight: 15, label: "Projects" },
  { key: "career_goal", weight: 15, label: "Career goal" },
  { key: "location", weight: 10, label: "Preferred location" },
  { key: "work_mode", weight: 10, label: "Work preferences" },
  { key: "interests", weight: 15, label: "Interests" },
];

export function computeProfileStrength(profile: Partial<Profile> | null): {
  score: number;
  complete: string[];
  missing: string[];
} {
  const complete: string[] = [];
  const missing: string[] = [];
  let score = 0;

  for (const f of FIELDS) {
    const value = profile?.[f.key];
    const filled = Array.isArray(value) ? value.length > 0 : !!value;
    if (filled) {
      score += f.weight;
      complete.push(f.label);
    } else {
      missing.push(f.label);
    }
  }

  return { score: Math.min(100, score), complete, missing };
}
