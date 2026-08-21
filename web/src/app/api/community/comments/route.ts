import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_COMMENTS_PER_HOUR } from "@/lib/community";

// Server-enforced comment rate limit and validation — mirrors
// /api/community/posts. The client insert used to hit
// community_comments directly, which only RLS gated (auth.uid() = user_id)
// with no throttle or length check, so anyone calling the Supabase REST
// endpoint directly could spam unlimited comments.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { post_id, body } = (await req.json()) as { post_id?: number; body?: string };
  if (!post_id || typeof post_id !== "number") {
    return NextResponse.json({ error: "Invalid post." }, { status: 400 });
  }
  if (!body?.trim() || body.trim().length < 2) {
    return NextResponse.json({ error: "Comment is too short." }, { status: 400 });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("community_comments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= MAX_COMMENTS_PER_HOUR) {
    return NextResponse.json(
      { error: `You've hit the commenting limit (${MAX_COMMENTS_PER_HOUR}/hour). Try again later.` },
      { status: 429 },
    );
  }

  const { data, error } = await supabase
    .from("community_comments")
    .insert({ post_id, user_id: user.id, body: body.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}
