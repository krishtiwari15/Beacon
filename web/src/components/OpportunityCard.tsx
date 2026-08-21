import {
  DIFF_COLORS,
  Opportunity,
  TYPE_COLORS,
  deadlineLabel,
  typeLabel,
} from "@/lib/opportunities";

export default function OpportunityCard({
  opportunity,
  saved,
  onToggleSave,
  removeMode = false,
  children,
}: {
  opportunity: Opportunity;
  saved: boolean;
  onToggleSave: () => void;
  removeMode?: boolean;
  children?: React.ReactNode;
}) {
  const accent = TYPE_COLORS[opportunity.type ?? ""] ?? "#e9e9e9";
  const diffColor = opportunity.difficulty ? DIFF_COLORS[opportunity.difficulty] ?? "#999" : null;
  const deadline = deadlineLabel(opportunity.deadline);
  const stipend = opportunity.stipend || "Not specified";
  const unpaid = /unpaid|volunteer|not specified|free/i.test(stipend);

  return (
    <div className="rounded-[16px] border border-white/[0.08] bg-[rgba(17,16,15,0.35)] p-5 backdrop-blur-[20px] transition-all duration-200 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.06)]">
      <div className="flex items-center gap-3">
        {opportunity.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={opportunity.logo_url}
            alt=""
            className="h-9 w-9 rounded-md border border-[#333] bg-[#1e1e1e] object-contain p-1"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        <span className="text-lg font-semibold text-white">{opportunity.title}</span>
      </div>
      <div className="mt-1 font-mono text-xs text-zinc-500">
        {opportunity.organization} :: {opportunity.category}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <span
          className="rounded border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider"
          style={{ borderColor: accent, color: accent }}
        >
          {typeLabel(opportunity.type)}
        </span>
        {opportunity.difficulty && (
          <span
            className="rounded border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider"
            style={{ borderColor: diffColor ?? "#999", color: diffColor ?? "#999" }}
          >
            {opportunity.difficulty}
          </span>
        )}
        {opportunity.work_mode && (
          <span className="rounded border border-zinc-600 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            {opportunity.work_mode}
          </span>
        )}
      </div>

      <div className="mt-3 text-sm text-zinc-300">
        📍 {opportunity.location || "—"} &nbsp; <span className={deadline.className}>{deadline.text}</span>
      </div>
      <div className="mt-1 text-sm text-zinc-300">
        💰{" "}
        <span
          className={`rounded px-2 py-0.5 font-mono text-xs ${
            unpaid ? "border border-zinc-600 text-zinc-400" : "border border-emerald-600/50 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {stipend}
        </span>
      </div>
      {opportunity.eligibility && (
        <div className="mt-1 text-sm text-zinc-300">
          ✅ <b>Eligibility:</b> {opportunity.eligibility}
        </div>
      )}

      {opportunity.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {opportunity.tags.map((tag) => (
            <span key={tag} className="rounded border border-zinc-700 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
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
            className="cursor-pointer rounded-md border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200 transition-colors duration-200 hover:border-white/60 hover:text-white"
          >
            Apply ↗
          </a>
        )}
        <button
          onClick={onToggleSave}
          className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
            removeMode
              ? "border border-red-600/50 text-red-400 hover:bg-red-500/10"
              : saved
                ? "border border-emerald-600/50 bg-emerald-500/10 text-emerald-400"
                : "border border-zinc-600 text-zinc-200 hover:border-white/60 hover:text-white"
          }`}
        >
          {removeMode ? "🗑 Remove" : saved ? "✓ Saved" : "＋ Save"}
        </button>
        {children}
      </div>
    </div>
  );
}
