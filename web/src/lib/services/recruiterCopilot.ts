// RecruiterCopilotService — a persistent, context-aware assistant for a
// single recruiter, hard-scoped to their own company's jobs and applicants.
// Same shape as CareerCopilotService (student-facing), never mixes in data
// from any other company.

import { askAI } from "@/lib/ai";

export type ChatMessage = { role: "user" | "assistant"; content: string; at: string };

const MAX_HISTORY_MESSAGES = 12;

type JobSummary = { id: number; title: string; status: string; applicantCount: number };

function buildContext(companyName: string, jobs: JobSummary[]): string {
  if (jobs.length === 0) {
    return `COMPANY: ${companyName}\nJOBS: no job postings yet.`;
  }
  const list = jobs.map((j) => `#${j.id} "${j.title}" (${j.status}, ${j.applicantCount} applicant${j.applicantCount === 1 ? "" : "s"})`).join("; ");
  return `COMPANY: ${companyName}\nJOBS: ${list}`;
}

export async function replyAsRecruiterCopilot(
  userMessage: string,
  history: ChatMessage[],
  companyName: string,
  jobs: JobSummary[],
): Promise<{ reply?: string; error?: string }> {
  const context = buildContext(companyName, jobs);
  const recentHistory = history
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => `${m.role === "user" ? "Recruiter" : "You"}: ${m.content}`)
    .join("\n");

  const prompt = `You are Beacon's Recruiter Copilot — an assistant for a recruiter hiring on the
Beacon student career platform. You only have access to this recruiter's own
company's job postings and applicant counts below — you have NO access to any
other company's data, and no access to Beacon's full student database beyond
what's summarized here. Never invent applicant names, numbers, or skills you
don't have. If the recruiter asks for something you don't have data for (e.g.
"find me 20 students with Python"), explain that candidate details are only
visible per-job once students have applied, and point them to the Candidates
tab on a specific job posting instead of fabricating a list.

RECRUITER'S DATA:
${context}

${recentHistory ? `RECENT CONVERSATION:\n${recentHistory}\n` : ""}
RECRUITER'S NEW MESSAGE: ${userMessage}

Respond with ONLY a valid JSON object, no markdown, no extra text, in exactly
this format:
{
  "reply": "<your response as plain text, may include short lists using hyphens>"
}`;

  const result = (await askAI(prompt)) as { reply?: string; error?: string };
  return result;
}
