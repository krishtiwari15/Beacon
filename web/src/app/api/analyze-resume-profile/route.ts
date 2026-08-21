import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeResumeForProfile } from "@/lib/services/resumeAnalysis";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("resume");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing resume file." }, { status: 400 });
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

  const result = await analyzeResumeForProfile(resumeText.slice(0, 6000));
  return NextResponse.json(result);
}
