import AppShell from '@/components/layout/AppShell'
import { SkeletonCard } from '@/components/ui/SkeletonCard'

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="px-4 py-5 flex flex-col gap-4">
        <div className="h-8 bg-elevated rounded w-1/2 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </AppShell>
  )
}
