import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askAI } from "@/lib/ai";
import type { Opportunity } from "@/lib/opportunities";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json();
  const { education = "", skills = "", interests = "", goals = "" } = body;

  const { data: opportunities, error } = await supabase.from("opportunities").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const compact = (opportunities as Opportunity[]).map((o) => ({
    id: o.id,
    title: o.title,
    type: o.type,
    eligibility: o.eligibility,
    tags: o.tags,
  }));

  const prompt = `You are a career advisor matching a student to opportunities.

STUDENT PROFILE:
- Education: ${education}
- Skills: ${skills}
- Interests: ${interests}
- Goals: ${goals}

AVAILABLE OPPORTUNITIES (JSON list):
${JSON.stringify(compact)}

Pick the 5 best-fit opportunities for this student. Respond with ONLY a valid
JSON object, no markdown, no extra text, in exactly this format:
{
  "matches": [
    {"id": <opportunity id>, "match": <integer 0-100>, "reason": "<one short sentence why it fits>"}
  ]
}
Order matches from best to worst fit. Only include opportunities from the list above.`;

  const result = (await askAI(prompt)) as { matches?: { id: number; match: number; reason: string }[]; error?: string };

  if (result.error || !result.matches) {
    return NextResponse.json(result);
  }

  const byId = new Map((opportunities as Opportunity[]).map((o) => [o.id, o]));
  const hydrated = result.matches
    .map((m) => {
      const opp = byId.get(m.id);
      if (!opp) return null;
      return { ...opp, match: m.match, reason: m.reason };
    })
    .filter(Boolean);

  return NextResponse.json({ matches: hydrated });
}
