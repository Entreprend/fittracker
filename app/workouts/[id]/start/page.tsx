"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { X, ChevronLeft, ChevronRight, CheckCircle, Dumbbell } from 'lucide-react'
import { cn, getMuscleGroupLabel } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import BackgroundImage from '@/components/ui/BackgroundImage'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetLive {
  id: string
  set_number: number
  reps: string
  weight_kg: string
  completed: boolean
}

interface ExerciseLive {
  weId: string
  order_index: number
  exercise: { id: string; name: string; muscle_group: string }
  sets: SetLive[]
}

interface WorkoutLive {
  id: string
  name: string
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REST_PRESETS  = [60, 90, 120, 180] as const
const DEFAULT_REST  = 90

// SVG circle for rest overlay
const OV_R           = 35
const OV_CIRCUMFERENCE = 2 * Math.PI * OV_R

// ─── Component ────────────────────────────────────────────────────────────────

export default function StartWorkoutPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [workout, setWorkout]       = useState<WorkoutLive | null>(null)
  const [exercises, setExercises]   = useState<ExerciseLive[]>([])
  const [loading, setLoading]       = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [elapsed, setElapsed]       = useState(0)
  const startTimeRef = useRef(Date.now())
  const [finishing, setFinishing]   = useState(false)

  // Rest timer state
  const [restTimer, setRestTimer]       = useState<number | null>(null)
  const [restDuration, setRestDuration] = useState(DEFAULT_REST)

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // ─── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { user } } = await (supabase as any).auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const res = await fetch(`/api/workouts/${id}`)
      if (!res.ok) { router.push('/workouts'); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json()
      if (!data) { router.push('/workouts'); return }

      setWorkout({ id: data.id, name: data.name, created_at: data.created_at })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exs: ExerciseLive[] = (data.workout_exercises as any[])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .flatMap((we: any) => {
          const ex = Array.isArray(we.exercises) ? we.exercises[0] : we.exercises
          if (!ex) return []
          return [{
            weId:        we.id,
            order_index: we.order_index,
            exercise:    ex,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sets: (we.sets as any[])
              .sort((a: any, b: any) => a.set_number - b.set_number)
              .map((s: any) => ({
                id:         s.id,
                set_number: s.set_number,
                reps:       s.reps?.toString() ?? '',
                weight_kg:  s.weight_kg?.toString() ?? '',
                completed:  s.completed ?? false,
              })),
          }]
        })

      const seededExs = await Promise.all(
        exs.map(async (ex) => {
          if (ex.sets.length > 0) return ex
          const setId = crypto.randomUUID()
          await fetch('/api/sets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: setId, workout_exercise_id: ex.weId,
              set_number: 1, reps: null, weight_kg: null, completed: false,
            }),
          })
          return { ...ex, sets: [{ id: setId, set_number: 1, reps: '', weight_kg: '', completed: false }] }
        }),
      )

      setExercises(seededExs)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ─── Elapsed timer ────────────────────────────────────────────────────────

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Rest countdown ───────────────────────────────────────────────────────

  useEffect(() => {
    if (restTimer === null || restTimer <= 0) {
      if (restTimer === 0) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 100, 200])
        }
        setRestTimer(null)
      }
      return
    }
    const t = setInterval(() => setRestTimer((s) => (s !== null ? s - 1 : null)), 1000)
    return () => clearInterval(t)
  }, [restTimer])

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function formatElapsed(secs: number): string {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ─── Set mutations ────────────────────────────────────────────────────────

  function updateSetField(weId: string, setId: string, field: 'reps' | 'weight_kg', value: string) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.weId !== weId ? ex
          : { ...ex, sets: ex.sets.map((s) => (s.id !== setId ? s : { ...s, [field]: value })) },
      ),
    )
    clearTimeout(saveTimers.current[setId + field])
    saveTimers.current[setId + field] = setTimeout(async () => {
      const parsed = field === 'reps' ? parseInt(value) || null : parseFloat(value) || null
      await fetch('/api/sets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: setId, [field]: parsed }),
      })
    }, 600)
  }

  async function toggleCompleted(weId: string, setId: string, completed: boolean) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.weId !== weId ? ex
          : { ...ex, sets: ex.sets.map((s) => (s.id !== setId ? s : { ...s, completed })) },
      ),
    )
    await fetch('/api/sets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: setId, completed }),
    })
    if (completed) {
      setRestTimer(restDuration)
    } else {
      setRestTimer(null)
    }
  }

  async function addSet(ex: ExerciseLive) {
    const prev   = ex.sets.at(-1)
    const setId  = crypto.randomUUID()
    const setNum = (prev?.set_number ?? 0) + 1
    const newSet: SetLive = {
      id: setId, set_number: setNum,
      reps: prev?.reps ?? '', weight_kg: prev?.weight_kg ?? '', completed: false,
    }
    setExercises((exs) =>
      exs.map((e) => (e.weId !== ex.weId ? e : { ...e, sets: [...e.sets, newSet] })),
    )
    await fetch('/api/sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: setId, workout_exercise_id: ex.weId, set_number: setNum,
        reps: parseInt(newSet.reps) || null, weight_kg: parseFloat(newSet.weight_kg) || null,
        completed: false,
      }),
    })
  }

  // ─── Finish ───────────────────────────────────────────────────────────────

  async function handleFinish() {
    if (!workout || finishing) return
    setFinishing(true)
    const totalVolume = exercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s2, s) => {
        return s2 + (parseFloat(s.reps) || 0) * (parseFloat(s.weight_kg) || 0)
      }, 0), 0,
    )
    await fetch(`/api/workouts/${workout.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        duration_min: Math.max(1, Math.floor(elapsed / 60)),
        total_volume_kg: totalVolume > 0 ? Math.round(totalVolume) : null,
      }),
    })
    router.push(`/workouts/${workout.id}`)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-bg items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  if (exercises.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-bg max-w-[430px] mx-auto">
        <div className="shrink-0 h-[60px] flex items-center px-4 bg-surface border-b border-border">
          <button type="button" onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-[10px] text-text2 hover:text-text1 hover:bg-elevated transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="w-14 h-14 bg-elevated rounded-[18px] flex items-center justify-center">
            <Dumbbell className="w-7 h-7 text-text3" />
          </div>
          <p className="font-display font-bold text-[18px] text-text1">Aucun exercice</p>
          <p className="font-body text-[13px] text-text3 leading-relaxed">
            Ajoute des exercices à cette séance avant de la lancer.
          </p>
          <button type="button" onClick={() => router.back()}
            className="h-10 px-6 rounded-full bg-elevated border border-border text-text2 font-body text-[13px] hover:border-border-hi transition-colors">
            Retour
          </button>
        </div>
      </div>
    )
  }

  const currentEx = exercises[currentIdx]

  // Rest overlay calculations
  const ovProgress      = restTimer !== null && restDuration > 0 ? restTimer / restDuration : 0
  const ovDashoffset    = OV_CIRCUMFERENCE * (1 - ovProgress)

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] overflow-hidden max-w-[430px] mx-auto">
      <BackgroundImage pattern="grid" />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="shrink-0 h-[60px] flex items-center justify-between px-4 bg-surface border-b border-border">
        <button type="button" onClick={() => router.push(`/workouts/${workout!.id}`)}
          className="w-8 h-8 flex items-center justify-center rounded-[10px] text-text2 hover:text-text1 hover:bg-elevated transition-colors"
          aria-label="Quitter">
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center gap-0.5">
          <span className="font-body text-[10px] text-text3 uppercase tracking-widest">En cours</span>
          <span className="font-display font-bold text-[17px] text-accent tabular-nums leading-none">
            {formatElapsed(elapsed)}
          </span>
        </div>

        <button type="button" onClick={handleFinish} disabled={finishing}
          className="h-8 px-3.5 rounded-full bg-accent text-bg font-body font-semibold text-[12px] hover:bg-accent-dark transition-colors disabled:opacity-50">
          {finishing ? '…' : 'Terminer'}
        </button>
      </div>

      {/* ── Barre de progression séance ────────────────────────────── */}
      <div className="shrink-0 h-1 bg-elevated">
        <div
          className="h-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${((currentIdx + 1) / exercises.length) * 100}%` }}
        />
      </div>

      {/* ── Exercise nav dots ───────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-surface border-b border-border/50">
        <button type="button" onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="w-7 h-7 flex items-center justify-center rounded-[8px] text-text2 hover:text-text1 hover:bg-elevated transition-colors disabled:opacity-25">
          <ChevronLeft className="w-4.5 h-4.5" />
        </button>

        <div className="flex items-center gap-1.5">
          {exercises.map((_, i) => (
            <button key={i} type="button" onClick={() => setCurrentIdx(i)}
              className={cn('rounded-full transition-all duration-200',
                i === currentIdx ? 'w-4 h-2 bg-accent' : 'w-2 h-2 bg-border-hi hover:bg-text3')}
              aria-label={`Exercice ${i + 1}`} />
          ))}
        </div>

        <button type="button" onClick={() => setCurrentIdx((i) => Math.min(exercises.length - 1, i + 1))}
          disabled={currentIdx === exercises.length - 1}
          className="w-7 h-7 flex items-center justify-center rounded-[8px] text-text2 hover:text-text1 hover:bg-elevated transition-colors disabled:opacity-25">
          <ChevronRight className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Extra bottom padding when rest overlay is visible */}
        <div className={cn('flex flex-col gap-4 px-4 py-4', restTimer !== null ? 'pb-44' : 'pb-8')}>

          {/* Exercise name */}
          <div className="flex flex-col gap-1">
            <span className="font-body text-[11px] text-accent uppercase tracking-widest font-semibold">
              {currentIdx + 1} / {exercises.length}
            </span>
            <h2 className="font-display font-bold text-[28px] text-text1 leading-tight">
              {currentEx.exercise.name}
            </h2>
            <span className="self-start px-2.5 py-0.5 rounded-full bg-elevated border border-border font-body text-[11px] text-text3">
              {getMuscleGroupLabel(currentEx.exercise.muscle_group)}
            </span>
          </div>

          {/* ── Séries ────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            {/* Headers */}
            <div className="flex gap-2 w-full px-1">
              <span className="w-6 shrink-0 font-body text-[10px] text-text3 uppercase tracking-wide text-center">#</span>
              <span className="flex-1 font-body text-[10px] text-text3 uppercase tracking-wide text-center">Reps</span>
              <span className="flex-1 font-body text-[10px] text-text3 uppercase tracking-wide text-center">kg</span>
              <span className="w-10 shrink-0" />
            </div>

            {currentEx.sets.map((set) => (
              <div key={set.id}
                className={cn('flex gap-2 w-full overflow-hidden items-center', set.completed && 'opacity-55')}>
                <span className="w-6 shrink-0 font-body text-[12px] text-text3 text-center tabular-nums">
                  {set.set_number}
                </span>
                <input type="number" inputMode="numeric" value={set.reps}
                  onChange={(e) => updateSetField(currentEx.weId, set.id, 'reps', e.target.value)}
                  placeholder="—"
                  className="flex-1 min-w-0 h-11 bg-elevated border border-border rounded-[10px] font-body text-[16px] text-text1 text-center outline-none focus:border-accent transition-colors appearance-none"
                />
                <input type="number" inputMode="decimal" value={set.weight_kg}
                  onChange={(e) => updateSetField(currentEx.weId, set.id, 'weight_kg', e.target.value)}
                  placeholder="—"
                  className="flex-1 min-w-0 h-11 bg-elevated border border-border rounded-[10px] font-body text-[16px] text-text1 text-center outline-none focus:border-accent transition-colors appearance-none"
                />
                <button type="button"
                  onClick={() => toggleCompleted(currentEx.weId, set.id, !set.completed)}
                  className={cn(
                    'w-10 h-11 shrink-0 rounded-[10px] flex items-center justify-center border transition-colors',
                    set.completed ? 'bg-accent border-accent text-bg' : 'bg-elevated border-border text-text3 hover:border-accent/60',
                  )}
                  aria-label={set.completed ? 'Décocher' : 'Marquer comme faite'}>
                  {set.completed
                    ? <CheckCircle className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    : <span className="font-body text-[13px] font-semibold">✓</span>}
                </button>
              </div>
            ))}

            <button type="button" onClick={() => addSet(currentEx)}
              className="flex items-center justify-center gap-1.5 w-full h-10 rounded-[10px] border border-dashed border-border-hi text-text3 hover:text-accent hover:border-accent transition-colors font-body text-[13px] mt-1">
              + Série
            </button>
          </div>

          {/* ── Navigation exercices ──────────────────────────────── */}
          {exercises.length > 1 && (
            <div className="flex gap-3 pt-1">
              {currentIdx > 0 && (
                <button type="button" onClick={() => setCurrentIdx((i) => i - 1)}
                  className="flex-1 h-11 rounded-full bg-elevated border border-border text-text2 font-body font-medium text-[13px] flex items-center justify-center gap-1.5 hover:border-border-hi transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </button>
              )}
              {currentIdx < exercises.length - 1 && (
                <button type="button" onClick={() => setCurrentIdx((i) => i + 1)}
                  className="flex-1 h-11 rounded-full bg-accent text-bg font-body font-semibold text-[13px] flex items-center justify-center gap-1.5 hover:bg-accent-dark transition-colors">
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <button type="button" onClick={handleFinish} disabled={finishing}
            className="w-full h-12 rounded-full bg-accent text-bg font-body font-semibold text-[15px] hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
            {finishing ? 'Enregistrement…' : 'Terminer la séance'}
          </button>
        </div>
      </div>

      {/* ── Rest timer overlay ──────────────────────────────────────── */}
      {restTimer !== null && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-elevated border-t-2 border-accent rounded-t-[24px] px-5 pt-4 pb-6 shadow-2xl">
          {/* Label */}
          <p className="font-body text-[11px] uppercase tracking-widest text-accent font-medium mb-3">
            Récupération
          </p>

          <div className="flex items-center gap-5">
            {/* Circle */}
            <div className="relative w-[80px] h-[80px] shrink-0">
              <svg viewBox="0 0 80 80" className="w-[80px] h-[80px] -rotate-90">
                <circle cx="40" cy="40" r={OV_R} fill="none" stroke="#1A221A" strokeWidth="5" />
                <circle
                  cx="40" cy="40" r={OV_R}
                  fill="none" stroke="#14B8A6" strokeWidth="5"
                  strokeDasharray={OV_CIRCUMFERENCE}
                  strokeDashoffset={ovDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-bold text-[22px] text-accent tabular-nums leading-none">
                  {restTimer}
                </span>
              </div>
            </div>

            {/* Presets + skip */}
            <div className="flex-1 flex flex-col gap-2.5">
              <div className="flex gap-1.5 flex-wrap">
                {REST_PRESETS.map((s) => (
                  <button key={s} type="button"
                    onClick={() => { setRestDuration(s); setRestTimer(s) }}
                    className={cn(
                      'px-3 py-1.5 rounded-full font-body text-[12px] font-medium border transition-colors',
                      restDuration === s
                        ? 'bg-accent border-accent text-bg'
                        : 'bg-surface border-border text-text2 hover:border-border-hi',
                    )}>
                    {s}s
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setRestTimer(null)}
                className="self-end flex items-center gap-1 font-body text-[13px] text-text2 hover:text-text1 transition-colors">
                Passer →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
