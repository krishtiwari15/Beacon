// RecruiterMatchingService — ranks the students who have actually APPLIED
// to a job against that job's requirements, with a per-candidate
// explanation. Deliberately scoped to real applicants only, never a blind
// search across the whole student base (see 023_employer_portal.sql's
// consent-by-application RLS policy) — this mirrors the batched-AI-scoring
// pattern already proven in opportunityMatching.ts.

import { askAI } from "@/lib/ai";
import type { Job } from "@/lib/employer";
import type { Profile } from "@/lib/profile";

const BATCH_SIZE = 30;

export type CandidateMatch = { student_user_id: string; score: number; explanation: string };

export type Applicant = {
  student_user_id: string;
  profile: Partial<Profile> | null;
};

function jobToText(job: Job): string {
  const lines = [
    `Title: ${job.title}`,
    `Type: ${job.type}`,
    job.eligibility && `Eligibility: ${job.eligibility}`,
    job.experience_level && `Experience level: ${job.experience_level}`,
    job.required_skills.length && `Required skills: ${job.required_skills.join(", ")}`,
    job.preferred_skills.length && `Preferred skills: ${job.preferred_skills.join(", ")}`,
    job.work_mode && `Work mode: ${job.work_mode}`,
    job.location && `Location: ${job.location}`,
    `Description: ${job.description}`,
  ].filter(Boolean);
  return lines.join("\n");
}

function candidateToText(a: Applicant): string {
  const p = a.profile;
  if (!p) return `id: ${a.student_user_id}\n(no profile data on file)`;
  const lines = [
    `id: ${a.student_user_id}`,
    p.education && `Education: ${p.education}`,
    p.skills?.length && `Skills: ${p.skills.join(", ")}`,
    p.projects?.length && `Projects: ${p.projects.join("; ")}`,
    p.career_goal && `Career goal: ${p.career_goal}`,
    p.work_mode && `Preferred work mode: ${p.work_mode}`,
    p.location && `Location: ${p.location}`,
  ].filter(Boolean);
  return lines.join("\n");
}

async function scoreBatch(job: Job, batch: Applicant[]): Promise<{ matches: CandidateMatch[]; error?: string }> {
  const prompt = `You are a recruiting assistant ranking real job applicants against a job's stated requirements. Use ONLY the information given — never invent experience, credentials, or skills a candidate did not list.

JOB REQUIREMENTS:
${jobToText(job)}

CANDIDATES (each applied to this job):
${batch.map(candidateToText).join("\n---\n")}

For EVERY candidate, estimate a fit score from 0 to 100 based on how well their
listed skills/projects/education align with the job's stated requirements, and
write a one-sentence, specific explanation referencing what they actually
listed (not generic praise). Respond with ONLY a valid JSON object, no
markdown, no extra text, in exactly this format:
{
  "matches": [
    {"student_user_id": "<id>", "score": <integer 0-100>, "explanation": "<one sentence>"}
  ]
}
Include every candidate id from the list exactly once.`;

  const result = (await askAI(prompt)) as { matches?: CandidateMatch[]; error?: string };
  if (result.error || !result.matches) {
    return { matches: [], error: result.error ?? "AI returned no matches." };
  }

  const validIds = new Set(batch.map((a) => a.student_user_id));
  const matches = result.matches.filter(
    (m) => validIds.has(m.student_user_id) && Number.isFinite(m.score) && m.score >= 0 && m.score <= 100 && typeof m.explanation === "string",
  );
  return { matches };
}

export async function computeCandidateMatches(
  job: Job,
  applicants: Applicant[],
): Promise<{ matches: CandidateMatch[]; error?: string }> {
  if (applicants.length === 0) return { matches: [] };

  const batches: Applicant[][] = [];
  for (let i = 0; i < applicants.length; i += BATCH_SIZE) {
    batches.push(applicants.slice(i, i + BATCH_SIZE));
  }

  const allMatches: CandidateMatch[] = [];
  let firstError: string | undefined;

  for (const batch of batches) {
    const { matches, error } = await scoreBatch(job, batch);
    allMatches.push(...matches);
    if (error && !firstError) firstError = error;
  }

  if (allMatches.length === 0 && firstError) {
    return { matches: [], error: firstError };
  }
  return { matches: allMatches };
}
