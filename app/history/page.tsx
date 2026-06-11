import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import HistoryClient from './HistoryClient'
import type { WorkoutCardData } from '@/components/workouts/WorkoutCard'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getHistory(userId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/workouts?select=id,name,date,duration_min,total_volume_kg,status,workout_exercises(exercises(name,muscle_group))&user_id=eq.${userId}&status=eq.completed&order=date.desc`,
    {
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      cache: 'no-store',
    },
  )

  if (!res.ok) {
    console.error('[getHistory] fetch error', res.status, await res.text())
    return []
  }

  const data = await res.json()

  type RawRow = {
    id: string
    name: string
    date: string
    duration_min: number | null
    total_volume_kg: number | null
    status: string
    workout_exercises: {
      exercises: { name: string; muscle_group: string } | { name: string; muscle_group: string }[] | null
    }[]
  }

  return (Array.isArray(data) ? data as RawRow[] : []).map(
    (row): WorkoutCardData & { muscleGroups: string[]; hasPR: boolean } => {
      const exerciseNames: string[] = []
      const muscleGroups: string[] = []

      row.workout_exercises.forEach((we) => {
        const ex = we.exercises
        if (!ex) return
        const single = Array.isArray(ex) ? ex[0] : ex
        if (!single) return
        if (!exerciseNames.includes(single.name)) exerciseNames.push(single.name)
        if (!muscleGroups.includes(single.muscle_group)) muscleGroups.push(single.muscle_group)
      })

      return {
        id:               row.id,
        name:             row.name,
        date:             row.date,
        duration_minutes: row.duration_min,
        total_volume_kg:  row.total_volume_kg,
        status:           row.status,
        exercise_names:   exerciseNames,
        muscleGroups,
        hasPR: false,
      }
    },
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let workouts: Awaited<ReturnType<typeof getHistory>> = []
  try {
    workouts = await getHistory(user.id)
  } catch (err) {
    console.error('[HistoryPage] getHistory failed:', err)
  }

  return (
    <AppShell hideAvatar>
      <HistoryClient workouts={workouts} />
    </AppShell>
  )
}
