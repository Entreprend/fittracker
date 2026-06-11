'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

import type { ProfileData, StatsData } from './page'

// ─── Labels ───────────────────────────────────────────────────────────────────

const GOAL_LABELS: Record<string, string> = {
  prise_masse: 'Prise de masse',
  perte_poids: 'Perte de poids',
  force: 'Force',
  endurance: 'Endurance',
  maintien: 'Maintien',
}

const LEVEL_LABELS: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  profile: ProfileData
  stats: StatsData
  currentWeight: number | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileClient({ profile, stats, currentWeight }: Props) {
  const router = useRouter()
  const supabase = createClient()

  // Mutable profile fields
  const [localWeight, setLocalWeight] = useState(profile.weight_kg)
  const [localHeight, setLocalHeight] = useState(profile.height_cm)
  const [localAge, setLocalAge] = useState(profile.age)

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editWeight, setEditWeight] = useState(profile.weight_kg?.toString() ?? '')
  const [editHeight, setEditHeight] = useState(profile.height_cm?.toString() ?? '')
  const [editAge, setEditAge] = useState(profile.age?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleEditStart() {
    setEditWeight(localWeight?.toString() ?? '')
    setEditHeight(localHeight?.toString() ?? '')
    setEditAge(localAge?.toString() ?? '')
    setIsEditing(true)
  }

  function handleEditCancel() {
    setIsEditing(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const weight_kg = editWeight ? parseFloat(editWeight) : null
      const height_cm = editHeight ? parseFloat(editHeight) : null
      const age = editAge ? parseInt(editAge, 10) : null

      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: profile.id, weight_kg, height_cm, age }),
      })

      setLocalWeight(isNaN(weight_kg as number) ? null : weight_kg)
      setLocalHeight(isNaN(height_cm as number) ? null : height_cm)
      setLocalAge(isNaN(age as number) ? null : age)
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // ── Goal progress ────────────────────────────────────────────────────────────

  const currentW = currentWeight
  const targetW = profile.target_weight_kg
  const showGoalProgress = currentW !== null && targetW !== null

  let goalProgressPct = 0
  let goalRemaining = ''
  if (showGoalProgress && currentW !== null && targetW !== null) {
    goalProgressPct = Math.round(
      (Math.min(currentW, targetW) / Math.max(currentW, targetW)) * 100,
    )
    const diff = Math.round(Math.abs(targetW - currentW) * 10) / 10
    if (targetW < currentW) {
      goalRemaining = `-${diff} kg restants`
    } else if (targetW > currentW) {
      goalRemaining = `+${diff} kg restants`
    } else {
      goalRemaining = 'Objectif atteint !'
    }
  }

  // ── Display name ─────────────────────────────────────────────────────────────

  const displayName = profile.firstName ?? profile.email.split('@')[0] ?? 'Athlète'
  const initials = getInitials(displayName)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 px-4 py-0">

      {/* ── Header visuel ─────────────────────────────────────────────────── */}
      <div className="relative -mx-4">
        {/* Bannière de fond */}
        <div
          className="h-[120px]"
          style={{ background: 'linear-gradient(135deg, #0A1010 0%, #102820 50%, #0A1A18 100%)' }}
        />
        {/* Avatar centré, débordant en bas */}
        <div className="absolute -bottom-[30px] left-1/2 -translate-x-1/2">
          <div className="w-[60px] h-[60px] rounded-full bg-accent border-[3px] border-bg flex items-center justify-center shadow-lg">
            <span className="font-display font-bold text-[26px] text-bg leading-none">
              {initials}
            </span>
          </div>
        </div>
      </div>

      {/* Nom + badges sous l'avatar */}
      <div className="pt-[38px] flex flex-col items-center gap-2">
        <span className="font-display font-bold text-[20px] text-text1 text-center">
          {displayName}
        </span>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {profile.level && (
            <span className="bg-elevated border border-border rounded-full px-3 py-1 font-body text-[12px] text-text2">
              {LEVEL_LABELS[profile.level] ?? profile.level}
            </span>
          )}
          {profile.goal && (
            <span className="bg-elevated border border-border rounded-full px-3 py-1 font-body text-[12px] text-text2">
              {GOAL_LABELS[profile.goal] ?? profile.goal}
            </span>
          )}
        </div>
      </div>

      {/* ── Bilan total ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <h2 className="font-body text-[11px] uppercase tracking-widest text-text3">
          Bilan total
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface border border-border rounded-[20px] p-4 flex flex-col gap-1">
            <span className="font-body text-[11px] uppercase tracking-widest text-text3">
              Séances
            </span>
            <span className="font-display font-bold text-[24px] text-text1">
              {stats.totalWorkouts}
            </span>
          </div>
          <div className="bg-surface border border-border rounded-[20px] p-4 flex flex-col gap-1">
            <span className="font-body text-[11px] uppercase tracking-widest text-text3">
              Volume
            </span>
            <span className="font-display font-bold text-[24px] text-text1">
              {(stats.totalVolumeKg / 1000).toFixed(1)} t
            </span>
          </div>
          <div className="bg-surface border border-border rounded-[20px] p-4 flex flex-col gap-1">
            <span className="font-body text-[11px] uppercase tracking-widest text-text3">
              PRs
            </span>
            <span className="font-display font-bold text-[24px] text-text1">
              {stats.totalPRs}
            </span>
          </div>
          <div className="bg-surface border border-border rounded-[20px] p-4 flex flex-col gap-1">
            <span className="font-body text-[11px] uppercase tracking-widest text-text3">
              Temps
            </span>
            <span className="font-display font-bold text-[24px] text-text1">
              {Math.round(stats.totalMinutes / 60)} h
            </span>
          </div>
        </div>
      </div>

      {/* ── Mensurations ──────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-[20px] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-[16px] text-text1">
            Mensurations
          </h2>
          {!isEditing && (
            <button
              type="button"
              onClick={handleEditStart}
              className="font-body text-[13px] text-accent"
            >
              Éditer
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-[12px] text-text3">Poids (kg)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="ex. 75"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                className="h-11 rounded-[14px] bg-elevated border border-border px-4 font-body text-[15px] text-text1 placeholder:text-text3 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-[12px] text-text3">Taille (cm)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="ex. 175"
                value={editHeight}
                onChange={(e) => setEditHeight(e.target.value)}
                className="h-11 rounded-[14px] bg-elevated border border-border px-4 font-body text-[15px] text-text1 placeholder:text-text3 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-[12px] text-text3">Âge (ans)</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="ex. 25"
                value={editAge}
                onChange={(e) => setEditAge(e.target.value)}
                className="h-11 rounded-[14px] bg-elevated border border-border px-4 font-body text-[15px] text-text1 placeholder:text-text3 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="h-12 w-full rounded-full bg-accent text-bg font-body font-semibold text-[15px] disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={handleEditCancel}
              className="font-body text-[13px] text-text3 text-center"
            >
              Annuler
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between py-1 border-b border-border">
              <span className="font-body text-[13px] text-text3">Poids</span>
              <span className="font-body text-[15px] text-text1 font-medium">
                {localWeight != null ? `${localWeight} kg` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border">
              <span className="font-body text-[13px] text-text3">Taille</span>
              <span className="font-body text-[15px] text-text1 font-medium">
                {localHeight != null ? `${localHeight} cm` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="font-body text-[13px] text-text3">Âge</span>
              <span className="font-body text-[15px] text-text1 font-medium">
                {localAge != null ? `${localAge} ans` : '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Objectif poids ────────────────────────────────────────────────── */}
      {showGoalProgress && currentW !== null && targetW !== null && (
        <div className="bg-surface border border-border rounded-[20px] p-4 flex flex-col gap-3">
          <h2 className="font-display font-bold text-[16px] text-text1">
            Objectif poids
          </h2>
          <div className="flex items-center justify-between">
            <span className="font-body text-[15px] text-text1 font-medium">
              {currentW} kg
            </span>
            <span className="font-body text-[13px] text-text3">→</span>
            <span className="font-body text-[15px] text-accent font-semibold">
              {targetW} kg
            </span>
          </div>
          <div className="h-2 bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${goalProgressPct}%` }}
            />
          </div>
          <p className="font-body text-[12px] text-text3 text-center">
            {goalRemaining}
          </p>
        </div>
      )}

      {/* ── Paramètres ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pb-5">
        <h2 className="font-body text-[11px] uppercase tracking-widest text-text3">
          Paramètres
        </h2>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full h-12 rounded-full bg-elevated border border-danger/20 text-danger font-body font-semibold text-[15px] hover:bg-danger/10 transition-colors"
        >
          Déconnexion
        </button>
      </div>

      <div className="h-2" />
    </div>
  )
}
