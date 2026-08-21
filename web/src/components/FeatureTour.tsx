"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, PartyPopper } from "lucide-react";
import { TABS, NAV_GROUPS, type TabId } from "@/lib/tabs";

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

function sectionFor(id: TabId): string | null {
  for (const group of NAV_GROUPS) {
    if (group.label && group.ids.includes(id)) return group.label;
  }
  return null;
}

const FEATURE_STEPS = TABS.filter((t) => DESCRIPTIONS[t.id]).map((t) => ({
  tab: t,
  section: sectionFor(t.id),
}));

type Step = { kind: "welcome" } | { kind: "feature"; index: number } | { kind: "finish" };

const STEPS: Step[] = [
  { kind: "welcome" },
  ...FEATURE_STEPS.map((_, i) => ({ kind: "feature" as const, index: i })),
  { kind: "finish" },
];

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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "Enter") goNext();
      else if (e.key === "ArrowLeft") goBack();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const featureIndex = current.kind === "feature" ? current.index : -1;
  const feature = featureIndex >= 0 ? FEATURE_STEPS[featureIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div onClick={onClose} className={`absolute inset-0 bg-[var(--text)]/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`} />

      <div
        className={`relative flex w-full max-w-md flex-col rounded-[24px] border border-white/60 bg-white/97 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:p-8 ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.97] opacity-0"
        }`}
      >
        <button
          onClick={onClose}
          aria-label="Skip tour"
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] transition-colors duration-200 hover:bg-black/5 hover:text-[var(--text)]"
        >
          <X className="h-4 w-4" />
        </button>

        {!isFirst && !isLast && (
          <>
            <div className="flex gap-1.5">
              {FEATURE_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= featureIndex ? "bg-[var(--accent)]" : "bg-black/10"}`}
                />
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold tracking-widest text-[var(--text-muted)] uppercase">
              {feature?.section ? `${feature.section} · ` : ""}Step {featureIndex + 1} of {FEATURE_STEPS.length}
            </p>
          </>
        )}

        <div key={step} className="mt-4 animate-[tourFadeIn_0.25s_ease]">
          {isFirst && (
            <div className="flex flex-col items-center py-2 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                <Sparkles className="h-7 w-7" strokeWidth={2} />
              </span>
              <h2 className="mt-4 font-serif text-2xl font-semibold text-[var(--heading)]">Welcome to Beacon</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                You&apos;ve got a lot of tools here — real opportunities, AI career guidance, employer job postings, a
                whole community. Let&apos;s walk through what each one actually does, one at a time. Takes about a
                minute.
              </p>
            </div>
          )}

          {feature && (
            <>
              <div className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                  <feature.tab.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h2 className="font-serif text-xl font-semibold text-[var(--heading)]">{feature.tab.label}</h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{DESCRIPTIONS[feature.tab.id]}</p>
              <button
                onClick={() => {
                  onNavigate(feature.tab.id);
                  onClose();
                }}
                className="mt-4 cursor-pointer text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Try it now →
              </button>
            </>
          )}

          {isLast && (
            <div className="flex flex-col items-center py-2 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                <PartyPopper className="h-7 w-7" strokeWidth={2} />
              </span>
              <h2 className="mt-4 font-serif text-2xl font-semibold text-[var(--heading)]">You&apos;re all set</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                That&apos;s everything. You can replay this tour anytime from &quot;Take the tour&quot; in the sidebar. A
                good place to start: fill in your Profile, then head to Discover.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={goBack}
                className="cursor-pointer rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)]"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? onClose() : goNext())}
              className="cursor-pointer rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
            >
              {isFirst ? "Let's go" : isLast ? "Start exploring" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
