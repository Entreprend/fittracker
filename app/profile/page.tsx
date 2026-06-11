import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import ProfileClient from './ProfileClient'

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

export interface ProfileData {
  id: string
  firstName: string | null
  email: string
  weight_kg: number | null
  height_cm: number | null
  age: number | null
  goal: string | null
  level: string | null
  target_weight_kg: number | null
}

export interface StatsData {
  totalWorkouts: number
  totalVolumeKg: number
  totalMinutes: number
  totalPRs: number
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getProfileData(userId: string, userEmail: string) {
  const [profileRes, workoutsRes, bwRes] = await Promise.all([
    sbFetch(`profiles?select=id,email,first_name,weight_kg,height_cm,age,goal,level,target_weight_kg&id=eq.${userId}&limit=1`),
    sbFetch(`workouts?select=duration_min,total_volume_kg&user_id=eq.${userId}&status=eq.completed`),
    sbFetch(`body_weights?select=weight_kg&user_id=eq.${userId}&order=date.desc&limit=1`),
  ])

  const profileRows = profileRes.ok ? await profileRes.json() : []
  const workoutsData = workoutsRes.ok ? await workoutsRes.json() : []
  const bwRows = bwRes.ok ? await bwRes.json() : []

  const profileRaw = Array.isArray(profileRows) ? profileRows[0] ?? null : null

  const profile: ProfileData = {
    id:               profileRaw?.id ?? userId,
    firstName:        profileRaw?.first_name ?? null,
    email:            profileRaw?.email ?? userEmail,
    weight_kg:        profileRaw?.weight_kg ?? null,
    height_cm:        profileRaw?.height_cm ?? null,
    age:              profileRaw?.age ?? null,
    goal:             profileRaw?.goal ?? null,
    level:            profileRaw?.level ?? null,
    target_weight_kg: profileRaw?.target_weight_kg ?? null,
  }

  type RawWorkoutStat = { duration_min: number | null; total_volume_kg: number | null }
  const workouts: RawWorkoutStat[] = Array.isArray(workoutsData) ? workoutsData : []

  let totalVolumeKg = 0
  let totalMinutes = 0
  for (const w of workouts) {
    totalVolumeKg += w.total_volume_kg ?? 0
    totalMinutes  += w.duration_min    ?? 0
  }

  const stats: StatsData = {
    totalWorkouts: workouts.length,
    totalVolumeKg: Math.round(totalVolumeKg),
    totalMinutes,
    totalPRs: 0,
  }

  const bwRow = Array.isArray(bwRows) ? bwRows[0] ?? null : null
  const currentWeight: number | null = bwRow?.weight_kg ?? profile.weight_kg ?? null

  return { profile, stats, currentWeight }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { profile, stats, currentWeight } = await getProfileData(user.id, user.email ?? '')

  return (
    <AppShell title="Profil" hideAvatar>
      <ProfileClient profile={profile} stats={stats} currentWeight={currentWeight} />
    </AppShell>
  )
}
