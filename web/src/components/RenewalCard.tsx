"use client";

import {
  CATEGORY_ICONS,
  daysLeft,
  makeIcs,
  progressPct,
  styleFor,
  type Renewal,
} from "@/lib/renewals";

export default function RenewalCard({
  item,
  onDelete,
}: {
  item: Renewal;
  onDelete: (id: number) => void;
}) {
  const d = daysLeft(item.expiry);
  const { label, color, tint } = styleFor(d);
  const pct = progressPct(d);
  const icon = CATEGORY_ICONS[item.category] ?? "📌";

  let when: string;
  if (d < 0) when = `Expired ${Math.abs(d)} day(s) ago`;
  else if (d === 0) when = "Expires today";
  else when = `${d} day(s) left · ${item.expiry}`;

  function downloadIcs() {
    const blob = new Blob([makeIcs(item)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.name}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="mb-1.5 rounded-lg border-l-[6px] px-4 py-3"
      style={{ borderColor: color, background: tint }}
    >
      <div className="text-[1.05rem] font-semibold text-zinc-900">
        {icon} {item.name}
      </div>
      <div className="text-[0.82rem] text-zinc-600">{item.category}</div>
      <div className="mt-1.5 text-[0.9rem] text-zinc-800">
        {label} — {when}
      </div>
      <div className="mt-2 h-2 rounded-md bg-zinc-200">
        <div
          className="h-2 rounded-md"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {item.notes && (
        <div className="mt-1 text-[0.8rem] text-zinc-600">{item.notes}</div>
      )}

      <div className="mt-2 flex gap-2">
        <button
          onClick={downloadIcs}
          className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          📅 Calendar
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
}
