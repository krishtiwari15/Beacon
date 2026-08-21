// ResumeAnalysisService — general (not opportunity-specific) resume
// parsing: extracts structured profile data and a profile-strength score.
// Kept separate from the existing opportunity-vs-resume comparison in
// /api/analyze-resume (that flow already works and isn't touched here).

import { askAI } from "@/lib/ai";

export type ResumeProfileAnalysis = {
  profile_strength?: number;
  education?: string;
  skills?: string[];
  projects?: string[];
  experience?: string[];
  certifications?: string[];
  achievements?: string[];
  career_interests?: string[];
  strengths?: string[];
  missing_skills?: string[];
  recommendations?: string[];
  error?: string;
};

export async function analyzeResumeForProfile(resumeText: string): Promise<ResumeProfileAnalysis> {
  const prompt = `You are a resume intelligence engine for a student career platform.

RESUME TEXT:
${resumeText}

Extract structured profile data from this resume and assess overall profile
strength. Never invent information that isn't supported by the resume text —
if a section is genuinely absent, return an empty array/string for it. Respond
with ONLY a valid JSON object, no markdown, no extra text, in exactly this
format:
{
  "profile_strength": <integer 0-100>,
  "education": "<short string, or empty if not found>",
  "skills": ["<skill>", ...],
  "projects": ["<short project description>", ...],
  "experience": ["<short experience description>", ...],
  "certifications": ["<certification>", ...],
  "achievements": ["<achievement>", ...],
  "career_interests": ["<inferred interest>", ...],
  "strengths": ["<short strength>", ...],
  "missing_skills": ["<skill that would strengthen this profile>", ...],
  "recommendations": ["<short actionable recommendation>", ...]
}`;

  return (await askAI(prompt)) as ResumeProfileAnalysis;
}
