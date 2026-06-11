"use client"

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import WorkoutCard, { type WorkoutCardData } from '@/components/workouts/WorkoutCard'
import type { MuscleGroup } from '@/types/database'

type HistoryWorkout = WorkoutCardData & { muscleGroups: string[]; hasPR: boolean }

// ─── Filtres groupe musculaire ────────────────────────────────────────────────

const MG_BADGES: { label: string; value: MuscleGroup | 'all'; groups?: MuscleGroup[] }[] = [
  { label: 'Tout',       value: 'all' },
  { label: 'Pectoraux',  value: 'pectoraux',  groups: ['pectoraux'] },
  { label: 'Dos',        value: 'dos',        groups: ['dos'] },
  { label: 'Épaules',    value: 'epaules',    groups: ['epaules'] },
  { label: 'Bras',       value: 'biceps',     groups: ['biceps', 'triceps'] },
  { label: 'Jambes',     value: 'quadriceps', groups: ['quadriceps', 'ischio_jambiers', 'fessiers', 'mollets'] },
  { label: 'Abdos',      value: 'abdominaux', groups: ['abdominaux'] },
  { label: 'Cardio',     value: 'cardio',     groups: ['cardio'] },
]

const PERIOD_FILTERS = [
  { label: 'Cette semaine', value: 'week' as const },
  { label: 'Ce mois',       value: 'month' as const },
  { label: 'Tout',          value: 'all' as const },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthLabel(dateISO: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateISO))
}

function getMondayISO(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

function getMonthStartISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

// ─── Component ────────────────────────────────────────────────────────────────

interface HistoryClientProps {
  workouts: HistoryWorkout[]
}

export default function HistoryClient({ workouts }: HistoryClientProps) {
  const [mgFilter, setMgFilter] = useState<MuscleGroup | 'all'>('all')
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('all')

  function handleMgFilterClick(value: MuscleGroup | 'all', el: HTMLButtonElement) {
    setMgFilter(value)
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const filtered = useMemo(() => {
    const today = new Date()
    const weekStart = getMondayISO(today)
    const monthStart = getMonthStartISO(today)
    const todayISO = today.toISOString().split('T')[0]

    return workouts.filter((w) => {
      const activeBadge = MG_BADGES.find((b) => b.value === mgFilter)
      const matchMg =
        mgFilter === 'all' ||
        (activeBadge?.groups?.some((g) => w.muscleGroups.includes(g)) ?? false)

      const matchPeriod =
        period === 'all'
          ? true
          : period === 'week'
            ? w.date >= weekStart && w.date <= todayISO
            : w.date >= monthStart && w.date <= todayISO

      return matchMg && matchPeriod
    })
  }, [workouts, mgFilter, period])

  // Grouper par mois
  const grouped = useMemo(() => {
    const map = new Map<string, HistoryWorkout[]>()
    filtered.forEach((w) => {
      const key = getMonthLabel(w.date)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(w)
    })
    return map
  }, [filtered])

  return (
    <div className="flex flex-col gap-4">

      {/* ── Bannière visuelle ────────────────────────────────────────────── */}
      <div
        className="h-[12vh] flex items-end px-5 pb-4"
        style={{ background: 'linear-gradient(135deg, #0A1210 0%, #0F2820 55%, #0A1A14 100%)' }}
      >
        <span className="font-display font-bold text-[22px] text-white leading-tight">
          Historique
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4">
      {/* Filtre groupe musculaire — scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-0.5 px-0.5 scrollbar-hide">
        {MG_BADGES.map((b) => (
          <button
            key={b.value}
            type="button"
            onClick={(e) => handleMgFilterClick(b.value, e.currentTarget)}
            className={cn(
              'shrink-0 h-8 px-3.5 rounded-full font-body text-[12px] font-medium border transition-colors',
              mgFilter === b.value
                ? 'bg-accent border-accent text-bg'
                : 'bg-elevated border-border text-text2 hover:border-border-hi',
            )}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Filtre période */}
      <div className="flex gap-2">
        {PERIOD_FILTERS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={cn(
              'flex-1 h-8 rounded-[10px] font-body text-[12px] font-medium border transition-colors',
              period === p.value
                ? 'bg-elevated border-accent text-accent'
                : 'bg-elevated border-border text-text3 hover:border-border-hi',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Compteur */}
      <p className="font-body text-[12px] text-text3">
        {filtered.length} séance{filtered.length > 1 ? 's' : ''}
      </p>

      {/* Résultats vides */}
      {filtered.length === 0 ? (
        <p className="font-body text-[14px] text-text3 text-center py-10">
          Aucune séance pour ce filtre.
        </p>
      ) : (
        /* Groupés par mois */
        Array.from(grouped.entries()).map(([month, items]) => (
          <div key={month} className="flex flex-col gap-3">
            <h2 className="font-display font-bold text-[13px] text-text3 uppercase tracking-widest capitalize">
              {month}
            </h2>
            {items.map((w) => (
              <div key={w.id} className="relative">
                <WorkoutCard workout={w} compact />
                {w.hasPR && (
                  <span className="absolute top-3 right-10 bg-warning/20 border border-warning/40 text-warning rounded-full px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-wide">
                    PR
                  </span>
                )}
              </div>
            ))}
          </div>
        ))
      )}

      <div className="h-2" />
      </div>{/* /inner px-4 */}
    </div>
  )
}
