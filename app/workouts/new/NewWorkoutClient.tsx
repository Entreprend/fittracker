"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Save } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import ExerciseRow, { type ExerciseDraft } from '@/components/workouts/ExerciseRow'
import ExerciseSearch from '@/components/workouts/ExerciseSearch'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { nanoid } from '@/lib/nanoid'
import type { MuscleGroup } from '@/types/database'

interface NewWorkoutClientProps {
  duplicateId?: string
}

export default function NewWorkoutClient({ duplicateId }: NewWorkoutClientProps) {
  const router = useRouter()

  const [name, setName]           = useState('')
  const [date, setDate]           = useState(() => new Date().toISOString().split('T')[0])
  const [exercises, setExercises] = useState<ExerciseDraft[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [loadingDuplicate, setLoadingDuplicate] = useState(!!duplicateId)

  const workoutIdRef = useRef<string | null>(null)
  const userIdRef    = useRef<string | null>(null)
  const startTimeRef = useRef(new Date())
  const stateRef     = useRef({ name, date, exercises })

  useEffect(() => {
    stateRef.current = { name, date, exercises }
  }, [name, date, exercises])

  // ─── Récupère user_id au montage ─────────────────────────────────────────
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null
    })
  }, [])

  // ─── Duplicate pre-population ─────────────────────────────────────────────

  useEffect(() => {
    if (!duplicateId) return
    async function load() {
      const res = await fetch(`/api/workouts/${duplicateId}`)
      if (!res.ok) { setLoadingDuplicate(false); return }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json()
      if (!data) { setLoadingDuplicate(false); return }

      setName(`${data.name} (copie)`)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exs = (data.workout_exercises as any[])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((we: any) => {
          const ex = Array.isArray(we.exercises) ? we.exercises[0] : we.exercises
          if (!ex) return null
          return {
            draftId:      nanoid(),
            exercise_id:  ex.id,
            name:         ex.name,
            muscle_group: ex.muscle_group,
            sets:         [],
          } satisfies ExerciseDraft
        })
        .filter(Boolean) as ExerciseDraft[]

      setExercises(exs)
      setLoadingDuplicate(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicateId])

  // ─── Persist via API (service role — bypass RLS) ─────────────────────────

  async function saveWorkout(status: 'in_progress' | 'completed') {
    const { name: n, date: d, exercises: exs } = stateRef.current
    if (!userIdRef.current) return

    const durationMin = Math.max(
      1,
      Math.round((Date.now() - startTimeRef.current.getTime()) / 60_000),
    )

    const res = await fetch('/api/workouts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id:      userIdRef.current,
        workout_id:   workoutIdRef.current ?? undefined,
        name:         n.trim() || 'Séance sans nom',
        date:         d,
        duration_min: durationMin,
        status,
        exercises: exs.map((ex) => ({
          exercise_id: ex.exercise_id,
          sets: ex.sets.map((set) => ({
            reps:      set.reps,
            weight_kg: set.weight_kg,
            completed: set.completed,
          })),
        })),
      }),
    })
    if (!res.ok) return
    const { workout_id } = await res.json()
    workoutIdRef.current = workout_id
  }

  useEffect(() => {
    const id = setInterval(async () => {
      const { name: n, exercises: exs } = stateRef.current
      if (!n.trim() && exs.length === 0) return
      setSaving(true)
      await saveWorkout('in_progress')
      setSaving(false)
    }, 30_000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleFinish() {
    if (finishing) return
    setFinishing(true)
    await saveWorkout('in_progress')
    const wid = workoutIdRef.current
    router.push(wid ? `/workouts/${wid}` : '/workouts')
  }

  function handleAddExercise(ex: { id: string; name: string; muscle_group: MuscleGroup }) {
    setExercises((prev) => [
      ...prev,
      {
        draftId:      nanoid(),
        exercise_id:  ex.id,
        name:         ex.name,
        muscle_group: ex.muscle_group,
        sets:         [],
      },
    ])
    setSheetOpen(false)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loadingDuplicate) {
    return (
      <AppShell title="Nouvelle séance" showBack>
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Nouvelle séance" showBack>
      {/* ── Bannière illustrative ──────────────────────────────────── */}
      <div
        className="h-[15vh] flex items-end px-5 pb-4"
        style={{ background: 'linear-gradient(135deg, #0A1010 0%, #0F2218 55%, #0A1812 100%)' }}
      >
        <span className="font-display font-bold text-[20px] text-white leading-tight">
          Nouvelle séance
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 pb-24">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la séance (ex: Push A — Pectoraux)"
          className="w-full h-12 bg-elevated border border-border rounded-[14px] px-4 font-body text-[15px] text-text1 placeholder:text-text3 outline-none focus:border-accent transition-colors"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full h-12 bg-elevated border border-border rounded-[14px] px-4 font-body text-[14px] text-text2 outline-none focus:border-accent transition-colors [color-scheme:dark]"
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-[15px] text-text1">Exercices</h2>
            {saving && (
              <span className="font-body text-[11px] text-text3 animate-pulse">Sauvegarde…</span>
            )}
          </div>

          {exercises.map((ex, idx) => (
            <ExerciseRow
              key={ex.draftId}
              draft={ex}
              onChange={(updated) =>
                setExercises((prev) => prev.map((e, i) => (i === idx ? updated : e)))
              }
              onRemove={() => setExercises((prev) => prev.filter((_, i) => i !== idx))}
            />
          ))}

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex items-center justify-center gap-2 h-12 rounded-[14px] border border-dashed border-border-hi text-text2 hover:text-accent hover:border-accent transition-colors font-body text-[14px] font-medium"
          >
            <Plus className="w-4 h-4" />
            Ajouter un exercice
          </button>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="h-[75vh] bg-surface border-t border-border rounded-t-[20px] p-0 flex flex-col gap-0"
        >
          <SheetHeader className="px-4 pt-5 pb-2 shrink-0">
            <SheetTitle className="font-display font-bold text-[17px] text-text1">
              Ajouter un exercice
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <ExerciseSearch
              alreadyAdded={exercises.map((e) => e.exercise_id)}
              onSelect={handleAddExercise}
              onClose={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="fixed bottom-[72px] inset-x-0 z-10 pointer-events-none">
        <div className="max-w-[430px] mx-auto px-4 pb-3 pt-6 bg-gradient-to-t from-bg via-bg/90 to-transparent pointer-events-auto">
          <button
            type="button"
            onClick={handleFinish}
            disabled={finishing || exercises.length === 0}
            className="w-full h-12 rounded-full bg-accent text-bg font-body font-semibold text-[15px] hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-[18px] h-[18px]" strokeWidth={2} />
            {finishing ? 'Enregistrement…' : 'Sauvegarder la séance'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
