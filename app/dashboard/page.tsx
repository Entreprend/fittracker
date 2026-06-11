import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import BackgroundImage from '@/components/ui/BackgroundImage'

const ALL_MUSCLE_GROUPS = [
  'pectoraux', 'dos', 'epaules', 'biceps', 'triceps',
  'quadriceps', 'ischio_jambiers', 'fessiers', 'mollets',
  'abdominaux', 'cardio',
] as const
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import WeekStreak from '@/components/dashboard/WeekStreak'
import StatCard from '@/components/dashboard/StatCard'
import WorkoutCard from '@/components/workouts/WorkoutCard'
import VolumeChart, { type VolumeDataPoint } from '@/components/dashboard/VolumeChart'
import AIAdviceCard from '@/components/dashboard/AIAdviceCard'
import type { WorkoutCardData } from '@/components/workouts/WorkoutCard'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(hour: number): string {
  if (hour >= 6 && hour < 12)  return 'Bonjour'
  if (hour >= 12 && hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

function getMondayISO(date: Date): string {
  const d = new Date(date)
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay()
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

function sbFetch(path: string) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey':        SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    cache: 'no-store',
  })
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getDashboardData(userId: string, userEmail: string) {
  const today = new Date()
  const todayISO      = today.toISOString().split('T')[0]
  const weekStartISO  = getMondayISO(today)
  const prevWeekStart = getMondayISO(new Date(today.getTime() - 7 * 86400_000))
  const eightWeeksAgo = new Date(today.getTime() - 56 * 86400_000).toISOString().split('T')[0]

  const [profileRes, workoutsRes] = await Promise.all([
    sbFetch(`profiles?select=full_name,username&user_id=eq.${userId}&limit=1`),
    sbFetch(`workouts?select=id,name,date,duration_min,total_volume_kg,status,workout_exercises(exercises(name,muscle_group))&user_id=eq.${userId}&status=eq.completed&date=gte.${eightWeeksAgo}&date=lte.${todayISO}&order=date.desc`),
  ])

  const profileRows  = profileRes.ok  ? await profileRes.json()  : []
  const workoutsData = workoutsRes.ok ? await workoutsRes.json() : []

  const profile  = Array.isArray(profileRows)  ? profileRows[0]  ?? null : null
  const workouts = Array.isArray(workoutsData) ? workoutsData             : []

  type RawExercise = { name: string; muscle_group?: string }
  type RawWorkout  = {
    id: string; name: string; date: string; duration_min: number | null
    total_volume_kg: number | null; status: string
    workout_exercises: { exercises: RawExercise | RawExercise[] | null }[]
  }

  const thisWeek = (workouts as RawWorkout[]).filter((w) => w.date >= weekStartISO)
  const prevWeek = (workouts as RawWorkout[]).filter((w) => w.date >= prevWeekStart && w.date < weekStartISO)

  const weekVolume     = Math.round(thisWeek.reduce((s, w) => s + (w.total_volume_kg ?? 0), 0))
  const prevWeekVolume = Math.round(prevWeek.reduce((s, w) => s + (w.total_volume_kg ?? 0), 0))
  const workoutDatesThisWeek = [...new Set(thisWeek.map((w) => w.date))]

  // ── Last workout ─────────────────────────────────────────────────────────────
  const lastRaw = (workouts as RawWorkout[])[0] ?? null
  let lastWorkout: WorkoutCardData | null = null
  if (lastRaw) {
    const exerciseNames = lastRaw.workout_exercises.flatMap((we) => {
      const ex = we.exercises
      if (!ex) return []
      return [Array.isArray(ex) ? ex[0]?.name : ex.name].filter((n): n is string => !!n)
    })
    lastWorkout = {
      id:               lastRaw.id,
      name:             lastRaw.name,
      date:             lastRaw.date,
      duration_minutes: lastRaw.duration_min,
      total_volume_kg:  lastRaw.total_volume_kg,
      exercise_names:   exerciseNames,
      status:           lastRaw.status,
    }
  }

  // ── 8-week volume chart ───────────────────────────────────────────────────────
  const volumeByWeek: Record<string, number> = {}
  for (const w of workouts as RawWorkout[]) {
    const wkISO = getMondayISO(new Date(w.date))
    volumeByWeek[wkISO] = (volumeByWeek[wkISO] ?? 0) + (w.total_volume_kg ?? 0)
  }
  const chartData: VolumeDataPoint[] = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (7 - i) * 7)
    const wkISO = getMondayISO(d)
    return { week: `S${i + 1}`, volume: Math.round(volumeByWeek[wkISO] ?? 0), isCurrent: wkISO === weekStartISO }
  })

  // ── Muscle groups this week ───────────────────────────────────────────────────
  const workedGroups = [...new Set(
    thisWeek.flatMap((w) =>
      w.workout_exercises.flatMap((we) => {
        const ex = Array.isArray(we.exercises) ? we.exercises[0] : we.exercises
        return ex?.muscle_group ? [ex.muscle_group] : []
      }),
    ),
  )]
  const missingGroups = ALL_MUSCLE_GROUPS.filter((g) => !workedGroups.includes(g))

  return {
    firstName: (() => {
      if (profile?.full_name?.trim()) return profile.full_name.trim().split(' ')[0]
      const u = profile?.username?.trim() ?? ''
      if (u && !u.includes('@') && !u.includes('.')) return u
      return ''
    })(),
    workoutDatesThisWeek,
    weekVolume,
    prevWeekVolume,
    weekWorkoutCount: thisWeek.length,
    lastWorkout,
    chartData,
    workedGroups,
    missingGroups,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let data: Awaited<ReturnType<typeof getDashboardData>>
  try {
    data = await getDashboardData(user.id, user.email ?? '')
  } catch (err) {
    console.error('[DashboardPage] getDashboardData failed:', err)
    data = {
      firstName: '',
      workoutDatesThisWeek: [],
      weekVolume: 0,
      prevWeekVolume: 0,
      weekWorkoutCount: 0,
      lastWorkout: null,
      chartData: [],
      workedGroups: [],
      missingGroups: [...ALL_MUSCLE_GROUPS],
    }
  }

  const { firstName, workoutDatesThisWeek, weekVolume, prevWeekVolume, weekWorkoutCount, lastWorkout, chartData, workedGroups, missingGroups } = data

  const volumeDelta =
    prevWeekVolume > 0
      ? `${weekVolume >= prevWeekVolume ? '+' : ''}${Math.round(((weekVolume - prevWeekVolume) / prevWeekVolume) * 100)}% vs semaine passée`
      : undefined

  const volumeDeltaType =
    weekVolume > prevWeekVolume ? 'positive' : weekVolume < prevWeekVolume ? 'negative' : 'neutral'

  const hasChartData = chartData.some((d) => d.volume > 0)
  const greeting     = getGreeting(new Date().getHours())

  return (
    <AppShell>
      <BackgroundImage pattern="dots" />
      <div className="px-4 py-5 flex flex-col gap-6">

        {/* Salutation */}
        <div className="flex flex-col gap-0.5">
          <h1 className="font-display font-bold text-[24px] text-text1 leading-tight">
            {greeting}{firstName ? ` ${firstName}` : ''}
          </h1>
          <p className="font-body text-[14px] text-text3">Tableau de bord</p>
        </div>

        {/* Week streak */}
        <WeekStreak workoutDates={workoutDatesThisWeek} goal={5} />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Volume semaine"
            value={weekVolume > 0 ? `${weekVolume} kg` : '—'}
            delta={volumeDelta}
            deltaType={volumeDeltaType}
          />
          <StatCard
            label="Séances"
            value={weekWorkoutCount}
            delta={weekWorkoutCount > 0 ? 'cette semaine' : 'aucune séance'}
            deltaType="neutral"
          />
        </div>

        {/* Volume chart */}
        {hasChartData && (
          <div className="bg-surface border border-border rounded-[20px] p-4 flex flex-col gap-3">
            <span className="font-body text-[11px] uppercase tracking-widest text-text3">
              Volume 8 semaines
            </span>
            <VolumeChart data={chartData} />
          </div>
        )}

        {/* Conseil IA — client component, charge après le rendu */}
        {weekWorkoutCount > 0 && (
          <AIAdviceCard
            weekVolume={weekVolume}
            prevWeekVolume={prevWeekVolume}
            weekWorkouts={weekWorkoutCount}
            workedGroups={workedGroups}
            missingGroups={missingGroups}
            topExercise={null}
            stagnatingExercise={null}
          />
        )}

        {/* Dernière séance */}
        {lastWorkout && (
          <div className="flex flex-col gap-2.5">
            <span className="font-body text-[11px] uppercase tracking-widest text-text3">
              Dernière séance
            </span>
            <WorkoutCard workout={lastWorkout} />
          </div>
        )}

        {/* CTA */}
        <Link
          href="/workouts/new"
          className="flex items-center justify-center gap-2 h-[52px] w-full rounded-full bg-accent text-bg font-body font-semibold text-[15px] hover:bg-accent-dark transition-colors active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Nouvelle séance
        </Link>

        <div className="h-2" />
      </div>
    </AppShell>
  )
}
