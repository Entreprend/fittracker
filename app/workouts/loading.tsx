import AppShell from '@/components/layout/AppShell'
import { SkeletonCard } from '@/components/ui/SkeletonCard'

export default function WorkoutsLoading() {
  return (
    <AppShell>
      <div className="px-4 py-5 flex flex-col gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </AppShell>
  )
}
