"use client";

import { TABS, type TabId } from "@/app/page";

const DESCRIPTIONS: Partial<Record<TabId, string>> = {
  discover: "Browse real, indexed opportunities with a Match score (how well it fits you), a Trust score (how verifiable the listing is), and a Quality score — all explained, never a black box.",
  jobs: "Roles posted directly by real employers on Beacon. Apply here, or switch to \"For Employers\" on the same tab to post a job yourself, manage applicants, and get AI candidate ranking.",
  map: "See indexed opportunities laid out by region, with filters for remote-only or funded-only roles.",
  research: "Fellowships, grants, and research programs, plus a place to note your research interests and browse mentors in that space.",
  planner: "A calendar view of every upcoming application deadline across your saved opportunities, so nothing sneaks up on you.",
  tracker: "Your real application funnel — Applied → Assessment → Interview → Shortlisted → Offer — with per-category stats and optional rejection notes you can log yourself.",
  career: "Take a short quiz, get AI-suggested career paths with a compatibility explanation, then turn one into a stage-by-stage roadmap with checkable tasks.",
  simulation: "Live out a \"day in the life\" of a career through realistic scenario prompts, then get a scored breakdown at the end — not a personality test, a simulation.",
  projects: "AI-generated project ideas scoped to a skill or career goal you're trying to build proof for.",
  hackathon: "Enter a theme, your team's skills, and hours available — get project ideas, a build plan, a pitch structure, and a submission checklist.",
  startup: "Describe a startup idea and get an 8-stage founder roadmap: Idea → Validation → Market Research → Prototype → MVP → Users → Pitch → Funding.",
  skills: "See which real, indexed opportunities each of your skills unlocks, and which unlearned skills would unlock the most (Skill ROI) — a direct tally, never invented.",
  eligibility: "Paste your profile details against a specific opportunity's listed requirements and get an honest AI read on your eligibility.",
  resume: "Upload a resume against a specific opportunity and get AI feedback on how well it's targeted.",
  mentors: "A real directory of Beacon users who've registered as mentors, browsable by skill and industry.",
  team: "Post or browse real requests to team up for hackathons, projects, competitions, startups, or research.",
  community: "Ask questions and discuss careers with other real Beacon students, organized by category.",
  copilot: "Your persistent AI career advisor — it remembers your saved profile, roadmap progress, and saved opportunities across the whole conversation.",
  report: "A one-page, printable summary of your career progress: health score, roadmap progress, applications, top matches, and skill gaps.",
  weekly: "A weekly snapshot comparing your Career Health now vs. a week ago, plus what you accomplished and what's next.",
  profile: "Your saved skills, education, projects, and preferences — the foundation nearly every AI feature on Beacon reads from.",
};

export default function Guide({ onNavigate }: { onNavigate: (id: TabId) => void }) {
  const featureTabs = TABS.filter((t) => t.id !== "home" && t.id !== "guide" && DESCRIPTIONS[t.id]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Guide
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        A plain-language rundown of everything Beacon can do. Every feature below reads from your real, saved
        data — nothing is invented, and anything AI-generated says so.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {featureTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onNavigate(t.id)}
              className="flex w-full cursor-pointer items-start gap-3.5 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 text-left backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:shadow-md"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--heading)]">{t.label}</div>
                <p className="mt-0.5 text-sm text-[var(--text-muted)]">{DESCRIPTIONS[t.id]}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
