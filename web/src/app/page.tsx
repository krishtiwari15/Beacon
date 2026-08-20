"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import AuthScreen from "@/components/AuthScreen";
import Discover from "@/components/Discover";
import Tracker from "@/components/Tracker";
import Planner from "@/components/Planner";
import Eligibility from "@/components/Eligibility";
import ResumeAnalyzer from "@/components/ResumeAnalyzer";
import Copilot from "@/components/Copilot";

const TABS = [
  { id: "discover", label: "🔍 Discover" },
  { id: "tracker", label: "📋 My Applications" },
  { id: "eligibility", label: "🤖 AI Eligibility" },
  { id: "resume", label: "📄 Resume Analyzer" },
  { id: "copilot", label: "🧭 Career Copilot" },
  { id: "planner", label: "📅 Planner" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabId>("discover");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#0d0d0d]">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const name = (user.user_metadata?.name as string | undefined) || user.email || "Explorer";

  return (
    <div className="flex flex-1 flex-col bg-[#0d0d0d]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 pt-8">
        <div className="rounded border border-[#262626] border-t-4 border-t-[#f5c518] bg-[#131313] px-6 py-5">
          <h1 className="text-2xl font-black tracking-widest text-[#f5c518] uppercase">
            🛰️ Beacon
          </h1>
          <p className="mt-1 font-mono text-sm text-zinc-500">
            // Welcome back, {name.toUpperCase()}.
          </p>
        </div>
        <button
          onClick={() => createClient().auth.signOut()}
          className="rounded-md border border-zinc-600 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:border-[#f5c518] hover:text-[#f5c518]"
        >
          🚪 Log out
        </button>
      </header>

      <nav className="mx-auto mt-6 flex w-full max-w-5xl flex-wrap gap-2 px-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === t.id
                ? "bg-[#f5c518] text-black"
                : "border border-[#2a2a2a] text-zinc-300 hover:border-[#f5c518] hover:text-[#f5c518]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "discover" && <Discover user={user} />}
      {tab === "tracker" && <Tracker user={user} />}
      {tab === "eligibility" && <Eligibility />}
      {tab === "resume" && <ResumeAnalyzer />}
      {tab === "copilot" && <Copilot user={user} />}
      {tab === "planner" && <Planner />}
    </div>
  );
}
