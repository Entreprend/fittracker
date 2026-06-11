import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import ProgressClient from './ProgressClient'
import BackgroundImage from '@/components/ui/BackgroundImage'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

function sbFetch(path: string) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey':        SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    cache: 'no-store',
  })
}

// ─── Exported types ────────────────────────────────────────────────────────────

export interface ChargeItem {
  exerciseId: string
  name: string
  muscleGroup: string
  firstWeight: number
  bestWeight: number
  progressPct: number
  history: { date: string; maxWeight: number }[]
}

export interface BWItem {
  id: string
  weight_kg: number
  date: string
}

export interface PhotoItem {
  id: string
  image_url: string
  date: string
}

// ─── Raw types ─────────────────────────────────────────────────────────────────

type RawSet      = { weight_kg: number | null }
type RawExercise = { id: string; name: string; muscle_group: string }
type RawWE       = { exercise_id: string; exercises: RawExercise | RawExercise[] | null; sets: RawSet[] }
type RawWorkout  = { id: string; date: string; workout_exercises: RawWE[] }

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getProgressData(userId: string) {
  const [workoutsRes, bwRes, photosRes] = await Promise.all([
    sbFetch(`workouts?select=id,date,workout_exercises(exercise_id,exercises(id,name,muscle_group),sets(weight_kg))&user_id=eq.${userId}&status=eq.completed&order=date.asc`),
    sbFetch(`body_weights?select=id,weight_kg,date&user_id=eq.${userId}&order=date.asc`),
    sbFetch(`progress_photos?select=id,image_url,date&user_id=eq.${userId}&order=date.desc`),
  ])

  const workoutsData = workoutsRes.ok ? await workoutsRes.json() : []
  const bwData       = bwRes.ok       ? await bwRes.json()       : []
  const photosData   = photosRes.ok   ? await photosRes.json()   : []

  // ── Charges ──────────────────────────────────────────────────────────────────

  const workouts: RawWorkout[] = Array.isArray(workoutsData) ? workoutsData : []

  const exerciseMap = new Map<
    string,
    { name: string; muscleGroup: string; dateMap: Map<string, number> }
  >()

  for (const workout of workouts) {
    for (const we of workout.workout_exercises) {
      const exRaw = we.exercises
      if (!exRaw) continue
      const ex: RawExercise = Array.isArray(exRaw) ? exRaw[0] : exRaw
      if (!ex) continue

      const maxWeight = Math.max(0, ...we.sets.map((s) => s.weight_kg ?? 0))
      if (maxWeight === 0) continue

      if (!exerciseMap.has(ex.id)) {
        exerciseMap.set(ex.id, { name: ex.name, muscleGroup: ex.muscle_group, dateMap: new Map() })
      }
      const entry = exerciseMap.get(ex.id)!
      const current = entry.dateMap.get(workout.date) ?? 0
      if (maxWeight > current) entry.dateMap.set(workout.date, maxWeight)
    }
  }

  const charges: ChargeItem[] = []
  for (const [exId, { name, muscleGroup, dateMap }] of exerciseMap.entries()) {
    const history = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, maxWeight]) => ({ date, maxWeight }))
    if (history.length < 1) continue
    const firstWeight = history[0].maxWeight
    const bestWeight  = Math.max(...history.map((h) => h.maxWeight))
    const progressPct = Math.round(((bestWeight - firstWeight) / firstWeight) * 100)
    charges.push({ exerciseId: exId, name, muscleGroup, firstWeight, bestWeight, progressPct, history })
  }
  charges.sort((a, b) => b.progressPct - a.progressPct)

  const bodyWeights: BWItem[]  = Array.isArray(bwData)     ? bwData     : []
  const photos:      PhotoItem[] = Array.isArray(photosData) ? photosData : []

  return { charges, bodyWeights, photos }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProgressPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let charges: ChargeItem[]  = []
  let bodyWeights: BWItem[]  = []
  let photos: PhotoItem[]    = []

  try {
    ;({ charges, bodyWeights, photos } = await getProgressData(user.id))
  } catch (err) {
    console.error('[ProgressPage] getProgressData failed:', err)
  }

  return (
    <AppShell title="Progression" hideAvatar>
      <BackgroundImage pattern="circles" />
      <ProgressClient
        userId={user.id}
        charges={charges}
        bodyWeights={bodyWeights}
        photos={photos}
      />
    </AppShell>
  )
}
