import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { replyAsCopilot, type ChatMessage } from "@/lib/services/careerCopilot";
import type { Profile } from "@/lib/profile";
import type { Roadmap } from "@/lib/roadmap";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data } = await supabase
    .from("ai_conversations")
    .select("messages")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ messages: (data?.messages as ChatMessage[]) ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { message } = (await req.json()) as { message?: string };
  if (!message?.trim()) return NextResponse.json({ error: "Message is empty." }, { status: 400 });

  const [{ data: convoRow }, { data: profile }, { data: roadmap }, { data: saved }] = await Promise.all([
    supabase.from("ai_conversations").select("messages").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("roadmaps").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("saved_opportunities")
      .select("status, opportunity:opportunities(title, organization)")
      .eq("user_id", user.id),
  ]);

  const history = ((convoRow?.messages as ChatMessage[]) ?? []).slice();

  const savedSummaries = (saved ?? []).map((r) => {
    const opp = r.opportunity as unknown as { title: string; organization: string | null };
    return { title: opp?.title ?? "Untitled", organization: opp?.organization ?? null, status: r.status as string };
  });

  const { reply, error } = await replyAsCopilot(
    message.trim(),
    history,
    profile as Profile | null,
    (roadmap as Roadmap | null) ?? null,
    savedSummaries,
  );

  if (error || !reply) {
    return NextResponse.json({ error: error ?? "The Copilot couldn't respond. Try again." }, { status: 502 });
  }

  const now = new Date().toISOString();
  const nextMessages: ChatMessage[] = [
    ...history,
    { role: "user", content: message.trim(), at: now },
    { role: "assistant", content: reply, at: now },
  ];

  await supabase
    .from("ai_conversations")
    .upsert({ user_id: user.id, messages: nextMessages, updated_at: now }, { onConflict: "user_id" });

  return NextResponse.json({ reply });
}
