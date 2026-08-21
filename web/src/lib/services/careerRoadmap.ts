// CareerRoadmapService — generates a staged, actionable roadmap for a
// chosen career path.

import { askAI } from "@/lib/ai";

export type RoadmapStage = { title: string; tasks: string[] };

export async function generateRoadmap(
  careerTitle: string,
): Promise<{ stages?: RoadmapStage[]; error?: string }> {
  const prompt = `You are a career roadmap generator for a student career platform.

CAREER GOAL: ${careerTitle}

Generate a 6-stage roadmap to get a beginner student to this career, in this
exact stage order: Foundation, Core Skills, Projects, Experience, Advanced,
Career. Each stage needs 3 to 6 short, concrete, actionable tasks. Respond
with ONLY a valid JSON object, no markdown, no extra text, in exactly this
format:
{
  "stages": [
    {"title": "Foundation", "tasks": ["<short task>", ...]},
    {"title": "Core Skills", "tasks": ["<short task>", ...]},
    {"title": "Projects", "tasks": ["<short task>", ...]},
    {"title": "Experience", "tasks": ["<short task>", ...]},
    {"title": "Advanced", "tasks": ["<short task>", ...]},
    {"title": "Career", "tasks": ["<short task>", ...]}
  ]
}`;

  const result = (await askAI(prompt)) as { stages?: RoadmapStage[]; error?: string };
  return result;
}
