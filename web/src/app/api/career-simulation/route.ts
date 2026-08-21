import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSimulation } from "@/lib/services/careerSimulation";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { career_title } = (await req.json()) as { career_title?: string };
  if (!career_title) return NextResponse.json({ error: "Missing career_title." }, { status: 400 });

  const { days, error } = await generateSimulation(career_title);
  if (error || !days) return NextResponse.json({ error: error ?? "Could not generate a simulation." }, { status: 502 });

  const { data, error: dbError } = await supabase
    .from("career_simulations")
    .upsert(
      {
        user_id: user.id,
        career_title,
        days,
        compatibility_score: null,
        strengths: null,
        challenges: null,
        recommendation: null,
        completed_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ simulation: data });
}
