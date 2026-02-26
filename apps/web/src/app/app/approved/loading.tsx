export default function Loading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#080810] px-6">
        <div className="space-y-1.5">
          <div className="h-4 w-36 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-48 animate-pulse rounded bg-white/[0.04]" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.02]" />
        ))}
      </div>
    </div>
  )
}
