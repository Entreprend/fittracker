import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import WorkoutDetailClient from './WorkoutDetailClient'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─── Types ────────────────────────────────────────────────────────────────────

type RawSet = {
  id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  is_pr?: boolean
  completed: boolean
}

type RawExercise = { id: string; name: string; muscle_group: string }

type RawWorkoutExercise = {
  id: string
  order_index: number
  exercises: RawExercise | RawExercise[] | null
  sets: RawSet[]
}

type RawWorkout = {
  id: string
  name: string
  date: string
  duration_min: number | null
  total_volume_kg: number | null
  status: string
  created_at: string
  workout_exercises: RawWorkoutExercise[]
}

export type WorkoutDetail = {
  id: string
  name: string
  date: string
  duration_minutes: number | null
  total_volume_kg: number | null
  status: string
  created_at: string
  exercises: {
    weId: string
    exercise: { id: string; name: string; muscle_group: string }
    sets: RawSet[]
  }[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getWorkout(id: string): Promise<WorkoutDetail | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/workouts?select=id,name,date,duration_min,total_volume_kg,status,created_at,workout_exercises(id,order_index,exercises(id,name,muscle_group),sets(id,set_number,reps,weight_kg,completed))&id=eq.${id}&user_id=eq.${user.id}&limit=1`,
    {
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      cache: 'no-store',
      signal: controller.signal,
    },
  )
  clearTimeout(timeout)

  if (!res.ok) {
    console.error('[getWorkout] fetch error', res.status, await res.text())
    return null
  }

  const rows = await res.json()
  if (!Array.isArray(rows) || rows.length === 0) return null

  const raw = rows[0] as RawWorkout

  const exercises = raw.workout_exercises
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .flatMap((we) => {
      const ex = Array.isArray(we.exercises) ? we.exercises[0] : we.exercises
      if (!ex) return []
      return [
        {
          weId:     we.id,
          exercise: ex,
          sets:     (we.sets ?? []).slice().sort((a, b) => a.set_number - b.set_number),
        },
      ]
    })

  return {
    id:               raw.id,
    name:             raw.name,
    date:             raw.date,
    duration_minutes: raw.duration_min,
    total_volume_kg:  raw.total_volume_kg,
    status:           raw.status,
    created_at:       raw.created_at,
    exercises,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workout = await getWorkout(id)
  if (!workout) notFound()

  return (
    <AppShell title="Détail séance" showBack>
      <WorkoutDetailClient workout={workout} />
    </AppShell>
  )
}
