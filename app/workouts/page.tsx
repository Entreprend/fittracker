import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import BackgroundImage from '@/components/ui/BackgroundImage'
import WorkoutListClient from './WorkoutListClient'
import type { WorkoutCardData } from '@/components/workouts/WorkoutCard'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─── Données ──────────────────────────────────────────────────────────────────

async function getWorkouts() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/workouts?select=id,name,date,duration_min,total_volume_kg,status&user_id=eq.${user.id}&order=date.desc,created_at.desc`,
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
  const data = await res.json()

  type RawRow = {
    id: string
    name: string
    date: string
    duration_min: number | null
    total_volume_kg: number | null
    status: string
  }

  const workouts: (WorkoutCardData & { muscleGroups: string[] })[] = (Array.isArray(data) ? data as RawRow[] : []).map(
    (row) => ({
      id: row.id,
      name: row.name,
      date: row.date,
      duration_minutes: row.duration_min,
      total_volume_kg: row.total_volume_kg,
      status: row.status,
      exercise_names: [],
      muscleGroups: [],
    }),
  )

  return workouts
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function WorkoutsPage() {
  let workouts: Awaited<ReturnType<typeof getWorkouts>> = []
  try {
    workouts = await getWorkouts()
  } catch (err) {
    if (
      (err instanceof Error && err.message === 'NEXT_REDIRECT') ||
      (err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')
    ) throw err
    console.error('[WorkoutsPage] getWorkouts failed:', err)
  }

  const headerRight = (
    <Link
      href="/workouts/new"
      className="w-8 h-8 bg-accent rounded-[10px] flex items-center justify-center hover:bg-accent-dark transition-colors"
      aria-label="Nouvelle séance"
    >
      <Plus className="w-4.5 h-4.5 text-bg" strokeWidth={2.5} />
    </Link>
  )

  return (
    <AppShell title="Séances" headerRight={headerRight} hideAvatar>
      <BackgroundImage pattern="diagonal" />
      <div className="flex flex-col gap-5 px-4 py-5">
        {workouts.length === 0 ? (
          <EmptyState />
        ) : (
          <WorkoutListClient workouts={workouts} />
        )}
      </div>
    </AppShell>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
      {/* Illustration SVG haltère */}
      <svg
        width="120"
        height="60"
        viewBox="0 0 120 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Plaque gauche externe */}
        <rect x="2"   y="10" width="13" height="40" rx="4" fill="#14B8A6" fillOpacity="0.25" />
        {/* Plaque gauche interne */}
        <rect x="15"  y="16" width="8"  height="28" rx="3" fill="#14B8A6" fillOpacity="0.55" />
        {/* Barre centrale */}
        <rect x="23"  y="24" width="74" height="12" rx="6" fill="#14B8A6" />
        {/* Plaque droite interne */}
        <rect x="97"  y="16" width="8"  height="28" rx="3" fill="#14B8A6" fillOpacity="0.55" />
        {/* Plaque droite externe */}
        <rect x="105" y="10" width="13" height="40" rx="4" fill="#14B8A6" fillOpacity="0.25" />
      </svg>

      <div className="flex flex-col gap-1.5">
        <p className="font-display font-bold text-[20px] text-text1">
          Ta première séance t'attend
        </p>
        <p className="font-body text-[14px] text-text3 max-w-[260px]">
          Commence par créer une séance et suis ta progression
        </p>
      </div>

      <Link
        href="/workouts/new"
        className="flex items-center gap-2 h-[52px] px-8 rounded-full bg-accent text-bg font-body font-semibold text-[15px] hover:bg-accent-dark transition-colors active:scale-[0.98]"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Créer ma première séance
      </Link>
    </div>
  )
}
