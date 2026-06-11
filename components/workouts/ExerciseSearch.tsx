"use client"

import { useState, useEffect } from 'react'
import { Search, Plus } from 'lucide-react'
import { cn, getMuscleGroupLabel } from '@/lib/utils'
import type { MuscleGroup } from '@/types/database'

interface ExerciseItem {
  id: string
  name: string
  muscle_group: MuscleGroup
}

interface ExerciseSearchProps {
  alreadyAdded: string[]
  onSelect: (exercise: ExerciseItem) => void
  onClose?: () => void
}

const MG_FILTERS: { label: string; value: string; groups: string[] }[] = [
  { label: 'Tous',      value: '',           groups: [] },
  { label: 'Pectoraux', value: 'pectoraux',  groups: ['pectoraux'] },
  { label: 'Dos',       value: 'dos',        groups: ['dos'] },
  { label: 'Épaules',   value: 'epaules',    groups: ['epaules'] },
  { label: 'Bras',      value: 'biceps',     groups: ['biceps', 'triceps'] },
  { label: 'Jambes',    value: 'quadriceps', groups: ['quadriceps', 'ischio_jambiers', 'fessiers', 'mollets'] },
  { label: 'Abdos',     value: 'abdominaux', groups: ['abdominaux'] },
  { label: 'Cardio',    value: 'cardio',     groups: ['cardio'] },
]

export default function ExerciseSearch({ alreadyAdded, onSelect, onClose }: ExerciseSearchProps) {
  const [exercises, setExercises] = useState<ExerciseItem[]>([])
  const [query, setQuery] = useState('')
  const [mgFilter, setMgFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/exercises')
      .then((res) => res.json())
      .then((data) => {
        console.log('exercises:', data)
        setExercises(Array.isArray(data) ? (data as ExerciseItem[]) : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('exercises fetch error:', err)
        setLoading(false)
      })
  }, [])

  const activeFilter = MG_FILTERS.find((f) => f.value === mgFilter)

  const filtered = exercises.filter((ex) => {
    const matchQuery = !query || ex.name.toLowerCase().includes(query.toLowerCase())
    const matchMg =
      !mgFilter || (activeFilter?.groups.includes(ex.muscle_group) ?? false)
    return matchQuery && matchMg
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Barre de recherche */}
      <div className="px-4 pt-1 pb-3 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un exercice…"
            className={cn(
              'w-full h-10 bg-elevated border border-border rounded-[14px] pl-9 pr-4',
              'font-body text-[14px] text-text1 placeholder:text-text3',
              'outline-none focus:border-accent transition-colors',
            )}
            autoFocus
          />
        </div>

        {/* Filtres groupe musculaire */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
          {MG_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setMgFilter(f.value)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full font-body text-[12px] font-medium border transition-colors',
                mgFilter === f.value
                  ? 'bg-accent border-accent text-bg'
                  : 'bg-elevated border-border text-text2 hover:border-border-hi',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="max-h-[60vh] overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 bg-elevated rounded-[14px] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <p className="font-body text-[14px] text-text3">Aucun exercice trouvé</p>
            {(query || mgFilter) && (
              <p className="font-body text-[12px] text-text3 text-center">
                Essaie un autre terme ou change de filtre.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.map((ex) => {
              const added = alreadyAdded.includes(ex.id)
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => {
                    if (added) return
                    onSelect(ex)
                    onClose?.()
                  }}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-[14px] border text-left transition-colors',
                    added
                      ? 'bg-accent-dim border-accent/30 cursor-default'
                      : 'bg-elevated border-border hover:border-border-hi',
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span
                      className={cn(
                        'font-body font-medium text-[14px]',
                        added ? 'text-accent' : 'text-text1',
                      )}
                    >
                      {ex.name}
                    </span>
                    <span className="font-body text-[11px] text-text3">
                      {getMuscleGroupLabel(ex.muscle_group)}
                    </span>
                  </div>
                  {!added ? (
                    <Plus className="w-4 h-4 text-text3 shrink-0" />
                  ) : (
                    <span className="font-body text-[11px] text-accent shrink-0">Ajouté</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
