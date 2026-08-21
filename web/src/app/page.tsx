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
  { id: "discover", icon: "🔍", label: "Discover" },
  { id: "tracker", icon: "📋", label: "My Applications" },
  { id: "eligibility", icon: "🤖", label: "AI Eligibility" },
  { id: "resume", icon: "📄", label: "Resume Analyzer" },
  { id: "copilot", icon: "🧭", label: "Career Copilot" },
  { id: "planner", icon: "📅", label: "Planner" },
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
      <div className="flex flex-1 items-center justify-center bg-[#0a0a0a]">
        <div className="flex items-center gap-2 font-mono text-sm text-zinc-500">
          <span className="glow-pulse h-2 w-2 rounded-full bg-[#f5c518]" />
          Booting Beacon…
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const name = (user.user_metadata?.name as string | undefined) || user.email || "Explorer";

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#0a0a0a] md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#262626] bg-[#0f0f0f] md:flex">
        <div className="border-b border-[#262626] px-5 py-6">
          <h1 className="glow-text font-display text-xl font-black tracking-widest text-[#f5c518] uppercase">
            🛰️ Beacon
          </h1>
          <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
            <span className="glow-pulse h-1.5 w-1.5 rounded-full bg-emerald-400" />
            SYSTEM ONLINE
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`cursor-pointer rounded-md px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                tab === t.id
                  ? "glow-border bg-[#f5c518]/10 text-[#f5c518]"
                  : "border border-transparent text-zinc-400 hover:border-[#2a2a2a] hover:text-zinc-100"
              }`}
            >
              <span className="mr-2">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-[#262626] p-3">
          <div className="truncate px-3 py-1 font-mono text-[11px] text-zinc-500">{name.toUpperCase()}</div>
          <button
            onClick={() => createClient().auth.signOut()}
            className="w-full cursor-pointer rounded-md border border-zinc-700 px-3 py-2 text-left text-sm text-zinc-300 transition-colors duration-200 hover:border-[#f5c518] hover:text-[#f5c518]"
          >
            🚪 Log out
          </button>
        </div>
      </aside>

      {/* Mobile header + horizontal nav */}
      <div className="flex flex-col border-b border-[#262626] bg-[#0f0f0f] md:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="glow-text font-display text-lg font-black tracking-widest text-[#f5c518] uppercase">
            🛰️ Beacon
          </h1>
          <button
            onClick={() => createClient().auth.signOut()}
            className="cursor-pointer rounded-md border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 transition-colors duration-200 hover:border-[#f5c518] hover:text-[#f5c518]"
          >
            🚪 Log out
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                tab === t.id
                  ? "glow-border bg-[#f5c518]/10 text-[#f5c518]"
                  : "border border-[#2a2a2a] text-zinc-300 hover:border-[#f5c518] hover:text-[#f5c518]"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="flex-1">
        {tab === "discover" && <Discover user={user} />}
        {tab === "tracker" && <Tracker user={user} />}
        {tab === "eligibility" && <Eligibility />}
        {tab === "resume" && <ResumeAnalyzer />}
        {tab === "copilot" && <Copilot user={user} />}
        {tab === "planner" && <Planner />}
      </main>
    </div>
  );
}
