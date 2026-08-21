"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Compass,
  ClipboardList,
  Sparkles,
  FileText,
  MessagesSquare,
  CalendarClock,
  UserCircle,
  Route,
  Network,
  Globe2,
  Users,
  Hammer,
  FlaskConical,
  Microscope,
  Trophy,
  UsersRound,
  Rocket,
  MessageCircle,
  FileBarChart,
  CalendarCheck2,
  LogOut,
  Menu,
  X,
  Briefcase,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Hero from "@/components/Hero";
import DashboardHome from "@/components/DashboardHome";
import Discover from "@/components/Discover";
import Tracker from "@/components/Tracker";
import Planner from "@/components/Planner";
import Eligibility from "@/components/Eligibility";
import ResumeAnalyzer from "@/components/ResumeAnalyzer";
import Copilot from "@/components/Copilot";
import Profile from "@/components/Profile";
import Career from "@/components/Career";
import Skills from "@/components/Skills";
import GlobalMap from "@/components/GlobalMap";
import Mentors from "@/components/Mentors";
import Projects from "@/components/Projects";
import CareerSimulation from "@/components/CareerSimulation";
import ResearchHub from "@/components/ResearchHub";
import HackathonCopilot from "@/components/HackathonCopilot";
import TeamFinder from "@/components/TeamFinder";
import StartupHub from "@/components/StartupHub";
import Community from "@/components/Community";
import CareerReport from "@/components/CareerReport";
import WeeklyReview from "@/components/WeeklyReview";
import DirectJobs from "@/components/DirectJobs";

// Flat tab list (single source of truth for TabId), then grouped separately
// for nav display (§19: "avoid overcrowding, use dropdowns or grouped
// sections where necessary") instead of one flat 12-item list.
const TABS = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "jobs", label: "Direct Jobs", icon: Briefcase },
  { id: "map", label: "Global Map", icon: Globe2 },
  { id: "research", label: "Research", icon: Microscope },
  { id: "planner", label: "Planner", icon: CalendarClock },
  { id: "tracker", label: "My Applications", icon: ClipboardList },
  { id: "career", label: "Career & Roadmap", icon: Route },
  { id: "simulation", label: "Career Simulation", icon: FlaskConical },
  { id: "projects", label: "Project Generator", icon: Hammer },
  { id: "hackathon", label: "Hackathon Copilot", icon: Trophy },
  { id: "startup", label: "Startup Hub", icon: Rocket },
  { id: "skills", label: "Skill Graph", icon: Network },
  { id: "eligibility", label: "AI Eligibility", icon: Sparkles },
  { id: "resume", label: "Resume Analyzer", icon: FileText },
  { id: "mentors", label: "Mentors", icon: Users },
  { id: "team", label: "Find Teammates", icon: UsersRound },
  { id: "community", label: "Community", icon: MessageCircle },
  { id: "copilot", label: "Career Copilot", icon: MessagesSquare },
  { id: "report", label: "Career Report", icon: FileBarChart },
  { id: "weekly", label: "Weekly Review", icon: CalendarCheck2 },
  { id: "profile", label: "Profile", icon: UserCircle },
] as const;

type TabId = (typeof TABS)[number]["id"];

const NAV_GROUPS: { label: string | null; ids: TabId[] }[] = [
  { label: null, ids: ["home"] },
  { label: "Opportunities", ids: ["discover", "jobs", "map", "research", "planner", "tracker"] },
  { label: "Career", ids: ["career", "simulation", "projects", "hackathon", "startup", "skills", "eligibility", "resume"] },
  { label: "Connect", ids: ["mentors", "team", "community"] },
  { label: "AI & You", ids: ["copilot", "report", "weekly", "profile"] },
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabId>("home");
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

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

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label ?? `g${gi}`} className={gi > 0 ? "mt-3" : undefined}>
              {group.label && (
                <div className="px-3 pb-1 text-[10px] font-semibold tracking-widest text-[var(--text-muted)] uppercase">
                  {group.label}
                </div>
              )}
              {group.ids.map((id) => {
                const t = TABS.find((x) => x.id === id)!;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    aria-current={tab === t.id ? "page" : undefined}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
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
            </div>
          ))}
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

      {/* Mobile header: current tab + hamburger menu (was a 13-item
          horizontal scroll strip — replaced with a grouped slide-in drawer
          so mobile isn't showing every feature at once). */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-semibold text-white">
            {initial}
          </span>
          <span className="text-sm font-semibold text-[var(--text)]">
            {TABS.find((t) => t.id === tab)?.label ?? "Beacon"}
          </span>
        </div>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)]"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      {/* Mobile nav drawer */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-30 transition-opacity duration-300 md:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-[var(--text)]/40 backdrop-blur-sm" />
      </div>
      <div
        className={`fixed top-0 right-0 bottom-0 z-30 w-[82%] max-w-sm bg-[var(--surface-solid)] shadow-2xl backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-5">
            <span className="font-serif text-lg font-semibold tracking-tight text-[var(--heading)]">Beacon</span>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--text)] hover:bg-black/5"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {NAV_GROUPS.map((group, gi) => (
              <div key={group.label ?? `mg${gi}`} className={gi > 0 ? "mt-3" : undefined}>
                {group.label && (
                  <div className="px-3 pb-1 text-[10px] font-semibold tracking-widest text-[var(--text-muted)] uppercase">
                    {group.label}
                  </div>
                )}
                {group.ids.map((id) => {
                  const t = TABS.find((x) => x.id === id)!;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTab(t.id);
                        setMenuOpen(false);
                      }}
                      aria-current={tab === t.id ? "page" : undefined}
                      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                        tab === t.id
                          ? "bg-[var(--accent)] text-white shadow-sm"
                          : "border border-transparent text-[var(--text-muted)] hover:bg-black/[0.02] hover:text-[var(--text)]"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            ))}
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
        </div>
      </div>

      <main className="relative flex-1">
        {tab === "home" && <DashboardHome user={user} />}
        {tab === "discover" && <Discover user={user} />}
        {tab === "jobs" && <DirectJobs user={user} />}
        {tab === "map" && <GlobalMap />}
        {tab === "research" && <ResearchHub user={user} />}
        {tab === "tracker" && <Tracker user={user} />}
        {tab === "career" && <Career user={user} />}
        {tab === "simulation" && <CareerSimulation user={user} />}
        {tab === "projects" && <Projects user={user} />}
        {tab === "hackathon" && <HackathonCopilot />}
        {tab === "startup" && <StartupHub user={user} />}
        {tab === "skills" && <Skills user={user} />}
        {tab === "eligibility" && <Eligibility user={user} />}
        {tab === "resume" && <ResumeAnalyzer user={user} />}
        {tab === "mentors" && <Mentors user={user} />}
        {tab === "team" && <TeamFinder user={user} />}
        {tab === "community" && <Community user={user} />}
        {tab === "copilot" && <Copilot user={user} />}
        {tab === "report" && <CareerReport user={user} />}
        {tab === "weekly" && <WeeklyReview user={user} />}
        {tab === "planner" && <Planner />}
        {tab === "profile" && <Profile user={user} />}
      </main>
    </div>
  );
}
