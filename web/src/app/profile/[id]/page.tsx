import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/lib/profile";
import { computeProofOfSkill } from "@/lib/proofOfSkill";

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: mentorRow }, { data: assessmentRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", id).eq("public_profile", true).maybeSingle(),
    supabase.from("mentors").select("skills").eq("user_id", id).maybeSingle(),
    supabase.from("skill_assessments").select("skill, score, taken_at").eq("user_id", id).order("taken_at", { ascending: false }),
  ]);

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-[var(--bg)] px-4">
        <div className="text-center">
          <h1 className="font-serif text-xl font-semibold text-[var(--heading)]">Profile not found</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            This profile doesn&apos;t exist or hasn&apos;t been made public.
          </p>
        </div>
      </div>
    );
  }

  const p = profile as Profile;
  const latestScoreBySkill = new Map<string, number>();
  (assessmentRows ?? []).forEach((r) => {
    const key = (r.skill as string).toLowerCase();
    if (!latestScoreBySkill.has(key)) latestScoreBySkill.set(key, r.score as number);
  });
  const proof = computeProofOfSkill(
    p.skills ?? [],
    p.projects ?? [],
    (mentorRow?.skills as string[] | undefined) ?? [],
    latestScoreBySkill,
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-12">
      <div className="mx-auto w-full max-w-2xl rounded-[24px] border border-[var(--border)] bg-[var(--surface-solid)] p-8 shadow-lg">
        <div className="text-xs font-semibold tracking-widest text-[var(--text-muted)] uppercase">
          Beacon Proof-of-Skill Profile
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-[var(--heading)]">
          {p.full_name || "Beacon Student"}
        </h1>
        {p.education && <p className="mt-1 text-sm text-[var(--text-muted)]">{p.education}</p>}
        {p.career_goal && (
          <p className="mt-2 text-sm text-[var(--text)]">
            <b>Career goal:</b> {p.career_goal}
          </p>
        )}

        {proof.length > 0 && (
          <div className="mt-6">
            <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Skills</div>
            <div className="mt-3 flex flex-col gap-4">
              {proof.map((s) => (
                <div key={s.skill}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--text)]">{s.skill}</span>
                    <span className="text-[var(--text-muted)]">{s.proficiency}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
                    <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${s.proficiency}%` }} />
                  </div>
                  {s.proof.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {s.proof.map((pr, i) => (
                        <span key={i} className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                          ✓ {pr}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!!p.projects?.length && (
          <div className="mt-6">
            <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Projects</div>
            <div className="mt-2 flex flex-col gap-1">
              {p.projects.map((proj) => (
                <div key={proj} className="text-sm text-[var(--text)]">• {proj}</div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
          Evidence-backed proficiency estimates from real, self-reported data — not a certification. Powered by Beacon.
        </p>
      </div>
    </div>
  );
}
