// SkillAssessmentService — generates a short, informal, unproctored quiz
// for a skill. Explicitly never framed as an official certification
// anywhere downstream — self-graded, self-reported, for the student's own
// reference only.

import { askAI } from "@/lib/ai";

export type Question = { question: string; options: string[]; correctIndex: number };

export async function generateAssessment(skill: string): Promise<{ questions?: Question[]; error?: string }> {
  const prompt = `You are writing a short, informal self-assessment quiz for the skill: ${skill}.

Generate exactly 5 multiple-choice questions testing practical, fundamental
knowledge of this skill, at a beginner-to-intermediate level. Respond with
ONLY a valid JSON object, no markdown, no extra text, in exactly this
format:
{
  "questions": [
    {"question": "<question text>", "options": ["<option A>", "<option B>", "<option C>", "<option D>"], "correctIndex": <integer 0-3>}
  ]
}
Exactly 5 questions, exactly 4 options each.`;

  return (await askAI(prompt)) as { questions?: Question[]; error?: string };
}
