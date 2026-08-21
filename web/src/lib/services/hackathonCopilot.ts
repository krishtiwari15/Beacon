// HackathonCopilotService — generates a complete hackathon prep kit
// (ideas, team plan, hour-by-hour build schedule, pitch structure,
// submission checklist). All AI-generated planning content for the
// student's own use, not claims about any real external entity.

import { askAI } from "@/lib/ai";

export type HackathonKit = {
  ideas?: { title: string; description: string }[];
  team_plan?: { role: string; responsibility: string }[];
  build_plan?: { phase: string; hours: string; tasks: string[] }[];
  pitch?: {
    problem: string;
    solution: string;
    market: string;
    innovation: string;
    demo_flow: string;
    pitch_structure: string[];
  };
  submission_checklist?: string[];
  error?: string;
};

export async function generateHackathonKit(
  theme: string,
  teamSkills: string,
  hoursAvailable: number,
  difficulty: string,
): Promise<HackathonKit> {
  const prompt = `You are a Hackathon Copilot helping a student team prepare for a hackathon.

HACKATHON THEME: ${theme}
TEAM SKILLS: ${teamSkills || "(not specified)"}
TIME AVAILABLE: ${hoursAvailable} hours
DIFFICULTY LEVEL: ${difficulty}

Generate a complete prep kit. Respond with ONLY a valid JSON object, no
markdown, no extra text, in exactly this format:
{
  "ideas": [{"title": "<project idea title>", "description": "<one to two sentence description>"} , ...] (3 ideas),
  "team_plan": [{"role": "<role, e.g. Frontend>", "responsibility": "<short responsibility>"}, ...] (based on team skills given),
  "build_plan": [{"phase": "<phase name>", "hours": "<hour range, e.g. 'Hour 1-2'>", "tasks": ["<task>", ...]}, ...] (phases summing to roughly the time available),
  "pitch": {
    "problem": "<short problem statement>",
    "solution": "<short solution statement>",
    "market": "<short market/audience statement>",
    "innovation": "<what's novel about this approach>",
    "demo_flow": "<suggested order to demo the project>",
    "pitch_structure": ["<short pitch section>", ...]
  },
  "submission_checklist": ["<short checklist item>", ...]
}`;

  return (await askAI(prompt)) as HackathonKit;
}
