// CareerSimulationService — generates a short, realistic "try this career"
// day-by-day experience, and afterward assesses compatibility from the
// student's own written responses. Explicitly exploratory, not a
// psychological or scientific assessment (§7 requirement).

import { askAI } from "@/lib/ai";

export type SimDay = { day: number; title: string; task: string };

export async function generateSimulation(careerTitle: string): Promise<{ days?: SimDay[]; error?: string }> {
  const prompt = `You are designing a short "try this career" simulation for a student
exploring whether ${careerTitle} might suit them.

Generate exactly 5 days of realistic, concrete tasks a beginner in this
career might actually do — grounded in real day-to-day work, not generic
platitudes. Respond with ONLY a valid JSON object, no markdown, no extra
text, in exactly this format:
{
  "days": [
    {"day": 1, "title": "<short title>", "task": "<one to two sentence realistic task description, framed as an instruction to the student>"},
    ... (5 total)
  ]
}`;

  return (await askAI(prompt)) as { days?: SimDay[]; error?: string };
}

export type SimResult = {
  compatibility_score?: number;
  strengths?: string[];
  challenges?: string[];
  recommendation?: string;
  error?: string;
};

export async function assessSimulation(
  careerTitle: string,
  days: SimDay[],
  responses: string[],
): Promise<SimResult> {
  const transcript = days
    .map((d, i) => `Day ${d.day} — ${d.title}: ${d.task}\nStudent's response: ${responses[i] || "(skipped)"}`)
    .join("\n\n");

  const prompt = `You are assessing a student's 5-day "try this career" simulation for
${careerTitle}. This is an EXPLORATORY self-reflection exercise, not a
scientific or psychological assessment — frame everything as a rough,
encouraging estimate, never as a certainty or diagnosis.

TRANSCRIPT:
${transcript}

Respond with ONLY a valid JSON object, no markdown, no extra text, in
exactly this format:
{
  "compatibility_score": <integer 0-100>,
  "strengths": ["<short strength shown in their responses>", ...],
  "challenges": ["<short area that seemed harder for them>", ...],
  "recommendation": "<one to two sentence encouraging, exploratory recommendation for what to do next>"
}`;

  return (await askAI(prompt)) as SimResult;
}
