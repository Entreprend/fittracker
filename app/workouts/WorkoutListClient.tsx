"use client"

import Link from 'next/link'
import { useState } from 'react'
import { PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import WorkoutCard, { type WorkoutCardData } from '@/components/workouts/WorkoutCard'

type WorkoutWithGroups = WorkoutCardData & { muscleGroups: string[] }

const TABS: { label: string; groups: string[] | null }[] = [
  { label: 'Toutes',     groups: null },
  { label: 'Push',       groups: ['chest', 'shoulders'] },
  { label: 'Pull',       groups: ['back'] },
  { label: 'Legs',       groups: ['legs'] },
  { label: 'Full Body',  groups: ['full_body', 'core'] },
]

interface WorkoutListClientProps {
  workouts: WorkoutWithGroups[]
}

export default function WorkoutListClient({ workouts }: WorkoutListClientProps) {
  const [activeTab, setActiveTab] = useState(0)

  const activeWorkout = workouts.find((w) => w.status === 'in_progress')

  const filtered =
    TABS[activeTab].groups === null
      ? workouts
      : workouts.filter((w) =>
          w.muscleGroups.some((mg) => TABS[activeTab].groups!.includes(mg)),
        )

  return (
    <div className="flex flex-col gap-4">
      {/* Séance en cours */}
      {activeWorkout && (
        <div className="flex items-center justify-between bg-accent-dim border border-accent/30 rounded-[20px] px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-body text-[11px] text-accent uppercase tracking-widest font-medium">
              En cours
            </span>
            <span className="font-display font-bold text-[15px] text-text1">
              {activeWorkout.name}
            </span>
          </div>
          <Link
            href={`/workouts/${activeWorkout.id}/start`}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-accent text-bg font-body text-[13px] font-semibold hover:bg-accent-dark transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Reprendre
          </Link>
        </div>
      )}

      {/* Tabs filtre */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
        {TABS.map((tab, idx) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveTab(idx)}
            className={cn(
              'shrink-0 h-8 px-3.5 rounded-full font-body text-[13px] font-medium border transition-colors',
              activeTab === idx
                ? 'bg-accent border-accent text-bg'
                : 'bg-elevated border-border text-text2 hover:border-border-hi',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <p className="font-body text-[14px] text-text3 text-center py-8">
          Aucune séance dans cette catégorie.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((w) => (
            <WorkoutCard key={w.id} workout={w} />
          ))}
        </div>
      )}
    </div>
  )
}
