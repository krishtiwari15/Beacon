"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Company, Recruiter } from "@/lib/employer";
import EmployerLanding from "@/components/employer/EmployerLanding";
import EmployerOnboarding from "@/components/employer/EmployerOnboarding";
import EmployerDashboard from "@/components/employer/EmployerDashboard";

export default function EmployerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [checkedRecruiter, setCheckedRecruiter] = useState(false);

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
    if (!user) {
      setCheckedRecruiter(false);
      setRecruiter(null);
      setCompany(null);
      return;
    }
    const supabase = createClient();
    supabase
      .from("recruiters")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(async ({ data: recruiterRow }) => {
        if (recruiterRow) {
          setRecruiter(recruiterRow as Recruiter);
          const { data: companyRow } = await supabase.from("companies").select("*").eq("id", recruiterRow.company_id).single();
          setCompany(companyRow as Company);
        }
        setCheckedRecruiter(true);
      });
  }, [user]);

  if (!ready || (user && !checkedRecruiter)) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-[var(--bg)]">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
          Loading Beacon for Employers…
        </div>
      </div>
    );
  }

  if (!user) return <EmployerLanding />;

  if (!recruiter || !company) {
    return (
      <EmployerOnboarding
        onDone={(newCompany) => {
          setCompany(newCompany);
          setRecruiter({
            id: 0,
            user_id: user.id,
            company_id: newCompany.id,
            role: "owner",
            full_name: null,
            title: null,
            created_at: new Date().toISOString(),
          });
        }}
      />
    );
  }

  return <EmployerDashboard company={company} recruiter={recruiter} />;
}
