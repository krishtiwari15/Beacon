// CareerCopilotService — a persistent, context-aware career advisor, not a
// generic chatbot. Every reply is grounded in the student's saved profile,
// current roadmap progress, and saved opportunities, plus recent
// conversation history for continuity.

import { askAI } from "@/lib/ai";
import type { Profile } from "@/lib/profile";
import type { Roadmap } from "@/lib/roadmap";
import { roadmapProgress } from "@/lib/roadmap";

export type ChatMessage = { role: "user" | "assistant"; content: string; at: string };

// Keep the prompt bounded — only the most recent exchanges are needed for
// conversational continuity, not the entire history.
const MAX_HISTORY_MESSAGES = 12;

type SavedOpportunitySummary = { title: string; organization: string | null; status: string };

function buildContext(
  profile: Partial<Profile> | null,
  roadmap: Roadmap | null,
  savedOpportunities: SavedOpportunitySummary[],
): string {
  const parts: string[] = [];

  if (profile) {
    parts.push(
      `PROFILE:\nEducation: ${profile.education ?? "—"}\nSkills: ${(profile.skills ?? []).join(", ") || "—"}\nInterests: ${profile.interests ?? "—"}\nCareer goal: ${profile.career_goal ?? "—"}`,
    );
  } else {
    parts.push("PROFILE: not saved yet — you can suggest they fill in the Profile tab for better advice.");
  }

  if (roadmap) {
    const progress = roadmapProgress(roadmap);
    const currentStage = roadmap.stages.find((s) => s.tasks.some((t) => !t.done)) ?? roadmap.stages.at(-1);
    parts.push(
      `ROADMAP: Working toward "${roadmap.career_title}", ${progress}% complete. Current stage: "${currentStage?.title ?? "—"}".`,
    );
  } else {
    parts.push("ROADMAP: none yet — you can suggest the Career Discovery quiz if they seem unsure of their path.");
  }

  if (savedOpportunities.length > 0) {
    const list = savedOpportunities
      .slice(0, 15)
      .map((o) => `${o.title} at ${o.organization ?? "—"} (${o.status})`)
      .join("; ");
    parts.push(`SAVED OPPORTUNITIES: ${list}`);
  } else {
    parts.push("SAVED OPPORTUNITIES: none yet.");
  }

  return parts.join("\n\n");
}

export async function replyAsCopilot(
  userMessage: string,
  history: ChatMessage[],
  profile: Partial<Profile> | null,
  roadmap: Roadmap | null,
  savedOpportunities: SavedOpportunitySummary[],
): Promise<{ reply?: string; error?: string }> {
  const context = buildContext(profile, roadmap, savedOpportunities);
  const recentHistory = history
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => `${m.role === "user" ? "Student" : "You"}: ${m.content}`)
    .join("\n");

  const prompt = `You are Beacon's Career Copilot — a persistent, context-aware career advisor for a
student career platform, not a generic chatbot. Always ground your advice in
the student's actual saved data below; don't invent facts about them, and say
so plainly if you don't have enough information yet. Be direct, specific, and
actionable — favor concrete next steps over generic encouragement.

STUDENT CONTEXT:
${context}

${recentHistory ? `RECENT CONVERSATION:\n${recentHistory}\n` : ""}
STUDENT'S NEW MESSAGE: ${userMessage}

Respond with ONLY a valid JSON object, no markdown, no extra text, in exactly
this format:
{
  "reply": "<your advisor response as plain text, may include short lists using hyphens>"
}`;

  const result = (await askAI(prompt)) as { reply?: string; error?: string };
  return result;
}
