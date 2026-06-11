"use client"

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { AdviceRequest } from '@/app/api/ai/advice/route'

interface AIAdviceCardProps extends AdviceRequest {}

export default function AIAdviceCard(props: AIAdviceCardProps) {
  const [advice, setAdvice]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchAdvice() {
      try {
        const res = await fetch('/api/ai/advice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(props),
        })
        const data = await res.json()
        if (!cancelled) setAdvice(data.advice ?? null)
      } catch {
        if (!cancelled)
          setAdvice("Continue sur ta lancée — la régularité est la clé du progrès.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAdvice()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-accent-dim border border-accent/20 rounded-[20px] p-4 flex gap-3">
      {/* Icône */}
      <div className="w-8 h-8 bg-accent/20 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4 text-accent" />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="font-body text-[11px] uppercase tracking-widest text-accent font-medium leading-none">
          Conseil IA
        </span>

        {loading ? (
          <div className="flex flex-col gap-1.5 mt-1.5">
            <div className="h-3 bg-accent/10 rounded-full animate-pulse w-full" />
            <div className="h-3 bg-accent/10 rounded-full animate-pulse w-4/5" />
            <div className="h-3 bg-accent/10 rounded-full animate-pulse w-3/5" />
          </div>
        ) : (
          <p className="font-body text-[13px] text-text2 leading-relaxed mt-1">
            {advice}
          </p>
        )}
      </div>
    </div>
  )
}
