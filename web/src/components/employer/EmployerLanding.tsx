"use client";

import { useState } from "react";
import { Users, Sparkles, ShieldCheck } from "lucide-react";
import AuthModal from "@/components/AuthModal";

const PILLARS = [
  { icon: Users, title: "Real candidates", body: "Reach students who are actively tracking opportunities and building toward a career, not passive resume drops." },
  { icon: Sparkles, title: "AI candidate matching", body: "Beacon ranks your applicants against your actual job requirements, with a plain-language explanation for every score." },
  { icon: ShieldCheck, title: "Verified employers", body: "A Beacon Verified badge means a real review happened — students can trust who's posting." },
];

export default function EmployerLanding() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[var(--bg)]">
      <nav className="flex items-center justify-between px-6 py-6 md:px-10">
        <span className="font-serif text-xl font-semibold tracking-tight text-[var(--heading)]">Beacon for Employers</span>
        <button
          onClick={() => setAuthOpen(true)}
          className="cursor-pointer rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
        >
          Get started
        </button>
      </nav>

      <div className="mx-auto max-w-3xl px-6 pt-16 pb-20 text-center sm:pt-24">
        <h1 className="font-serif text-4xl font-semibold text-[var(--heading)] sm:text-5xl">
          Hire from Beacon&apos;s student community
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-[var(--text-muted)]">
          Post internships, jobs, and apprenticeships. Beacon&apos;s AI ranks your real applicants against your
          requirements — nothing invented, nothing exposed without a student&apos;s consent.
        </p>
        <button
          onClick={() => setAuthOpen(true)}
          className="mt-8 cursor-pointer rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
        >
          Create your employer account
        </button>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-3">
        {PILLARS.map((p) => (
          <div key={p.title} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
            <p.icon className="h-5 w-5 text-[var(--accent)]" strokeWidth={2} />
            <div className="mt-3 text-sm font-semibold text-[var(--heading)]">{p.title}</div>
            <p className="mt-1.5 text-sm text-[var(--text-muted)]">{p.body}</p>
          </div>
        ))}
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        title="Beacon for Employers"
        subtitle="Create your recruiter account to start posting jobs."
        googleRedirectPath="/employer"
      />
    </div>
  );
}
