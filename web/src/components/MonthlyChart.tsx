"use client";

export default function MonthlyChart({
  counts,
}: {
  counts: { month: string; count: number }[];
}) {
  if (counts.length === 0) return null;
  const max = Math.max(...counts.map((c) => c.count));

  return (
    <div className="mt-3 flex h-[180px] items-end gap-2 border-b border-zinc-200 pb-1 dark:border-zinc-800">
      {counts.map(({ month, count }) => (
        <div key={month} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-xs text-zinc-500">{count}</span>
          <div
            className="w-full rounded-t bg-zinc-700 dark:bg-zinc-300"
            style={{ height: `${max === 0 ? 0 : (count / max) * 130}px` }}
          />
          <span className="text-[0.65rem] text-zinc-500">{month}</span>
        </div>
      ))}
    </div>
  );
}
