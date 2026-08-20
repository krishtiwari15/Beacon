// ai.ts — server-only helper for calling Groq (OpenAI-compatible chat
// completions API). Groq's free tier has much higher rate limits than
// Gemini's, which is why this replaced the original Gemini-based ai.py.

const MODEL_NAME = "openai/gpt-oss-120b";

function friendlyError(message: string): { error: string } {
  const msg = message.toLowerCase();
  if (msg.includes("429") || msg.includes("rate_limit") || msg.includes("rate limit")) {
    return { error: "🕐 The AI is busy right now (rate limit hit). Please wait a moment, then try again." };
  }
  if (msg.includes("api key") || msg.includes("api_key") || msg.includes("unauthorized") || msg.includes("permission")) {
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

export async function askAI(prompt: string): Promise<unknown> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { error: "AI is not configured. Set GROQ_API_KEY in your environment." };
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[ai] Groq request failed:", res.status, body);
      return friendlyError(`${res.status} ${body}`);
    }

    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (!text) {
      console.error("[ai] Groq response had no content:", JSON.stringify(data));
      return friendlyError("empty response");
    }
    try {
      return extractJson(text);
    } catch (parseErr) {
      console.error("[ai] Failed to parse Groq output as JSON:", text, parseErr);
      return friendlyError(parseErr instanceof Error ? parseErr.message : String(parseErr));
    }
  } catch (e) {
    console.error("[ai] Request to Groq threw:", e);
    return friendlyError(e instanceof Error ? e.message : String(e));
  }
}
