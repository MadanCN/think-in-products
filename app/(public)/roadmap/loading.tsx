// Skeleton for the roadmap page — shown by Next.js while the RSC fetch resolves

function SkeletonLine({ w = "full" }: { w?: string }) {
  return (
    <div
      className={`h-3.5 rounded-full bg-white/5 animate-pulse w-${w}`}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/5 bg-bg-card/60 p-5 space-y-4">
      {/* Difficulty badge */}
      <div className="h-5 w-20 rounded-full bg-white/5 animate-pulse" />
      {/* Title */}
      <div className="space-y-2">
        <SkeletonLine w="3/4" />
        <SkeletonLine w="1/2" />
      </div>
      {/* Summary */}
      <div className="space-y-1.5">
        <SkeletonLine />
        <SkeletonLine w="4/5" />
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-1.5">
          <div className="h-5 w-14 rounded-full bg-white/5 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-white/5 animate-pulse" />
        </div>
        <div className="h-4 w-20 rounded bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}

function SkeletonPhase() {
  return (
    <div className="max-w-5xl mx-auto px-6 space-y-6">
      {/* Phase header */}
      <div className="pl-5 border-l-2 border-white/10 space-y-3">
        <div className="h-4 w-28 rounded-full bg-white/5 animate-pulse" />
        <div className="h-7 w-64 rounded-lg bg-white/5 animate-pulse" />
        <div className="space-y-1.5">
          <SkeletonLine />
          <SkeletonLine w="4/5" />
        </div>
      </div>
      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export default function RoadmapLoading() {
  return (
    <div className="min-h-screen">
      {/* Header skeleton */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-12 space-y-5">
        <div className="h-6 w-48 rounded-full bg-white/5 animate-pulse" />
        <div className="h-12 w-72 rounded-xl bg-white/5 animate-pulse" />
        <div className="space-y-2">
          <SkeletonLine />
          <SkeletonLine w="3/4" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="max-w-5xl mx-auto px-6 mb-10">
        <div className="flex gap-2">
          {["w-14", "w-20", "w-28", "w-20"].map((w, i) => (
            <div key={i} className={`h-8 ${w} rounded-full bg-white/5 animate-pulse`} />
          ))}
        </div>
      </div>

      {/* Phase skeletons */}
      <div className="space-y-16 pb-24">
        <SkeletonPhase />
        <SkeletonPhase />
      </div>
    </div>
  );
}
