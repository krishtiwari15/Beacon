import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeMatchScores } from "@/lib/services/opportunityMatching";
import type { Opportunity } from "@/lib/opportunities";
import type { Profile } from "@/lib/profile";

// GET returns cached match scores for the signed-in user (cheap DB read,
// no AI call — safe to call on every Discover/Tracker mount).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data, error } = await supabase
    .from("opportunity_matches")
    .select("opportunity_id, score")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scores: data ?? [] });
}

// POST (re)computes match scores via one AI call and upserts them —
// triggered explicitly by the user ("Refresh matches"), never automatically
// on every render.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const [{ data: profile }, { data: opportunities, error: oppsError }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("opportunities").select("*").order("deadline", { ascending: true, nullsFirst: false }),
  ]);

  if (oppsError) return NextResponse.json({ error: oppsError.message }, { status: 500 });

  const { scores, error } = await computeMatchScores(
    profile as Profile | null,
    (opportunities ?? []) as Opportunity[],
  );
  if (error) return NextResponse.json({ error }, { status: 502 });

  if (scores.length > 0) {
    const rows = scores.map((s) => ({
      user_id: user.id,
      opportunity_id: s.id,
      score: s.score,
      computed_at: new Date().toISOString(),
    }));
    const { error: upsertError } = await supabase
      .from("opportunity_matches")
      .upsert(rows, { onConflict: "user_id,opportunity_id" });
    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ scores });
}
