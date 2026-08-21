export default function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="h-4 w-48 animate-pulse rounded bg-black/5" />
      <div className="mt-4 flex flex-col gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md"
          >
            <div className="h-5 w-2/3 rounded bg-black/5" />
            <div className="mt-2 h-3 w-1/3 rounded bg-black/5" />
            <div className="mt-4 flex gap-2">
              <div className="h-5 w-20 rounded bg-black/5" />
              <div className="h-5 w-20 rounded bg-black/5" />
            </div>
            <div className="mt-4 h-3 w-1/2 rounded bg-black/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
