export default function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="h-4 w-48 animate-pulse rounded bg-[#1c1c1c]" />
      <div className="mt-4 flex flex-col gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="animate-pulse rounded border border-[#262626] bg-[#141414] p-5">
            <div className="h-5 w-2/3 rounded bg-[#1c1c1c]" />
            <div className="mt-2 h-3 w-1/3 rounded bg-[#1c1c1c]" />
            <div className="mt-4 flex gap-2">
              <div className="h-5 w-20 rounded bg-[#1c1c1c]" />
              <div className="h-5 w-20 rounded bg-[#1c1c1c]" />
            </div>
            <div className="mt-4 h-3 w-1/2 rounded bg-[#1c1c1c]" />
          </div>
        ))}
      </div>
    </div>
  );
}
