"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dumbbell,
  TrendingUp,
  Flame,
  Zap,
  Timer,
  Target,
  Sprout,
  Trophy,
  ArrowRight,
  Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Goal, Level } from '@/types/database'

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP1_IMAGE = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80'
const IMG_OVERLAY = 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(10,15,10,0.90) 100%)'
const TOTAL_STEPS = 3

const GOALS: { value: Goal; label: string; desc: string; icon: React.ElementType }[] = [
  { value: 'prise_masse', label: 'Prise de masse', desc: 'Gagner du muscle',       icon: TrendingUp },
  { value: 'perte_poids', label: 'Perte de poids', desc: 'Perdre de la graisse',   icon: Flame      },
  { value: 'force',       label: 'Force',           desc: 'Augmenter les charges',  icon: Zap        },
  { value: 'endurance',   label: 'Endurance',       desc: 'Cardio & résistance',    icon: Timer      },
  { value: 'maintien',    label: 'Maintien',        desc: 'Rester en forme',        icon: Target     },
]

const LEVELS: { value: Level; label: string; desc: string; icon: React.ElementType }[] = [
  { value: 'debutant',      label: 'Débutant',      desc: 'Moins de 6 mois', icon: Sprout   },
  { value: 'intermediaire', label: 'Intermédiaire', desc: '6 mois – 2 ans',  icon: Dumbbell },
  { value: 'avance',        label: 'Avancé',        desc: 'Plus de 2 ans',   icon: Trophy   },
]

// ─── Shared ───────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-accent rounded-[9px] flex items-center justify-center shrink-0">
        <Dumbbell className="w-[15px] h-[15px] text-bg" />
      </div>
      <span className="font-display text-[16px] font-bold leading-none">
        <span className="text-text1">Fit</span>
        <span className="text-accent">tracker</span>
      </span>
    </div>
  )
}

// ─── Step 1 – Mensurations ────────────────────────────────────────────────────

function NumericField({
  label, unit, value, onChange,
}: {
  label: string; unit: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-[12px] font-medium text-text2">{label}</label>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className={cn(
            'w-full h-[52px] bg-elevated border border-border rounded-[14px] px-4 pr-14',
            'font-body text-[15px] text-text1 placeholder:text-text3',
            'outline-none transition-colors appearance-none',
            'focus:border-accent focus:ring-2 focus:ring-accent/20',
          )}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-text3 font-body pointer-events-none">
          {unit}
        </span>
      </div>
    </div>
  )
}

function StepMeasurements({
  data, onChange,
}: {
  data: { weight: string; height: string; age: string }
  onChange: (k: 'weight' | 'height' | 'age', v: string) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-display font-bold text-[24px] text-text1 leading-tight">
          Tes mensurations
        </h2>
        <p className="font-body text-[14px] text-text3">
          Ces infos nous aident à personnaliser ton suivi.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <NumericField label="Poids actuel" unit="kg"  value={data.weight} onChange={(v) => onChange('weight', v)} />
        <NumericField label="Taille"       unit="cm"  value={data.height} onChange={(v) => onChange('height', v)} />
        <NumericField label="Âge"          unit="ans" value={data.age}    onChange={(v) => onChange('age', v)}    />
      </div>
    </div>
  )
}

// ─── Step 2 – Objectif ────────────────────────────────────────────────────────

function GoalCard({
  value, label, desc, icon: Icon, active, onSelect, fullWidth,
}: {
  value: Goal; label: string; desc: string; icon: React.ElementType
  active: boolean; onSelect: () => void; fullWidth?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex flex-col gap-3 p-4 rounded-[20px] border text-left transition-all active:scale-[0.97]',
        fullWidth && 'col-span-2',
        active
          ? 'border-accent bg-accent/10'
          : 'border-border bg-elevated hover:border-border-hi',
      )}
    >
      <div className={cn(
        'w-11 h-11 rounded-[13px] flex items-center justify-center',
        active ? 'bg-accent/20' : 'bg-bg',
      )}>
        <Icon
          className={cn('w-8 h-8', active ? 'text-accent' : 'text-text3')}
          strokeWidth={1.5}
        />
      </div>
      <div>
        <p className={cn('font-display font-bold text-[14px] leading-tight', active ? 'text-text1' : 'text-text2')}>
          {label}
        </p>
        <p className="font-body text-[11px] text-text3 mt-0.5">{desc}</p>
      </div>
      {active && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
          <Check className="w-3 h-3 text-bg" strokeWidth={3} />
        </div>
      )}
    </button>
  )
}

