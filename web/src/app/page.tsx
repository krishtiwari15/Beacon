"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import Hero from "@/components/Hero";
import Discover from "@/components/Discover";
import Tracker from "@/components/Tracker";
import Planner from "@/components/Planner";
import Eligibility from "@/components/Eligibility";
import ResumeAnalyzer from "@/components/ResumeAnalyzer";
import Copilot from "@/components/Copilot";

const TABS = [
  { id: "discover", label: "Discover" },
  { id: "tracker", label: "My Applications" },
  { id: "eligibility", label: "AI Eligibility" },
  { id: "resume", label: "Resume Analyzer" },
  { id: "copilot", label: "Career Copilot" },
  { id: "planner", label: "Planner" },
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
      <div className="flex flex-1 items-center justify-center bg-[#080A19]">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          Loading Beacon…
        </div>
      </div>
    );
  }

  if (!user) {
    return <Hero />;
  }

  const name = (user.user_metadata?.name as string | undefined) || user.email || "Explorer";

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#080A19] md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.08] bg-[rgba(17,16,15,0.35)] backdrop-blur-[20px] md:flex">
        <div className="border-b border-white/[0.08] px-5 py-6">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 256 256" fill="none">
              <path
                d="M 256 256 L 178 256 C 150.386 256 128 233.614 128 206 L 128 256 L 0 256 L 0 192 C 0 156.654 28.654 128 64 128 C 99.346 128 128 156.654 128 192 L 128 128 L 256 128 Z M 78 0 C 105.614 0 128 22.386 128 50 L 128 0 L 256 0 L 256 64 C 256 99.346 227.346 128 192 128 C 156.654 128 128 99.346 128 64 L 128 128 L 0 128 L 0 0 Z"
                fill="white"
              />
            </svg>
            <span className="text-lg font-[450] tracking-[-0.02em] text-white">Beacon</span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`cursor-pointer rounded-[11px] px-3 py-2.5 text-left text-sm font-[450] transition-all duration-200 ${
                tab === t.id
                  ? "bg-white/10 text-white"
                  : "border border-transparent text-white/50 hover:border-white/[0.08] hover:text-white/90"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/[0.08] p-3">
          <div className="truncate px-3 py-1 text-[11px] text-white/40">{name.toUpperCase()}</div>
          <button
            onClick={() => createClient().auth.signOut()}
            className="w-full cursor-pointer rounded-[11px] border border-white/15 px-3 py-2 text-left text-sm text-white/70 transition-colors duration-200 hover:border-white/40 hover:text-white"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile header + horizontal nav */}
      <div className="flex flex-col border-b border-white/[0.08] bg-[rgba(17,16,15,0.35)] backdrop-blur-[20px] md:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-base font-[450] tracking-[-0.02em] text-white">Beacon</span>
          <button
            onClick={() => createClient().auth.signOut()}
            className="cursor-pointer rounded-[11px] border border-white/15 px-3 py-1.5 text-xs text-white/70 transition-colors duration-200 hover:border-white/40 hover:text-white"
          >
            Log out
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`cursor-pointer rounded-[11px] px-3 py-1.5 text-sm font-[450] whitespace-nowrap transition-colors duration-200 ${
                tab === t.id
                  ? "bg-white/10 text-white"
                  : "border border-white/[0.08] text-white/60 hover:border-white/30 hover:text-white"
              }`}
            >
              {t.label}
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
