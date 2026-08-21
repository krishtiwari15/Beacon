"use client";

import { useState } from "react";
import { LayoutDashboard, Briefcase, MessagesSquare, Building2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Company, Recruiter } from "@/lib/employer";
import EmployerOverview from "@/components/employer/EmployerOverview";
import JobsPanel from "@/components/employer/JobsPanel";
import RecruiterCopilot from "@/components/employer/RecruiterCopilot";
import CompanyProfilePanel from "@/components/employer/CompanyProfilePanel";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "copilot", label: "Recruiter Copilot", icon: MessagesSquare },
  { id: "company", label: "Company Profile", icon: Building2 },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function EmployerDashboard({
  company: initialCompany,
  recruiter,
}: {
  company: Company;
  recruiter: Recruiter;
}) {
  const [tab, setTab] = useState<TabId>("overview");
  const [company, setCompany] = useState(initialCompany);
  const initial = (recruiter.full_name || company.name || "B").trim().charAt(0).toUpperCase();

  return (
    <div className="dashboard-bg relative flex min-h-screen flex-1 flex-col md:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] backdrop-blur-md md:flex">
        <div className="border-b border-[var(--border)] px-5 py-6">
          <span className="font-serif text-lg font-semibold tracking-tight text-[var(--heading)]">Beacon for Employers</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {TABS.map((t) => {
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
        </nav>

        <div className="border-t border-[var(--border)] p-3">
          <div className="flex items-center gap-2.5 px-1 py-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white">
              {initial}
            </span>
            <span className="truncate text-xs text-[var(--text-muted)]">{recruiter.full_name || company.name}</span>
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

      {/* Mobile tab strip */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface)] px-3 py-3 backdrop-blur-md md:hidden">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors duration-200 ${
                tab === t.id ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              {t.label}
            </button>
          );
        })}
      </div>

      <main className="relative flex-1">
        {tab === "overview" && <EmployerOverview company={company} />}
        {tab === "jobs" && <JobsPanel companyId={company.id} />}
        {tab === "copilot" && <RecruiterCopilot />}
        {tab === "company" && <CompanyProfilePanel company={company} onUpdated={setCompany} />}
      </main>
    </div>
  );
}
