"use client"

import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getMuscleGroupLabel } from '@/lib/utils'
import SetInput, { type SetDraft } from './SetInput'
import { nanoid } from '@/lib/nanoid'

export interface ExerciseDraft {
  draftId: string
  exercise_id: string
  name: string
  muscle_group: string
  sets: SetDraft[]
}

interface ExerciseRowProps {
  draft: ExerciseDraft
  onChange: (updated: ExerciseDraft) => void
  onRemove: () => void
}

export default function ExerciseRow({ draft, onChange, onRemove }: ExerciseRowProps) {
  function addSet() {
    const prev = draft.sets.at(-1)
    onChange({
      ...draft,
      sets: [
        ...draft.sets,
        {
          id: nanoid(),
          reps: prev?.reps ?? '',
          weight_kg: prev?.weight_kg ?? '',
          completed: false,
        },
      ],
    })
  }

  function updateSet(idx: number, field: keyof Omit<SetDraft, 'id'>, value: string | boolean) {
    const sets = draft.sets.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s,
    )
    onChange({ ...draft, sets })
  }

  function removeSet(idx: number) {
    onChange({ ...draft, sets: draft.sets.filter((_, i) => i !== idx) })
  }

  return (
    <div className="bg-surface border border-border rounded-[20px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={cn(
              'shrink-0 px-2.5 py-0.5 rounded-full font-body text-[10px] font-medium border',
              'border-border text-text3 bg-elevated',
            )}
          >
            {getMuscleGroupLabel(draft.muscle_group)}
          </span>
          <p className="font-display font-bold text-[15px] text-text1 truncate">
            {draft.name}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center rounded-[8px] text-text3 hover:text-danger hover:bg-danger/10 transition-colors shrink-0 ml-2"
          aria-label="Supprimer l'exercice"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Séries */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {draft.sets.length === 0 ? (
          <p className="font-body text-[13px] text-text3 text-center py-2">
            Aucune série — ajoutes-en une ci-dessous.
          </p>
        ) : (
          draft.sets.map((set, idx) => (
            <SetInput
              key={set.id}
              setNumber={idx + 1}
              set={set}
              onUpdate={(field, value) => updateSet(idx, field, value)}
              onRemove={() => removeSet(idx)}
            />
          ))
        )}

        {/* Ajouter une série */}
        <button
          type="button"
          onClick={addSet}
          className="mt-1 flex items-center justify-center gap-1.5 w-full h-9 rounded-[10px] border border-dashed border-border-hi text-text3 hover:text-accent hover:border-accent transition-colors font-body text-[13px]"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter une série
        </button>
      </div>
    </div>
  )
}
