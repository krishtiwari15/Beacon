// ApplicationAnalysisService — turns already-computed, real funnel/category
// statistics into plain-language insights. The AI never sees raw
// applications or invents numbers — it only rephrases stats it's handed,
// and is explicitly told to flag when a category has too little data to
// draw a conclusion from, rather than asserting a pattern anyway.

import { askAI } from "@/lib/ai";

export type CategoryStat = { category: string; applied: number; interviewRate: number };

export type AnalyticsInput = {
  applications: number;
  assessments: number;
  interviews: number;
  shortlisted: number;
  offers: number;
  rejections: number;
  categoryStats: CategoryStat[];
  rejectionReasons: string[];
};

export type AnalyticsInsights = { insights?: string[]; error?: string };

export async function generateAnalyticsInsights(stats: AnalyticsInput): Promise<AnalyticsInsights> {
  const prompt = `You are analyzing a student's REAL application funnel data for a career
platform. Do not invent any numbers — only reference the stats given below.
If a category has fewer than 3 applications, explicitly say the sample size
is too small to draw a real conclusion rather than stating a pattern anyway.
Never claim to know WHY something happened unless the data implies it
directly (e.g. a stage-specific drop-off) or the student's own logged
rejection reasons say so. If rejectionReasons has entries, look for a
recurring theme across them and note it as a possible pattern (not a
certainty) with an explicit confidence qualifier ("possible", "may
suggest") — never state Beacon knows the exact reason unless the student's
own text makes it unambiguous.

STATS (real, computed from the student's actual tracked applications):
${JSON.stringify(stats)}

Generate 2-4 short, plainly-labeled insights a student would find useful.
Respond with ONLY a valid JSON object, no markdown, no extra text, in
exactly this format:
{
  "insights": ["<short insight, may start with an emoji>", ...]
}`;

  return (await askAI(prompt)) as AnalyticsInsights;
}
