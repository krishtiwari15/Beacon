// OpportunityQualityService — assesses the intrinsic value of an
// opportunity (not personalized to any student, unlike Match Score).
// Computed ONCE per opportunity at collection time and cached on the row,
// so it's one AI call per opportunity ever, never repeated per viewer.

import { askAI } from "@/lib/ai";

const BATCH_SIZE = 30;

export type QualityResult = { title: string; score: number; summary: string; reasons: string[] };

type QualityInput = {
  title: string;
  type: string | null;
  category: string | null;
  organization: string | null;
  eligibility: string | null;
  stipend: string | null;
  difficulty: string | null;
  work_mode: string | null;
  tags: string[];
};

async function scoreBatch(batch: QualityInput[]): Promise<QualityResult[]> {
  const prompt = `You are an opportunity-quality evaluator for a student career platform.

Assess the intrinsic VALUE of each opportunity below — not how well it fits
any particular student, just how good the opportunity itself looks based
ONLY on the fields given (role relevance, compensation, skill-building
potential implied by type/tags, flexibility). Do not invent specifics like
"mentorship program" or "career progression" unless the data implies it —
if the available fields are too sparse to judge something, say so plainly
rather than guessing.

OPPORTUNITIES (JSON list, matched by exact title):
${JSON.stringify(batch)}

Respond with ONLY a valid JSON object, no markdown, no extra text, in
exactly this format:
{
  "results": [
    {
      "title": "<must exactly match an input title>",
      "score": <integer 0-100>,
      "summary": "<one sentence>",
      "reasons": ["<short qualified reason, e.g. 'Compensation disclosed and above typical for this category'>", ...]
    }
  ]
}
Include every opportunity exactly once.`;

  const result = (await askAI(prompt)) as { results?: QualityResult[]; error?: string };
  if (result.error || !result.results) return [];
  const validTitles = new Set(batch.map((b) => b.title));
  return result.results.filter((r) => validTitles.has(r.title) && Number.isFinite(r.score));
}

export async function computeQualityScores(inputs: QualityInput[]): Promise<QualityResult[]> {
  if (inputs.length === 0) return [];
  const batches: QualityInput[][] = [];
  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    batches.push(inputs.slice(i, i + BATCH_SIZE));
  }
  const all: QualityResult[] = [];
  for (const batch of batches) {
    all.push(...(await scoreBatch(batch)));
  }
  return all;
}
