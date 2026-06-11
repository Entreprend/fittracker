import AppShell from '@/components/layout/AppShell'
import { SkeletonCard } from '@/components/ui/SkeletonCard'

export default function ProfileLoading() {
  return (
    <AppShell>
      <div className="px-4 py-5 flex flex-col gap-4">
        <div className="h-[120px] bg-elevated rounded-[20px] animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    </AppShell>
  )
}
