"use client";

import { useState } from "react";
import type { Company } from "@/lib/employer";

const VERIFICATION_LABEL: Record<Company["verification_status"], { label: string; className: string }> = {
  verified: { label: "Beacon Verified Employer ✓", className: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700" },
  pending: { label: "Verification Pending", className: "border-amber-600/30 bg-amber-500/10 text-amber-700" },
  unverified: { label: "Unverified", className: "border-[var(--border)] text-[var(--text-muted)]" },
};

export default function CompanyProfilePanel({ company, onUpdated }: { company: Company; onUpdated: (c: Company) => void }) {
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const badge = VERIFICATION_LABEL[company.verification_status];

  async function requestVerification() {
    setRequesting(true);
    setError(null);
    try {
      const res = await fetch("/api/employer/verify", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't request verification.");
        return;
      }
      onUpdated(data.company);
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Company Profile
      </div>

      <div className="mt-5 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="min-w-0 break-words font-serif text-2xl font-semibold text-[var(--heading)]">{company.name}</h1>
            {company.industry && <p className="mt-1 text-sm text-[var(--text-muted)]">{company.industry}</p>}
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
        </div>

        {company.description && <p className="mt-4 text-sm text-[var(--text)]">{company.description}</p>}

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] hover:underline">
              {company.website}
            </a>
          )}
          {company.size && <span>{company.size} employees</span>}
        </div>

        {company.verification_status === "unverified" && (
          <div className="mt-6 rounded-[12px] border border-[var(--border)] bg-black/[0.015] p-4">
            <p className="text-sm text-[var(--text)]">
              Verification helps students trust that your postings are from a real company. Requesting it flags
              your company for a real review — Beacon never auto-grants a verified badge.
            </p>
            <button
              onClick={requestVerification}
              disabled={requesting}
              className="mt-3 cursor-pointer rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {requesting ? "Requesting…" : "Request Verification"}
            </button>
          </div>
        )}
        {company.verification_status === "pending" && (
          <p className="mt-6 text-sm text-[var(--text-muted)]">
            Your verification request is being reviewed. This can take a little time — no action needed from you.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
