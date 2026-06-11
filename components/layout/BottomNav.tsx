"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Dumbbell, TrendingUp, History, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/dashboard', label: 'Accueil',    icon: Home },
  { href: '/workouts',  label: 'Séances',    icon: Dumbbell },
  { href: '/progress',  label: 'Progrès',    icon: TrendingUp },
  { href: '/history',   label: 'Historique', icon: History },
  { href: '/profile',   label: 'Profil',     icon: User },
] as const

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="relative z-50 shrink-0 bg-surface border-t border-border flex items-stretch px-1"
      style={{ height: 'calc(72px + env(safe-area-inset-bottom, 16px))', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-[5px] rounded-[10px] transition-colors',
              isActive ? 'text-accent' : 'text-text3 hover:text-text2',
            )}
          >
            <Icon
              className="w-[22px] h-[22px]"
              strokeWidth={isActive ? 2.5 : 1.75}
            />
            <span
              className={cn(
                'text-[10px] leading-none font-body font-medium',
                isActive ? 'text-accent' : 'text-text3',
              )}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
