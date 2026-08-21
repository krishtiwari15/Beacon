"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/profile";

type Result = {
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

function List({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3">
      <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">{title}</div>
      {items.map((s, i) => (
        <div key={i} className="mt-1 text-sm text-[var(--text)]">
          • {s}
        </div>
      ))}
    </div>
  );
}

export default function ProfileResumeAnalysis({ user }: { user: User }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const strength = result?.profile_strength ?? 0;
  const strengthColor = strength < 40 ? "#dc2626" : strength < 70 ? "#b58a1f" : "#2f8a52";

  async function analyze() {
    if (!file) return;
    setBusy(true);
    setResult(null);
    setSaved(false);
    try {
      const form = new FormData();
      form.set("resume", file);
      const res = await fetch("/api/analyze-resume-profile", { method: "POST", body: form });
      setResult(await res.json());
    } finally {
      setBusy(false);
    }
  }

  async function saveToProfile() {
    if (!result) return;
    setSaving(true);
    const supabase = createClient();

    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    const current = existing as Profile | null;

    const mergedSkills = Array.from(
      new Map(
        [...(current?.skills ?? []), ...(result.skills ?? [])].map((s) => [s.toLowerCase().trim(), s.trim()]),
      ).values(),
    );

    await supabase.from("profiles").upsert({
      user_id: user.id,
      full_name: current?.full_name ?? null,
      education: current?.education || result.education || null,
      skills: mergedSkills,
      projects: current?.projects ?? [],
      interests: current?.interests || (result.career_interests ?? []).join(", ") || null,
      career_goal: current?.career_goal ?? null,
      location: current?.location ?? null,
      work_mode: current?.work_mode ?? null,
      age: current?.age ?? null,
      cgpa: current?.cgpa ?? null,
      country: current?.country ?? null,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    setSaved(true);
  }

  return (
    <div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Upload your resume (PDF) for a general profile analysis — education, skills, projects, and a
        Profile Strength Score. You can then save the extracted skills straight into your Profile.
      </p>

      <div className="mt-5 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full cursor-pointer text-sm text-[var(--text-muted)] file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-[var(--border)] file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-[var(--text)] file:transition-colors file:duration-200 hover:file:border-[var(--accent)]"
        />
        <button
          onClick={analyze}
          disabled={busy || !file}
          className="mt-4 h-[46px] cursor-pointer rounded-[12px] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Reading your resume…" : "Analyze my profile"}
        </button>
        {!file && <p className="mt-2 text-xs text-[var(--text-muted)]">Please upload a PDF resume first.</p>}
      </div>

      {result?.error && <p className="mt-4 text-sm text-red-600">{result.error}</p>}

      {result && !result.error && (
        <div className="mt-5 flex flex-col gap-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md sm:flex-row sm:items-start">
          <div
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4 text-sm font-semibold"
            style={{ borderColor: strengthColor, color: strengthColor }}
          >
            <span className="text-lg">{strength}</span>
            <span className="text-[10px]">/ 100</span>
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              Profile Strength Score
            </div>
            {result.education && (
              <p className="mt-2 text-sm text-[var(--text)]">
                <b>Education:</b> {result.education}
              </p>
            )}
            <List title="✅ Strengths" items={result.strengths} />
            <List title="⚠️ Missing skills" items={result.missing_skills} />
            <List title="💡 Recommendations" items={result.recommendations} />
            <List title="Skills detected" items={result.skills} />
            <List title="Projects" items={result.projects} />
            <List title="Experience" items={result.experience} />
            <List title="Certifications" items={result.certifications} />
            <List title="Achievements" items={result.achievements} />

            <button
              onClick={saveToProfile}
              disabled={saving}
              className="mt-4 cursor-pointer rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save extracted skills to my profile"}
            </button>
            {saved && <p className="mt-2 text-sm text-emerald-700">✓ Saved to your profile.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
