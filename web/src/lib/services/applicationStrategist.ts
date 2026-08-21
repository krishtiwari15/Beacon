// ApplicationStrategistService — activated when a student clicks "Prepare
// My Application" on a specific opportunity. Grounds its advice in the
// student's real saved profile/projects and the opportunity's real fields;
// asked to explicitly flag anything it can't judge from the given data
// rather than inventing specifics (§29 data integrity).

import { askAI } from "@/lib/ai";
import type { Opportunity } from "@/lib/opportunities";
import type { Profile } from "@/lib/profile";

export type SkillAlignment = { skill: string; level: "Strong" | "Medium" | "Weak" };

export type StrategistResult = {
  readiness?: number;
  competition_estimate?: "Low" | "Medium" | "High";
  prep_weeks_estimate?: string;
  resume_recommendations?: string[];
  skill_alignment?: SkillAlignment[];
  project_selection?: string[];
  missing_evidence?: string[];
  strategy?: string;
  error?: string;
};

export async function prepareApplication(
  profile: Partial<Profile> | null,
  opportunity: Opportunity,
  matchedSkills: string[],
  gapSkills: string[],
): Promise<StrategistResult> {
  const profileText = profile
    ? `Education: ${profile.education ?? "—"}
Skills: ${(profile.skills ?? []).join(", ") || "—"}
Projects: ${(profile.projects ?? []).join(", ") || "(none saved)"}
Career goal: ${profile.career_goal ?? "—"}`
    : "(no saved profile)";

  const prompt = `You are Beacon's Application Strategist — you help a student prepare a strong
application for ONE specific opportunity, grounded only in their real saved
data below. Never invent projects, experience, or achievements they didn't
provide. If their saved profile has no projects, say so plainly in
project_selection rather than inventing any. competition_estimate is a rough
qualitative guess based on the opportunity's difficulty/type/organization —
label it clearly as an estimate, not real applicant data (Beacon has no
actual applicant volume data).

STUDENT:
${profileText}

OPPORTUNITY:
Title: ${opportunity.title}
Organization: ${opportunity.organization}
Type: ${opportunity.type}
Difficulty: ${opportunity.difficulty}
Eligibility: ${opportunity.eligibility}

SKILLS THE STUDENT ALREADY HAS THAT THIS OPPORTUNITY WANTS: ${matchedSkills.join(", ") || "(none)"}
SKILLS THIS OPPORTUNITY WANTS THAT THE STUDENT DOESN'T HAVE YET: ${gapSkills.join(", ") || "(none)"}

Respond with ONLY a valid JSON object, no markdown, no extra text, in
exactly this format:
{
  "readiness": <integer 0-100>,
  "competition_estimate": "Low" | "Medium" | "High",
  "prep_weeks_estimate": "<short string, e.g. '2-4 weeks'>",
  "resume_recommendations": ["<short actionable resume tip>", ...],
  "skill_alignment": [{"skill": "<skill>", "level": "Strong" | "Medium" | "Weak"}, ...],
  "project_selection": ["<which saved project to highlight and why, or a note that none are saved>"],
  "missing_evidence": ["<what proof/evidence the student currently lacks>", ...],
  "strategy": "<2-3 sentence personalized application strategy>"
}`;

  return (await askAI(prompt)) as StrategistResult;
}
