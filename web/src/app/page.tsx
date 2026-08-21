"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Compass,
  ClipboardList,
  Sparkles,
  FileText,
  MessagesSquare,
  CalendarClock,
  UserCircle,
  Route,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Hero from "@/components/Hero";
import Discover from "@/components/Discover";
import Tracker from "@/components/Tracker";
import Planner from "@/components/Planner";
import Eligibility from "@/components/Eligibility";
import ResumeAnalyzer from "@/components/ResumeAnalyzer";
import Copilot from "@/components/Copilot";
import Profile from "@/components/Profile";
import Career from "@/components/Career";

const TABS = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "tracker", label: "My Applications", icon: ClipboardList },
  { id: "career", label: "Career & Roadmap", icon: Route },
  { id: "eligibility", label: "AI Eligibility", icon: Sparkles },
  { id: "resume", label: "Resume Analyzer", icon: FileText },
  { id: "copilot", label: "Career Copilot", icon: MessagesSquare },
  { id: "planner", label: "Planner", icon: CalendarClock },
  { id: "profile", label: "Profile", icon: UserCircle },
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
  const initial = name.trim().charAt(0).toUpperCase() || "B";

  return (
    <div className="dashboard-bg relative flex min-h-screen flex-1 flex-col md:flex-row">

      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] backdrop-blur-md md:flex">
        <div className="border-b border-[var(--border)] px-5 py-6">
          <span className="font-serif text-lg font-semibold tracking-tight text-[var(--heading)]">Beacon</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={`flex cursor-pointer items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                  tab === t.id
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "border border-transparent text-[var(--text-muted)] hover:border-[var(--border)] hover:bg-black/[0.02] hover:text-[var(--text)]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border)] p-3">
          <div className="flex items-center gap-2.5 px-1 py-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white">
              {initial}
            </span>
            <span className="truncate text-xs text-[var(--text-muted)]">{name}</span>
          </div>
          <button
            onClick={() => createClient().auth.signOut()}
            className="mt-2 flex w-full cursor-pointer items-center gap-2 rounded-[11px] border border-[var(--border)] px-3 py-2 text-left text-sm text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--text)]"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile header + horizontal nav */}
      <div className="flex flex-col border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-semibold text-white">
              {initial}
            </span>
            <span className="font-serif text-base font-semibold tracking-tight text-[var(--heading)]">Beacon</span>
          </div>
          <button
            onClick={() => createClient().auth.signOut()}
            className="flex cursor-pointer items-center gap-1.5 rounded-[11px] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--text)]"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
            Log out
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={`flex cursor-pointer items-center gap-1.5 rounded-[11px] px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                  tab === t.id
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      <main className="relative flex-1">
        {tab === "discover" && <Discover user={user} />}
        {tab === "tracker" && <Tracker user={user} />}
        {tab === "career" && <Career user={user} />}
        {tab === "eligibility" && <Eligibility user={user} />}
        {tab === "resume" && <ResumeAnalyzer user={user} />}
        {tab === "copilot" && <Copilot user={user} />}
        {tab === "planner" && <Planner />}
        {tab === "profile" && <Profile user={user} />}
      </main>
    </div>
  );
}
