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
      <div className="flex flex-1 items-center justify-center bg-[var(--bg)]">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
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
    <div className="flex min-h-screen flex-1 flex-col bg-[var(--bg)] md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] backdrop-blur-md md:flex">
        <div className="border-b border-[var(--border)] px-5 py-6">
          <span className="text-lg font-semibold tracking-tight text-[var(--text)]">Beacon</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`cursor-pointer rounded-[11px] px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                tab === t.id
                  ? "bg-[var(--accent)] text-white"
                  : "border border-transparent text-[var(--text-muted)] hover:border-[var(--border)] hover:text-[var(--text)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] p-3">
          <div className="truncate px-3 py-1 text-[11px] text-[var(--text-muted)]">{name.toUpperCase()}</div>
          <button
            onClick={() => createClient().auth.signOut()}
            className="w-full cursor-pointer rounded-[11px] border border-[var(--border)] px-3 py-2 text-left text-sm text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--text)]"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile header + horizontal nav */}
      <div className="flex flex-col border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-base font-semibold tracking-tight text-[var(--text)]">Beacon</span>
          <button
            onClick={() => createClient().auth.signOut()}
            className="cursor-pointer rounded-[11px] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--text)]"
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
              className={`cursor-pointer rounded-[11px] px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                tab === t.id
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
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
