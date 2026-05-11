export default function PortfolioLoading() {
  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-14 space-y-4">
          <div className="w-24 h-6 rounded-full bg-white/5 animate-pulse" />
          <div className="w-64 h-10 rounded-xl bg-white/5 animate-pulse" />
          <div className="w-full max-w-2xl h-5 rounded-lg bg-white/5 animate-pulse" />
          <div className="w-3/4 max-w-xl h-5 rounded-lg bg-white/5 animate-pulse" />
        </div>

        {/* Featured card skeleton */}
        <div className="rounded-3xl overflow-hidden border border-white/5 bg-bg-card/60 mb-10">
          <div className="h-[320px] md:h-[400px] bg-white/5 animate-pulse" />
          <div className="px-7 md:px-10 py-6 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Tag filter skeleton */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-16 rounded-full bg-white/5 animate-pulse" />
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-3xl overflow-hidden border border-white/5 bg-bg-card/60">
              <div className="h-44 bg-white/5 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
                <div className="h-5 w-full rounded bg-white/5 animate-pulse" />
                <div className="h-5 w-4/5 rounded bg-white/5 animate-pulse" />
                <div className="h-4 w-full rounded bg-white/5 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
                <div className="flex gap-1.5 pt-1">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-5 w-14 rounded-md bg-white/5 animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
