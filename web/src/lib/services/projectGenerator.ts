// ProjectGenerationService — for a chosen career and current skill level,
// suggests concrete portfolio projects across three difficulty tiers.

import { askAI } from "@/lib/ai";

export type ProjectIdea = {
  title: string;
  objective: string;
  skills_required: string[];
  dataset_suggestions: string[];
  tech_stack: string[];
  roadmap: string[];
  portfolio_advice: string;
};

export type ProjectTiers = {
  beginner?: ProjectIdea[];
  intermediate?: ProjectIdea[];
  advanced?: ProjectIdea[];
  error?: string;
};

export async function generateProjects(
  careerTitle: string,
  currentSkills: string[],
): Promise<ProjectTiers> {
  const prompt = `You are a project-recommendation engine for a student career platform.

CAREER GOAL: ${careerTitle}
STUDENT'S CURRENT SKILLS: ${currentSkills.length ? currentSkills.join(", ") : "(none saved yet — assume a beginner)"}

Recommend portfolio projects across three difficulty tiers (2 projects per tier)
that build toward this career, taking the student's current skill level into
account. If a project doesn't involve a dataset (e.g. a pure engineering
project), return an empty array for dataset_suggestions rather than inventing
one. Respond with ONLY a valid JSON object, no markdown, no extra text, in
exactly this format:
{
  "beginner": [
    {
      "title": "<project title>",
      "objective": "<one sentence objective>",
      "skills_required": ["<skill>", ...],
      "dataset_suggestions": ["<general type of dataset/source, not a fake URL>", ...],
      "tech_stack": ["<tool/language>", ...],
      "roadmap": ["<short step>", ...],
      "portfolio_advice": "<one sentence on how to present this project well>"
    }
  ],
  "intermediate": [ /* same shape, 2 items */ ],
  "advanced": [ /* same shape, 2 items */ ]
}`;

  return (await askAI(prompt)) as ProjectTiers;
}
