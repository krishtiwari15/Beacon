import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { REPORTS_TO_AUTO_HIDE } from "@/lib/community";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { post_id, reason } = (await req.json()) as { post_id?: number; reason?: string };
  if (!post_id) return NextResponse.json({ error: "Missing post_id." }, { status: 400 });

  const { error } = await supabase
    .from("community_reports")
    .insert({ post_id, reporter_id: user.id, reason: reason || null });

  if (error) {
    // Unique constraint violation = already reported by this user; treat as success.
    if (error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Counting reports across all users needs to bypass the reporter-only RLS
  // policy on community_reports — the service role is used only for this
  // aggregate count, never exposed to the client.
  const admin = createAdminClient();
  const { count } = await admin
    .from("community_reports")
    .select("id", { count: "exact", head: true })
    .eq("post_id", post_id);

  if ((count ?? 0) >= REPORTS_TO_AUTO_HIDE) {
    await admin.from("community_posts").update({ hidden: true }).eq("id", post_id);
  }

  return NextResponse.json({ ok: true });
}
