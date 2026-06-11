import AppShell from '@/components/layout/AppShell'
import { SkeletonCard } from '@/components/ui/SkeletonCard'

export default function ProgressLoading() {
  return (
    <AppShell>
      <div className="px-4 py-5 flex flex-col gap-4">
        <div className="h-10 bg-elevated rounded-full w-full animate-pulse" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </AppShell>
  )
}
