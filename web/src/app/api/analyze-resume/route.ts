import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askAI } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const form = await req.formData();
  const opportunityId = form.get("opportunity_id");
  const file = form.get("resume");

  if (!opportunityId || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing opportunity_id or resume file." }, { status: 400 });
  }

  const { data: opp, error } = await supabase
    .from("opportunities")
    .select("title, organization, type, eligibility, tags")
    .eq("id", Number(opportunityId))
    .single();

  if (error || !opp) {
    return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  }

  const { default: pdfParse } = await import("pdf-parse");
  const buffer = Buffer.from(await file.arrayBuffer());
  let resumeText = "";
  try {
    const parsed = await pdfParse(buffer);
    resumeText = parsed.text ?? "";
  } catch {
    resumeText = "";
  }

  if (!resumeText || resumeText.trim().length < 30) {
    return NextResponse.json({
      error: "Could not read enough text from the resume. Is it a text-based PDF (not a scan)?",
    });
  }

  resumeText = resumeText.slice(0, 6000);

  const prompt = `You are a resume reviewer for student opportunities.

OPPORTUNITY:
- Title: ${opp.title}
- Organization: ${opp.organization}
- Type: ${opp.type}
- Eligibility: ${opp.eligibility}
- Tags/skills wanted: ${opp.tags}

RESUME TEXT:
${resumeText}

Assess how well this resume matches the opportunity. Respond with ONLY a valid
JSON object, no markdown, no extra text, in exactly this format:
{
  "score": <integer 0-10>,
  "summary": "<one sentence overall assessment>",
  "strengths": ["short strength 1", "short strength 2"],
  "gaps": ["short gap 1", "short gap 2"],
  "suggestions": ["short actionable suggestion 1", "short actionable suggestion 2"]
}`;

  const result = await askAI(prompt);
  return NextResponse.json(result);
}
