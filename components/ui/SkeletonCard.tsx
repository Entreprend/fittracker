export function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-[20px] p-5 animate-pulse">
      <div className="h-3 bg-elevated rounded w-1/3 mb-3" />
      <div className="h-8 bg-elevated rounded w-1/2 mb-2" />
      <div className="h-3 bg-elevated rounded w-1/4" />
    </div>
  )
}
