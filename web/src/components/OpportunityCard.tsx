import {
  DIFF_COLORS,
  Opportunity,
  TYPE_COLORS,
  deadlineLabel,
  typeLabel,
} from "@/lib/opportunities";

function matchColor(score: number): string {
  if (score >= 75) return "#2f8a52";
  if (score >= 50) return "#b58a1f";
  return "#8a8a86";
}

export default function OpportunityCard({
  opportunity,
  saved,
  onToggleSave,
  removeMode = false,
  matchScore,
  children,
}: {
  opportunity: Opportunity;
  saved: boolean;
  onToggleSave: () => void;
  removeMode?: boolean;
  matchScore?: number;
  children?: React.ReactNode;
}) {
  const accent = TYPE_COLORS[opportunity.type ?? ""] ?? "#336443";
  const diffColor = opportunity.difficulty ? DIFF_COLORS[opportunity.difficulty] ?? "#999" : null;
  const deadline = deadlineLabel(opportunity.deadline);
  const stipend = opportunity.stipend || "Not specified";
  const unpaid = /unpaid|volunteer|not specified|free/i.test(stipend);

  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {opportunity.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={opportunity.logo_url}
              alt=""
              className="h-9 w-9 rounded-md border border-[var(--border)] bg-white object-contain p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : null}
          <span className="font-serif text-lg font-semibold text-[var(--heading)]">{opportunity.title}</span>
        </div>
        {matchScore !== undefined && (
          <span
            className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
            style={{ borderColor: matchColor(matchScore), color: matchColor(matchScore) }}
            title="AI-estimated fit based on your saved profile"
          >
            {matchScore}% Match
          </span>
        )}
      </div>
      <div className="mt-1 text-xs text-[var(--text-muted)]">
        {opportunity.organization} · {opportunity.category}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <span
          className="rounded border px-2 py-0.5 text-[11px] font-medium tracking-wider uppercase"
          style={{ borderColor: accent, color: accent }}
        >
          {typeLabel(opportunity.type)}
        </span>
        {opportunity.difficulty && (
          <span
            className="rounded border px-2 py-0.5 text-[11px] font-medium tracking-wider uppercase"
            style={{ borderColor: diffColor ?? "#999", color: diffColor ?? "#999" }}
          >
            {opportunity.difficulty}
          </span>
        )}
        {opportunity.work_mode && (
          <span className="rounded border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium tracking-wider text-[var(--text-muted)] uppercase">
            {opportunity.work_mode}
          </span>
        )}
      </div>

      <div className="mt-3 text-sm text-[var(--text-muted)]">
        {opportunity.location || "—"} &nbsp; <span className={deadline.className}>{deadline.text}</span>
      </div>
      <div className="mt-1 text-sm text-[var(--text-muted)]">
        <span
          className={`rounded px-2 py-0.5 text-xs ${
            unpaid
              ? "border border-[var(--border)] text-[var(--text-muted)]"
              : "border border-emerald-600/30 bg-emerald-500/10 text-emerald-700"
          }`}
        >
          {stipend}
        </span>
      </div>
      {opportunity.eligibility && (
        <div className="mt-1 text-sm text-[var(--text-muted)]">
          <b>Eligibility:</b> {opportunity.eligibility}
        </div>
      )}

      {opportunity.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {opportunity.tags.map((tag) => (
            <span key={tag} className="rounded border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {opportunity.source_url && (
          <a
            href={opportunity.source_url}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)]"
          >
            Apply ↗
          </a>
        )}
        <button
          onClick={onToggleSave}
          className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
            removeMode
              ? "border border-red-500/40 text-red-600 hover:bg-red-500/10"
              : saved
                ? "border border-emerald-600/40 bg-emerald-500/10 text-emerald-700"
                : "border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]"
          }`}
        >
          {removeMode ? "Remove" : saved ? "✓ Saved" : "+ Save"}
        </button>
        {children}
      </div>
    </div>
  );
}
