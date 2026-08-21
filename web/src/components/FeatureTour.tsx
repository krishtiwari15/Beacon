"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { TABS, type TabId } from "@/lib/tabs";

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

const STEPS = TABS.filter((t) => DESCRIPTIONS[t.id]);

export default function FeatureTour({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: TabId) => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div onClick={onClose} className="absolute inset-0 bg-[var(--text)]/40 backdrop-blur-sm" />

      <div className="relative flex w-full max-w-md flex-col rounded-[24px] border border-white/60 bg-white/97 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <button
          onClick={onClose}
          aria-label="Skip tour"
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] transition-colors duration-200 hover:bg-black/5 hover:text-[var(--text)]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-[var(--accent)]" : "bg-black/10"}`}
            />
          ))}
        </div>
        <p className="mt-3 text-xs font-semibold tracking-widest text-[var(--text-muted)] uppercase">
          Step {step + 1} of {STEPS.length}
        </p>

        <div className="mt-4 flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-semibold text-[var(--heading)]">{current.label}</h2>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{DESCRIPTIONS[current.id]}</p>

        <button
          onClick={() => {
            onNavigate(current.id);
            onClose();
          }}
          className="mt-4 cursor-pointer self-start text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Try it now →
        </button>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="cursor-pointer rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)]"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
              className="cursor-pointer rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
            >
              {isLast ? "Start exploring" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
