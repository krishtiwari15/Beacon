// StartupCopilotService — generates an 8-stage "Founder Mode" plan for a
// student's startup idea. AI-generated planning content only, never claims
// about real investors, accelerators, or funding sources.

import { askAI } from "@/lib/ai";

export type StartupStage = { title: string; tasks: string[] };

export async function generateStartupPlan(ideaDescription: string): Promise<{ stages?: StartupStage[]; error?: string }> {
  const prompt = `You are a startup mentor helping a student turn an idea into a real plan.

IDEA: ${ideaDescription}

Generate a plan across exactly these 8 stages, in this order: Idea, Problem
Validation, Market Research, Prototype, MVP, Users, Pitch, Funding. Each
stage needs 3 to 5 short, concrete, actionable tasks specific to this idea.
Do not name specific real investors, accelerators, or funding programs —
keep funding advice general (e.g. "research accelerators relevant to your
industry") since Beacon has no real database of those. Respond with ONLY a
valid JSON object, no markdown, no extra text, in exactly this format:
{
  "stages": [
    {"title": "Idea", "tasks": ["<task>", ...]},
    {"title": "Problem Validation", "tasks": ["<task>", ...]},
    {"title": "Market Research", "tasks": ["<task>", ...]},
    {"title": "Prototype", "tasks": ["<task>", ...]},
    {"title": "MVP", "tasks": ["<task>", ...]},
    {"title": "Users", "tasks": ["<task>", ...]},
    {"title": "Pitch", "tasks": ["<task>", ...]},
    {"title": "Funding", "tasks": ["<task>", ...]}
  ]
}`;

  return (await askAI(prompt)) as { stages?: StartupStage[]; error?: string };
}
