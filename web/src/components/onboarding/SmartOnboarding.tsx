"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Sparkles, UploadCloud, X, Rocket } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/profile";
import { Opportunity } from "@/lib/opportunities";
import { quickReadiness } from "@/lib/readiness";
import { computeProfileStrength, type OnboardingStatus } from "@/lib/onboarding";
import type { CareerRecommendation } from "@/lib/services/careerRecommendation";
import OpportunityCard from "@/components/OpportunityCard";

type Step = "welcome" | "upload" | "analyzing" | "review" | "manual" | "score" | "careers" | "opportunities" | "summary";

type ResumeResult = {
  profile_strength?: number;
  education?: string;
  skills?: string[];
  projects?: string[];
  experience?: string[];
  certifications?: string[];
  achievements?: string[];
  career_interests?: string[];
  strengths?: string[];
  missing_skills?: string[];
  recommendations?: string[];
  error?: string;
};

const inputClass =
  "rounded-[12px] border border-[var(--border)] bg-black/[0.02] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition-colors duration-200 placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

function Chip({ text, onRemove }: { text: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs text-[var(--text)]">
      {text}
      <button onClick={onRemove} aria-label={`Remove ${text}`} className="cursor-pointer text-[var(--text-muted)] hover:text-red-600">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

async function setStatus(userId: string, status: OnboardingStatus) {
  const supabase = createClient();
  await supabase.from("profiles").upsert({ user_id: userId, onboarding_status: status });
}

export default function SmartOnboarding({
  user,
  resuming,
  onComplete,
  onExit,
}: {
  user: User;
  resuming: boolean;
  onComplete: (openTour: boolean) => void;
  onExit: () => void;
}) {
  const [step, setStep] = useState<Step>("welcome");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [resumeResult, setResumeResult] = useState<ResumeResult | null>(null);

  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [careerInterests, setCareerInterests] = useState<string[]>([]);
  const [experience, setExperience] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);

  // Manual (no-resume) form
  const [manualEducation, setManualEducation] = useState("");
  const [manualSkills, setManualSkills] = useState("");
  const [manualInterests, setManualInterests] = useState("");
  const [manualCareerGoal, setManualCareerGoal] = useState("");
  const [manualProjects, setManualProjects] = useState("");

  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  const [careers, setCareers] = useState<CareerRecommendation[] | null>(null);
  const [chosenCareer, setChosenCareer] = useState<string | null>(null);
  const [careersBusy, setCareersBusy] = useState(false);

  const [opportunities, setOpportunities] = useState<{ opportunity: Opportunity; score: number }[]>([]);
  const [oppsBusy, setOppsBusy] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  // Resuming an interrupted onboarding: if a profile already has real
  // content, don't ask them to re-upload a resume -- jump to wherever
  // makes sense given what's already saved.
  useEffect(() => {
    if (!resuming) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as Profile | null;
        if (p) {
          setProfile(p);
          setStep(p.skills?.length ? "careers" : "welcome");
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resuming]);

  function pickFile(f: File | null) {
    setFile(f);
    setError(null);
  }

  async function analyze() {
    if (!file) return;
    setStep("analyzing");
    setError(null);
    try {
      const form = new FormData();
      form.set("resume", file);
      const res = await fetch("/api/analyze-resume-profile", { method: "POST", body: form });
      const data = (await res.json()) as ResumeResult;
      if (data.error) {
        setError(data.error);
        setStep("upload");
        return;
      }
      setResumeResult(data);
      setEducation(data.education ?? "");
      setSkills(data.skills ?? []);
      setProjects(data.projects ?? []);
      setCareerInterests(data.career_interests ?? []);
      setExperience(data.experience ?? []);
      setCertifications(data.certifications ?? []);
      setAchievements(data.achievements ?? []);
      await setStatus(user.id, "resume_uploaded");
      setStep("review");
    } catch {
      setError("We couldn't upload your resume. Try again.");
      setStep("upload");
    }
  }

  async function confirmReview() {
    const supabase = createClient();
    const { data: existing } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    const current = existing as Profile | null;

    const mergedSkills = Array.from(
      new Map([...(current?.skills ?? []), ...skills].map((s) => [s.toLowerCase().trim(), s.trim()])).values(),
    );
    const mergedProjects = Array.from(new Set([...(current?.projects ?? []), ...projects]));

    const nextProfile = {
      user_id: user.id,
      full_name: current?.full_name ?? null,
      education: current?.education || education || null,
      skills: mergedSkills,
      projects: mergedProjects,
      interests: current?.interests || careerInterests.join(", ") || null,
      onboarding_status: "profile_generated" as OnboardingStatus,
    };
    await supabase.from("profiles").upsert(nextProfile);
    setProfile({ ...current, ...nextProfile });
    setStep("score");
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const nextProfile = {
      user_id: user.id,
      education: manualEducation.trim() || null,
      skills: manualSkills.split(",").map((s) => s.trim()).filter(Boolean),
      projects: manualProjects.split(",").map((s) => s.trim()).filter(Boolean),
      interests: manualInterests.trim() || null,
      career_goal: manualCareerGoal.trim() || null,
      onboarding_status: "profile_generated" as OnboardingStatus,
    };
    await supabase.from("profiles").upsert(nextProfile);
    setProfile((prev) => ({ ...prev, ...nextProfile }));
    setStep("score");
  }

  async function loadCareers() {
    setCareersBusy(true);
    setError(null);
    try {
      const interests = careerInterests.length ? careerInterests.join(", ") : manualInterests || profile?.interests || "General career exploration";
      const strengths = [...experience, ...achievements].join("; ") || "Not specified yet";
      const res = await fetch("/api/career-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests,
          strengths,
          workingStyle: "Not specified",
          problemSolving: "Not specified",
          techInterest: skills.some((s) => /python|sql|java|code|program|data/i.test(s)) ? "High" : "Not specified",
          businessInterest: "Not specified",
          researchInterest: "Not specified",
          lifestyle: "Not specified",
          goals: manualCareerGoal || "Explore based on my resume",
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setCareers(data.careers ?? []);
      }
    } finally {
      setCareersBusy(false);
    }
  }

  useEffect(() => {
    if (step === "careers" && careers === null && !careersBusy) loadCareers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function chooseCareer(title: string) {
    setChosenCareer(title);
    const supabase = createClient();
    await supabase.from("profiles").upsert({ user_id: user.id, career_goal: title });
    fetch("/api/career-roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ career_title: title }),
    }).catch(() => {});
  }

  async function loadOpportunities() {
    setOppsBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const [matchRes, oppsRes, savedRes] = await Promise.all([
        fetch("/api/match-scores", { method: "POST" }).then((r) => r.json()),
        supabase.from("opportunities").select("*").order("deadline", { ascending: true, nullsFirst: false }).limit(300),
        supabase.from("saved_opportunities").select("opportunity_id").eq("user_id", user.id),
      ]);
      setSavedIds(new Set((savedRes.data ?? []).map((r) => r.opportunity_id as number)));

      const scoreMap = new Map<number, number>((matchRes.scores ?? []).map((s: { opportunity_id?: number; id?: number; score: number }) => [s.opportunity_id ?? s.id!, s.score]));
      const rows = (oppsRes.data ?? []) as Opportunity[];
      const withScores = rows
        .map((o) => ({ opportunity: o, score: scoreMap.get(o.id) ?? 0 }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
      setOpportunities(withScores);
      await setStatus(user.id, "opportunities_shown");
    } finally {
      setOppsBusy(false);
    }
  }

  useEffect(() => {
    if (step === "opportunities" && opportunities.length === 0 && !oppsBusy) loadOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function toggleSave(oppId: number) {
    const supabase = createClient();
    const isSaved = savedIds.has(oppId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(oppId);
      else next.add(oppId);
      return next;
    });
    if (isSaved) {
      await supabase.from("saved_opportunities").delete().eq("user_id", user.id).eq("opportunity_id", oppId);
    } else {
      await supabase.from("saved_opportunities").insert({ user_id: user.id, opportunity_id: oppId, status: "saved" });
    }
  }

  async function finish(openTour: boolean) {
    await setStatus(user.id, "completed");
    const supabase = createClient();
    await supabase.from("profiles").upsert({ user_id: user.id, onboarding_completed_at: new Date().toISOString() });
    onComplete(openTour);
  }

  const strength = computeProfileStrength(profile);
  const highMatchCount = opportunities.filter((o) => o.score >= 75).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[var(--bg)] px-4 py-8">
      <div className="relative w-full max-w-xl rounded-[24px] border border-[var(--border)] bg-[var(--surface-solid)] p-6 shadow-2xl sm:p-8">
        {step !== "analyzing" && (
          <button
            onClick={onExit}
            aria-label="Exit setup for now"
            className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] transition-colors duration-200 hover:bg-black/5 hover:text-[var(--text)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {step === "welcome" && (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
              <Sparkles className="h-7 w-7" strokeWidth={2} />
            </span>
            <h1 className="mt-4 font-serif text-2xl font-semibold text-[var(--heading)] sm:text-3xl">Welcome to Beacon 👋</h1>
            <p className="mt-2 text-base font-medium text-[var(--text)]">Let&apos;s personalize Beacon for you.</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-[var(--text-muted)]">
              Instead of filling out your profile manually, upload your resume and we&apos;ll do the work for you.
            </p>
            <div className="mx-auto mt-5 flex max-w-xs flex-col gap-1.5 text-left text-sm text-[var(--text)]">
              {["Your education", "Your skills", "Your projects", "Your experience", "Your interests", "Potential career paths", "Opportunities that match you"].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span> {t}
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep("upload")}
              className="mt-6 h-[48px] w-full cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
            >
              Upload My Resume
            </button>
            <button
              onClick={() => setStep("manual")}
              className="mt-2 cursor-pointer text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              I&apos;ll fill it manually
            </button>
          </div>
        )}

        {step === "upload" && (
          <div>
            <h2 className="font-serif text-xl font-semibold text-[var(--heading)]">Upload your resume</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">PDF works best. We&apos;ll pull out your real details — nothing invented.</p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0] ?? null);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[16px] border-2 border-dashed p-8 text-center transition-colors duration-200 ${
                dragOver ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border)] hover:border-[var(--accent)]/50"
              }`}
            >
              <UploadCloud className="h-8 w-8 text-[var(--accent)]" strokeWidth={1.5} />
              {file ? (
                <p className="mt-3 text-sm font-medium text-[var(--text)]">{file.name} — Uploaded ✓</p>
              ) : (
                <p className="mt-3 text-sm text-[var(--text-muted)]">Drag & drop your resume here, or click to choose a file</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {file && (
              <button onClick={() => pickFile(null)} className="mt-2 cursor-pointer text-xs text-[var(--text-muted)] hover:text-[var(--text)]">
                Replace Resume
              </button>
            )}

            <p className="mt-4 rounded-[12px] bg-black/[0.02] p-3 text-xs text-[var(--text-muted)]">
              Your resume will be analyzed to personalize your Beacon profile and recommendations. It&apos;s processed to
              extract this information and isn&apos;t shared publicly. You can re-upload or edit anything it finds
              before it&apos;s saved.
            </p>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <button
              onClick={analyze}
              disabled={!file}
              className="mt-4 h-[48px] w-full cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Analyze My Resume
            </button>
            <button onClick={() => setStep("manual")} className="mt-2 w-full cursor-pointer text-center text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)]">
              Continue Without Resume
            </button>
          </div>
        )}

        {step === "analyzing" && (
          <div className="flex flex-col items-center py-10 text-center">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-[var(--text)]">Reading your resume…</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Extracting your education, skills, and projects.</p>
          </div>
        )}

        {step === "review" && (
          <div>
            <h2 className="font-serif text-xl font-semibold text-[var(--heading)]">We found your profile 🎉</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Remove anything that isn&apos;t right — everything else gets saved to your profile.</p>

            <div className="mt-4">
              <label className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Education</label>
              <input value={education} onChange={(e) => setEducation(e.target.value)} className={`${inputClass} mt-1 w-full`} placeholder="Not found — add it here" />
            </div>

            {[
              { label: "Skills", items: skills, setItems: setSkills },
              { label: "Projects", items: projects, setItems: setProjects },
              { label: "Career interests", items: careerInterests, setItems: setCareerInterests },
              { label: "Experience", items: experience, setItems: setExperience },
              { label: "Certifications", items: certifications, setItems: setCertifications },
              { label: "Achievements", items: achievements, setItems: setAchievements },
            ].map(
              ({ label, items, setItems }) =>
                items.length > 0 && (
                  <div key={label} className="mt-4">
                    <label className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">{label}</label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {items.map((item, i) => (
                        <Chip key={`${item}-${i}`} text={item} onRemove={() => setItems(items.filter((_, idx) => idx !== i))} />
                      ))}
                    </div>
                  </div>
                ),
            )}

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <button
              onClick={confirmReview}
              className="mt-6 h-[48px] w-full cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
            >
              Confirm & Continue
            </button>
          </div>
        )}

        {step === "manual" && (
          <div>
            <h2 className="font-serif text-xl font-semibold text-[var(--heading)]">Don&apos;t have a resume?</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">No problem — a few quick questions instead.</p>
            <form onSubmit={submitManual} className="mt-4 flex flex-col gap-3">
              <input value={manualEducation} onChange={(e) => setManualEducation(e.target.value)} placeholder="Education, e.g. BCA, 3rd year" className={inputClass} />
              <input value={manualSkills} onChange={(e) => setManualSkills(e.target.value)} placeholder="Skills, comma-separated" className={inputClass} />
              <input value={manualInterests} onChange={(e) => setManualInterests(e.target.value)} placeholder="Interests, e.g. data analytics, design" className={inputClass} />
              <input value={manualCareerGoal} onChange={(e) => setManualCareerGoal(e.target.value)} placeholder="Career goal (optional)" className={inputClass} />
              <input value={manualProjects} onChange={(e) => setManualProjects(e.target.value)} placeholder="Projects, comma-separated (optional)" className={inputClass} />
              <button type="submit" className="mt-1 h-[48px] cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]">
                Build My Profile
              </button>
            </form>
          </div>
        )}

        {step === "score" && (
          <div>
            <h2 className="font-serif text-xl font-semibold text-[var(--heading)]">Your Beacon Profile</h2>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4 border-[var(--accent)] text-[var(--accent)]">
                <span className="text-lg font-semibold">{strength.score}%</span>
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Profile Strength</div>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Based on what&apos;s actually filled in — nothing guessed.</p>
              </div>
            </div>

            {strength.complete.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Already completed</div>
                {strength.complete.map((c) => (
                  <div key={c} className="mt-1 text-sm text-[var(--text)]">✓ {c}</div>
                ))}
              </div>
            )}
            {strength.missing.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Complete next</div>
                {strength.missing.map((c) => (
                  <div key={c} className="mt-1 text-sm text-[var(--text-muted)]">○ {c}</div>
                ))}
              </div>
            )}

            <button
              onClick={() => setStep("careers")}
              className="mt-6 h-[48px] w-full cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
            >
              Continue
            </button>
          </div>
        )}

        {step === "careers" && (
          <div>
            <h2 className="font-serif text-xl font-semibold text-[var(--heading)]">Based on your profile…</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Potential career paths to explore based on your current profile — not a guarantee.</p>

            {careersBusy ? (
              <div className="mt-6 flex justify-center py-6">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
              </div>
            ) : error ? (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {(careers ?? []).slice(0, 5).map((c) => (
                  <div key={c.title} className="rounded-[14px] border border-[var(--border)] p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0 break-words text-sm font-semibold text-[var(--heading)]">{c.title}</span>
                      <span className="shrink-0 rounded-full border border-[var(--accent)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">{c.compatibility}%</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{c.why}</p>
                    <button
                      onClick={() => chooseCareer(c.title)}
                      disabled={chosenCareer === c.title}
                      className="mt-2 cursor-pointer text-xs font-medium text-[var(--accent)] hover:underline disabled:cursor-default"
                    >
                      {chosenCareer === c.title ? "✓ Chosen as your goal" : "Choose This Path"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setStep("opportunities")}
              className="mt-6 h-[48px] w-full cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
            >
              {chosenCareer ? "Continue" : "Skip for now →"}
            </button>
          </div>
        )}

        {step === "opportunities" && (
          <div>
            <h2 className="font-serif text-xl font-semibold text-[var(--heading)]">Opportunities We Found For You 🎯</h2>
            {oppsBusy ? (
              <div className="mt-6 flex justify-center py-6">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
              </div>
            ) : opportunities.length === 0 ? (
              <div className="mt-4 rounded-[14px] border border-[var(--border)] bg-black/[0.015] p-5 text-sm text-[var(--text-muted)]">
                We couldn&apos;t find strong matches yet. Try adding more skills to your profile, or explore Discover
                directly — the full catalog is bigger than what we show here.
              </div>
            ) : (
              <div className="mt-4 flex max-h-[45vh] flex-col gap-3 overflow-y-auto pr-1">
                {opportunities.map(({ opportunity, score }) => {
                  const r = quickReadiness(profile?.skills ?? skills, opportunity.tags);
                  return (
                    <div key={opportunity.id}>
                      {r.missing.length > 0 && (
                        <p className="mb-1 text-xs text-amber-700">⚠ Missing: {r.missing.slice(0, 3).join(", ")}</p>
                      )}
                      <OpportunityCard
                        opportunity={opportunity}
                        saved={savedIds.has(opportunity.id)}
                        onToggleSave={() => toggleSave(opportunity.id)}
                        matchScore={score}
                        readiness={r}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setStep("summary")}
              className="mt-6 h-[48px] w-full cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
            >
              Continue
            </button>
          </div>
        )}

        {step === "summary" && (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
              <Rocket className="h-7 w-7" strokeWidth={2} />
            </span>
            <h1 className="mt-4 font-serif text-2xl font-semibold text-[var(--heading)]">Your Beacon Is Ready 🚀</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Beacon has personalized your experience based on your profile.</p>

            <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3">
              {[
                [`${strength.score}%`, "Profile Strength"],
                [String(careers?.length ?? 0), "Career Paths"],
                [String(opportunities.length), "Matching Opportunities"],
                [String(highMatchCount), "High Match"],
                [String((profile?.skills ?? skills).length), "Skills Identified"],
                [String((profile?.projects ?? projects).length), "Projects Identified"],
              ].map(([num, label]) => (
                <div key={label} className="rounded-[14px] border border-[var(--border)] p-3 text-center">
                  <div className="text-xl font-semibold text-[var(--text)]">{num}</div>
                  <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">{label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => finish(true)}
              className="mt-6 h-[48px] w-full cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
            >
              Show Me Around
            </button>
            <button onClick={() => finish(false)} className="mt-2 cursor-pointer text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)]">
              Explore Beacon Myself
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
