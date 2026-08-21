import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assessSimulation } from "@/lib/services/careerSimulation";
import type { SimDay } from "@/lib/services/careerSimulation";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { responses } = (await req.json()) as { responses?: string[] };
  if (!responses) return NextResponse.json({ error: "Missing responses." }, { status: 400 });

  const { data: sim } = await supabase.from("career_simulations").select("*").eq("user_id", user.id).maybeSingle();
  if (!sim) return NextResponse.json({ error: "No active simulation found." }, { status: 404 });

  const result = await assessSimulation(sim.career_title, sim.days as SimDay[], responses);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });

  const { data, error: dbError } = await supabase
    .from("career_simulations")
    .update({
      compatibility_score: result.compatibility_score,
      strengths: result.strengths,
      challenges: result.challenges,
      recommendation: result.recommendation,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ simulation: data });
}
