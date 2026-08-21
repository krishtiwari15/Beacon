export default function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="h-4 w-48 animate-pulse rounded bg-white/[0.06]" />
      <div className="mt-4 flex flex-col gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-[16px] border border-white/[0.08] bg-[rgba(17,16,15,0.35)] p-5 backdrop-blur-[20px]"
          >
            <div className="h-5 w-2/3 rounded bg-white/[0.06]" />
            <div className="mt-2 h-3 w-1/3 rounded bg-white/[0.06]" />
            <div className="mt-4 flex gap-2">
              <div className="h-5 w-20 rounded bg-white/[0.06]" />
              <div className="h-5 w-20 rounded bg-white/[0.06]" />
            </div>
            <div className="mt-4 h-3 w-1/2 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
