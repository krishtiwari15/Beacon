// OpportunityMatchingService — turns a student profile + a list of
// opportunities into per-opportunity match scores (0-100) via one AI call.
// Kept separate from any route/UI code so both /api/match-scores (bulk,
// cached) and /api/recommend (Copilot's top-5) can share the same prompt
// shape without duplicating it.

import { askAI } from "@/lib/ai";
import type { Opportunity } from "@/lib/opportunities";
import type { Profile } from "@/lib/profile";

// A single AI call reliably scores about this many opportunities before
// output quality/truncation risk goes up. If there are more open
// opportunities than this, only the soonest-deadline ones are scored.
const MAX_OPPORTUNITIES_PER_CALL = 60;

export type MatchScore = { id: number; score: number };

function profileToText(profile: Partial<Profile> | null): string {
  if (!profile) return "(no saved profile — use general best judgment)";
  const lines = [
    profile.education && `Education: ${profile.education}`,
    profile.skills?.length && `Skills: ${profile.skills.join(", ")}`,
    profile.interests && `Interests: ${profile.interests}`,
    profile.career_goal && `Career goal: ${profile.career_goal}`,
    profile.work_mode && `Preferred work mode: ${profile.work_mode}`,
    profile.location && `Location: ${profile.location}`,
    profile.country && `Country: ${profile.country}`,
    profile.cgpa && `CGPA/GPA: ${profile.cgpa}`,
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : "(no saved profile — use general best judgment)";
}

export async function computeMatchScores(
  profile: Partial<Profile> | null,
  opportunities: Opportunity[],
): Promise<{ scores: MatchScore[]; error?: string }> {
  if (opportunities.length === 0) return { scores: [] };

  const capped = opportunities.slice(0, MAX_OPPORTUNITIES_PER_CALL);
  const compact = capped.map((o) => ({
    id: o.id,
    title: o.title,
    type: o.type,
    eligibility: o.eligibility,
    tags: o.tags,
    difficulty: o.difficulty,
    work_mode: o.work_mode,
  }));

  const prompt = `You are an opportunity-matching engine for a student career platform.

STUDENT PROFILE:
${profileToText(profile)}

OPPORTUNITIES (JSON list):
${JSON.stringify(compact)}

For EVERY opportunity in the list, estimate how well it fits this student as a
match score from 0 to 100 (skills/interests/eligibility alignment). Respond
with ONLY a valid JSON object, no markdown, no extra text, in exactly this
format:
{
  "scores": [
    {"id": <opportunity id>, "score": <integer 0-100>}
  ]
}
Include every opportunity id from the list exactly once.`;

  const result = (await askAI(prompt)) as { scores?: MatchScore[]; error?: string };
  if (result.error || !result.scores) {
    return { scores: [], error: result.error ?? "AI returned no scores." };
  }

  const validIds = new Set(capped.map((o) => o.id));
  const scores = result.scores.filter(
    (s) => validIds.has(s.id) && Number.isFinite(s.score) && s.score >= 0 && s.score <= 100,
  );
  return { scores };
}
