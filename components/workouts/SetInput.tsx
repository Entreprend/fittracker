"use client"

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SetDraft {
  id: string
  reps: string
  weight_kg: string
  completed: boolean
}

interface SetInputProps {
  setNumber: number
  set: SetDraft
  onUpdate: (field: keyof Omit<SetDraft, 'id'>, value: string | boolean) => void
  onRemove: () => void
}

const inputCls = cn(
  'w-full h-10 bg-elevated border border-border rounded-[10px]',
  'font-body text-[15px] text-text1 text-center',
  'outline-none transition-colors appearance-none',
  'focus:border-accent focus:ring-2 focus:ring-accent/20',
  'placeholder:text-text3',
)

export default function SetInput({ setNumber, set, onUpdate, onRemove }: SetInputProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Numéro de série */}
      <div className="w-7 flex items-center justify-center shrink-0">
        <span
          className={cn(
            'font-body text-[13px] font-medium leading-none transition-colors',
            set.completed ? 'text-accent' : 'text-text3',
          )}
        >
          {setNumber}
        </span>
      </div>

      {/* Reps */}
      <div className="flex-1 flex flex-col gap-0.5">
        <span className="font-body text-[10px] text-text3 text-center uppercase tracking-wide">
          Reps
        </span>
        <input
          type="number"
          inputMode="numeric"
          value={set.reps}
          onChange={(e) => onUpdate('reps', e.target.value)}
          placeholder="—"
          className={inputCls}
        />
      </div>

      {/* Poids */}
      <div className="flex-1 flex flex-col gap-0.5">
        <span className="font-body text-[10px] text-text3 text-center uppercase tracking-wide">
          kg
        </span>
        <input
          type="number"
          inputMode="decimal"
          value={set.weight_kg}
          onChange={(e) => onUpdate('weight_kg', e.target.value)}
          placeholder="—"
          className={inputCls}
        />
      </div>

      {/* Fait / Supprimer */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <span className="font-body text-[10px] text-text3 text-center uppercase tracking-wide opacity-0">
          .
        </span>
        <button
          type="button"
          onClick={() => {
            if (set.completed) {
              onRemove()
            } else {
              onUpdate('completed', true)
            }
          }}
          className={cn(
            'w-10 h-10 rounded-[10px] flex items-center justify-center transition-colors border',
            set.completed
              ? 'bg-accent border-accent text-bg'
              : 'bg-elevated border-border text-text3 hover:border-border-hi',
          )}
          aria-label={set.completed ? 'Supprimer cette série' : 'Marquer comme faite'}
        >
          {set.completed ? (
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          ) : (
            <span className="font-body text-[11px] font-semibold text-text3">✓</span>
          )}
        </button>
      </div>
    </div>
  )
}