function StepGoal({ selected, onSelect }: { selected: Goal | null; onSelect: (g: Goal) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-display font-bold text-[24px] text-text1 leading-tight">Ton objectif</h2>
        <p className="font-body text-[14px] text-text3">On adaptera tes recommandations en fonction.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {GOALS.map(({ value, label, desc, icon }, i) => (
          <GoalCard
            key={value}
            value={value}
            label={label}
            desc={desc}
            icon={icon}
            active={selected === value}
            onSelect={() => onSelect(value)}
            fullWidth={i === GOALS.length - 1 && GOALS.length % 2 !== 0}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Step 3 – Niveau ──────────────────────────────────────────────────────────

function StepLevel({ selected, onSelect }: { selected: Level | null; onSelect: (l: Level) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-display font-bold text-[24px] text-text1 leading-tight">Ton niveau</h2>
        <p className="font-body text-[14px] text-text3">Sois honnête — tu peux le changer plus tard.</p>
      </div>
      <div className="flex flex-col gap-3">
        {LEVELS.map(({ value, label, desc, icon: Icon }) => {
          const active = selected === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              className={cn(
                'flex items-center gap-4 p-5 rounded-[20px] border text-left transition-all active:scale-[0.98]',
                active
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-elevated hover:border-border-hi',
              )}
            >
              <div className={cn(
                'w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0',
                active ? 'bg-accent/20' : 'bg-bg',
              )}>
                <Icon
                  className={cn('w-8 h-8', active ? 'text-accent' : 'text-text3')}
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('font-display font-bold text-[16px] leading-tight', active ? 'text-text1' : 'text-text2')}>
                  {label}
                </p>
                <p className="font-body text-[12px] text-text3 mt-0.5">{desc}</p>
              </div>
              {active && (
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-bg" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()

  const [step, setStep]               = useState(1)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [userId, setUserId]           = useState<string | null>(null)
  const [userEmail, setUserEmail]     = useState<string>('')
  const [userFirstName, setUserFirstName] = useState<string | null>(null)

  const [measurements, setMeasurements] = useState({ weight: '', height: '', age: '' })
  const [goal, setGoal]   = useState<Goal | null>(null)
  const [level, setLevel] = useState<Level | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      setUserEmail(user.email ?? '')
      setUserFirstName((user.user_metadata?.first_name as string | null) ?? null)
    })
  }, [router])

  function updateMeasurement(k: 'weight' | 'height' | 'age', v: string) {
    setMeasurements((prev) => ({ ...prev, [k]: v }))
  }

  function canProceed(): boolean {
    if (step === 1) return true
    if (step === 2) return goal !== null
    if (step === 3) return level !== null
    return false
  }

  async function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1)
      return
    }

    if (!userId) {
      setError('Session expirée. Reconnecte-toi.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:   userId,
          weight_kg: measurements.weight ? parseFloat(measurements.weight) : null,
          height_cm: measurements.height ? parseFloat(measurements.height) : null,
          age:       measurements.age    ? parseInt(measurements.age, 10)  : null,
          objective: goal,
          level,
        }),
      })

      if (!res.ok) {
        const body = await res.text()
        console.error('[onboarding] save failed:', body)
        throw new Error('save failed')
      }

      router.push('/dashboard')
    } catch {
      setError('Erreur lors de la sauvegarde. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  const progress = (step / TOTAL_STEPS) * 100

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* ── Barre de progression ─────────────────────────────────────── */}
      <div className="h-1 bg-elevated shrink-0">
        <div
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Zone scrollable ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Image illustrative — étape 1 seulement */}
        {step === 1 && (
          <div className="relative h-[25vh] overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={STEP1_IMAGE}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0" style={{ background: IMG_OVERLAY }} />
            <div className="absolute inset-0 flex items-start justify-between p-5">
              <Logo />
              <span className="font-body text-[12px] text-white/50 mt-1">
                {step} / {TOTAL_STEPS}
              </span>
            </div>
          </div>
        )}

        {/* Mini-header sans image (étapes 2 & 3) */}
        {step !== 1 && (
          <div className="flex items-center justify-between px-5 pt-6 pb-2">
            <Logo />
            <span className="font-body text-[13px] text-text3">{step} / {TOTAL_STEPS}</span>
          </div>
        )}

        {/* Contenu de l'étape */}
        <div className="px-5 pt-5 pb-6 max-w-[440px] mx-auto">
          {step === 1 && <StepMeasurements data={measurements} onChange={updateMeasurement} />}
          {step === 2 && <StepGoal selected={goal} onSelect={setGoal} />}
          {step === 3 && <StepLevel selected={level} onSelect={setLevel} />}
        </div>
      </div>

      {/* ── Bouton bas ───────────────────────────────────────────────── */}
      <div className="shrink-0 w-full max-w-[440px] mx-auto px-5 pt-3 pb-8">
        {error && (
          <p className="text-danger text-[13px] font-body text-center mb-3">{error}</p>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed() || loading}
          className={cn(
            'w-full h-[52px] rounded-full font-body font-semibold text-[15px]',
            'flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
            canProceed() && !loading
              ? 'bg-accent text-bg hover:bg-accent-dark'
              : 'bg-elevated text-text3 cursor-not-allowed',
          )}
        >
          {loading ? (
            'Sauvegarde…'
          ) : step < TOTAL_STEPS ? (
            <>Suivant <ArrowRight className="w-4 h-4" /></>
          ) : (
            <>Terminer <Check className="w-4 h-4" strokeWidth={2.5} /></>
          )}
        </button>

        {step === 1 && (
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="mt-3 w-full text-center font-body text-[13px] text-text3 hover:text-text2 transition-colors"
          >
            Passer pour l'instant
          </button>
        )}
      </div>

    </div>
  )
}
