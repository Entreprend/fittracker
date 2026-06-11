"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// ─── Logo ─────────────────────────────────────────────────────────────────────

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shrink-0">
        <Dumbbell className="w-5 h-5 text-bg" />
      </div>
      <span className="font-display text-[18px] font-bold leading-none">
        <span className="text-text1">Fit</span>
        <span className="text-accent">tracker</span>
      </span>
    </div>
  )
}

// ─── UserAvatar ───────────────────────────────────────────────────────────────

function UserAvatar() {
  const [initials, setInitials] = useState<string>('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const name: string =
        user.user_metadata?.first_name ??
        user.email?.split('@')[0] ??
        '?'
      setInitials(name.slice(0, 2).toUpperCase())
    })
  }, [])

  return (
    <div
      aria-hidden
      className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0"
    >
      <span className="text-bg text-xs font-bold font-body select-none">
        {initials || '…'}
      </span>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  /** Titre de la page. Si absent, le Logo est affiché à la place. */
  title?: string
  /** Affiche un bouton retour à gauche (router.back()). */
  showBack?: boolean
  /** Contenu additionnel injecté dans le slot droit. */
  rightContent?: React.ReactNode
  /** Cache l'avatar utilisateur par défaut (utile sur sous-pages). */
  hideAvatar?: boolean
}

export default function Header({
  title,
  showBack = false,
  rightContent,
  hideAvatar = false,
}: HeaderProps) {
  const router = useRouter()

  return (
    <header
      className="relative z-50 shrink-0 flex items-end gap-3 px-4 pb-3 bg-surface border-b border-border"
      style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: 'calc(60px + env(safe-area-inset-top))' }}
    >
      {/* ← Bouton retour */}
      {showBack && (
        <button
          onClick={() => router.back()}
          className={cn(
            'w-8 h-8 -ml-1 flex items-center justify-center rounded-[10px]',
            'text-text2 hover:text-text1 hover:bg-elevated transition-colors',
          )}
          aria-label="Retour"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Centre : titre ou logo */}
      <div className="flex-1 min-w-0">
        {title ? (
          <h1 className="font-display font-bold text-[18px] text-text1 truncate leading-none">
            {title}
          </h1>
        ) : (
          <Logo />
        )}
      </div>

      {/* Droite : slot custom ou avatar par défaut */}
      <div className="flex items-center gap-2 shrink-0">
        {rightContent ?? (!hideAvatar && !showBack ? <UserAvatar /> : null)}
      </div>
    </header>
  )
}
