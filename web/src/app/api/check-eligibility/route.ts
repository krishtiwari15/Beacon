import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json();
  const { opportunity_id, age = "", education = "", country = "", cgpa = "", skills = "" } = body;

  const { data: opp, error } = await supabase
    .from("opportunities")
    .select("title, organization, type, eligibility, location")
    .eq("id", opportunity_id)
    .single();

  if (error || !opp) {
    return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  }

  const prompt = `You are an eligibility advisor for student opportunities.

STUDENT PROFILE:
- Age: ${age}
- Degree/Education: ${education}
- Country: ${country}
- CGPA/GPA: ${cgpa}
- Skills: ${skills}

OPPORTUNITY:
- Title: ${opp.title}
- Organization: ${opp.organization}
- Type: ${opp.type}
- Eligibility requirements: ${opp.eligibility}
- Location: ${opp.location}

Assess whether this student is eligible. Respond with ONLY a valid JSON object,
no markdown, no extra text, in exactly this format:
{
  "verdict": "Eligible" | "Partially Eligible" | "Not Eligible",
  "reasons": ["short reason 1", "short reason 2"],
  "suggestions": ["short actionable suggestion 1"]
}`;

  const result = await askGemini(prompt);
  return NextResponse.json(result);
}
