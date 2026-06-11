'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Dumbbell } from 'lucide-react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [displayed, setDisplayed] = useState(children)

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      setDisplayed(children)
      setLoading(false)
    }, 400)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (loading) return (
    <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center z-50">
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
          <Dumbbell className="w-6 h-6 text-bg" />
        </div>
        <span className="font-display text-xl font-bold">
          <span className="text-white">Fit</span>
          <span className="text-accent">tracker</span>
        </span>
      </div>
    </div>
  )

  return <>{displayed}</>
}
