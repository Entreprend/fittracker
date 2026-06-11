"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const GYM_IMAGE = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80'
const OVERLAY   = 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(10,15,10,0.95) 100%)'

// ─── Shared components ────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 bg-accent rounded-[10px] flex items-center justify-center shrink-0">
        <Dumbbell className="w-[18px] h-[18px] text-bg" />
      </div>
      <span className="font-display text-[18px] font-bold leading-none">
        <span className="text-text1">Fit</span>
        <span className="text-accent">tracker</span>
      </span>
    </div>
  )
}

interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: boolean
  right?: React.ReactNode
}

function FieldInput({ label, error, right, ...props }: FieldInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-[12px] font-medium text-text2">{label}</label>
      <div className="relative">
        <input
          className={cn(
            'w-full h-[52px] bg-elevated border rounded-[14px] px-4 font-body text-[15px] text-text1',
            'placeholder:text-text3 outline-none transition-colors',
            'focus:border-accent focus:ring-2 focus:ring-accent/20',
            error ? 'border-danger' : 'border-border',
            right && 'pr-12',
          )}
          {...props}
        />
        {right && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : authError.message,
      )
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden flex flex-col md:flex-row bg-bg">

      {/* ── Image panel ───────────────────────────────────────────────── */}
      <div className="relative h-[40vh] shrink-0 md:h-full md:w-[55%] overflow-hidden">
        {/* Gym background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={GYM_IMAGE}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: OVERLAY }} />

        {/* Mobile — logo centré au milieu de l'image */}
        <div className="md:hidden absolute inset-0 flex items-center justify-center">
          <Logo />
        </div>

        {/* Desktop — logo en haut à gauche + citation en bas */}
        <div className="hidden md:flex absolute inset-0 flex-col justify-between pt-10 px-10 pb-12">
          <Logo />
          <div className="flex flex-col gap-2">
            <span className="font-body text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">
              Fittracker
            </span>
            <blockquote className="font-body italic text-sm text-white/80 leading-relaxed max-w-[300px]">
              La progression n'est pas un accident. C'est une décision.
            </blockquote>
          </div>
        </div>
      </div>

      {/* ── Form panel ────────────────────────────────────────────────── */}
      <div className="flex-1 md:w-[45%] flex flex-col justify-center md:overflow-y-auto">
        <div className="w-full max-w-[400px] mx-auto px-6 py-6 md:py-0 flex flex-col gap-6 md:gap-7">

          {/* Desktop — logo au-dessus du formulaire */}
          <div className="hidden md:block">
            <Logo />
          </div>

          {/* Titre */}
          <div className="flex flex-col gap-1.5">
            <h1 className="font-display font-bold text-[30px] text-text1 leading-tight">
              Bon retour
            </h1>
            <p className="font-body text-[14px] text-text3">
              Connecte-toi pour continuer
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldInput
              label="Adresse email"
              type="email"
              placeholder="toi@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <FieldInput
              label="Mot de passe"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              right={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="text-text3 hover:text-text2 transition-colors p-1"
                  aria-label={showPw ? 'Masquer' : 'Afficher'}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              }
            />

            {error && (
              <p className="text-danger text-[13px] font-body text-center -mt-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'mt-1 h-[52px] w-full rounded-full bg-accent text-bg font-body font-semibold text-[15px]',
                'transition-all active:scale-[0.98]',
                loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-accent-dark',
              )}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          {/* Lien register */}
          <p className="text-center font-body text-[13px] text-text3">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-accent hover:text-accent-dark font-medium transition-colors">
              Créer un compte
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
