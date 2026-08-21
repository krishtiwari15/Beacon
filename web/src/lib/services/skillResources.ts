// SkillResourcesService — for a given skill, suggests learning resources,
// certifications, and project ideas. These are AI-generated suggestions
// (clearly presented as such in the UI), not fabricated as real listings —
// the opportunities shown alongside them are always real data pulled
// directly from the opportunities table by tag match.

import { askAI } from "@/lib/ai";

export type SkillResources = {
  resources?: string[];
  certifications?: string[];
  projects?: string[];
  error?: string;
};

export async function suggestSkillResources(skill: string): Promise<SkillResources> {
  const prompt = `You are a learning-resource advisor for a student career platform.

SKILL: ${skill}

Suggest how a student could learn and demonstrate this skill. Respond with
ONLY a valid JSON object, no markdown, no extra text, in exactly this format:
{
  "resources": ["<general type of course/resource, not a specific fake URL>", ...],
  "certifications": ["<well-known certification name if one genuinely exists for this skill, otherwise omit>", ...],
  "projects": ["<short project idea that demonstrates this skill>", ...]
}
Keep each list to at most 4 items. Do not invent specific course names, URLs, or providers you're not confident are real.`;

  return (await askAI(prompt)) as SkillResources;
}
