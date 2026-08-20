// gemini.ts — server-only helper for calling the Gemini API. Mirrors the
// prompts used by the original backend/ai.py so AI behavior stays the same.

const MODEL_NAME = "gemini-flash-latest";

function friendlyError(message: string): { error: string } {
  const msg = message.toLowerCase();
  if (msg.includes("429") || msg.includes("quota") || msg.includes("rate")) {
    return { error: "🕐 The AI is busy right now (free-tier limit hit). Please wait about a minute, then try again." };
  }
  if (msg.includes("api key") || msg.includes("api_key") || msg.includes("permission")) {
    return { error: "🔑 There's a problem with the AI configuration. Please check the API key setup." };
  }
  return { error: "⚠️ The AI couldn't complete this request. Please try again in a moment." };
}

function extractJson(text: string): unknown {
  let t = text.trim();
  if (t.startsWith("```")) {
    const parts = t.split("```");
    t = parts[1] ?? t;
    if (t.startsWith("json")) t = t.slice(4);
    t = t.trim();
  }
  return JSON.parse(t);
}

export async function askGemini(prompt: string): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "AI is not configured. Set GEMINI_API_KEY in your environment." };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      return friendlyError(`${res.status} ${body}`);
    }

    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return friendlyError("empty response");
    return extractJson(text);
  } catch (e) {
    return friendlyError(e instanceof Error ? e.message : String(e));
  }
}
