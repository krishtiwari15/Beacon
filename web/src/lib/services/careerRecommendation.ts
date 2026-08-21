// CareerRecommendationService — turns career-discovery quiz answers (plus
// the student's saved profile, if any) into ranked career-path
// recommendations with compatibility scores.

import { askAI } from "@/lib/ai";
import type { Profile } from "@/lib/profile";

export type QuizAnswers = {
  interests: string;
  strengths: string;
  workingStyle: string;
  problemSolving: string;
  techInterest: string;
  businessInterest: string;
  researchInterest: string;
  lifestyle: string;
  goals: string;
};

export type CareerRecommendation = {
  title: string;
  compatibility: number;
  why: string;
  skills_required: string[];
  salary_range: string;
  education_requirements: string;
  beginner_roadmap: string;
  projects: string[];
  certifications: string[];
};

export async function recommendCareers(
  answers: QuizAnswers,
  profile: Partial<Profile> | null,
): Promise<{ careers?: CareerRecommendation[]; error?: string }> {
  const profileLine = profile
    ? `Education: ${profile.education ?? "—"} | Skills: ${(profile.skills ?? []).join(", ") || "—"}`
    : "(no saved profile)";

  const prompt = `You are a career discovery advisor for a student career platform.

STUDENT QUIZ ANSWERS:
- Interests / subjects they enjoy: ${answers.interests}
- Strengths: ${answers.strengths}
- Preferred working style (people vs. technical): ${answers.workingStyle}
- Problem-solving preference: ${answers.problemSolving}
- Technology interest: ${answers.techInterest}
- Business interest: ${answers.businessInterest}
- Research interest: ${answers.researchInterest}
- Desired lifestyle/work environment: ${answers.lifestyle}
- Career goals: ${answers.goals}

SAVED PROFILE (if any): ${profileLine}

Recommend 3 to 5 career paths ranked by compatibility. Never invent salary
figures with false precision — give an approximate range and note it varies
by region/experience. Respond with ONLY a valid JSON object, no markdown, no
extra text, in exactly this format:
{
  "careers": [
    {
      "title": "<career title>",
      "compatibility": <integer 0-100>,
      "why": "<one to two sentence explanation>",
      "skills_required": ["<skill>", ...],
      "salary_range": "<approximate range with a caveat that it varies>",
      "education_requirements": "<short string>",
      "beginner_roadmap": "<one sentence summary of the first steps>",
      "projects": ["<project idea>", ...],
      "certifications": ["<certification>", ...]
    }
  ]
}
Order from highest to lowest compatibility.`;

  const result = (await askAI(prompt)) as { careers?: CareerRecommendation[]; error?: string };
  return result;
}
