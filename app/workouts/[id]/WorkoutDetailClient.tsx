"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Trash2, Clock, Dumbbell, CheckCircle2, Trophy } from 'lucide-react'
import { cn, formatDate, formatDuration, formatVolume, getMuscleGroupLabel } from '@/lib/utils'
import {
  Dialog,
  DialogClose,
  DialogContent,
} from '@/components/ui/dialog'
import type { WorkoutDetail } from './page'

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkoutDetailClient({ workout }: { workout: WorkoutDetail }) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  const isCompleted = workout.status === 'completed'

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/workouts/${workout.id}`, { method: 'DELETE' })
    } finally {
      router.push('/workouts')
    }
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-4 pb-12">

      {/* ── En-tête ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display font-bold text-[22px] text-text1 leading-tight flex-1 min-w-0">
            {workout.name}
          </h1>
          <span
            className={cn(
              'shrink-0 mt-1 px-2.5 py-1 rounded-full font-body text-[11px] font-semibold border',
              isCompleted
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-accent/10 border-accent/30 text-accent',
            )}
          >
            {isCompleted ? 'Terminée' : 'En cours'}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-body text-[13px] text-text2">{formatDate(workout.date)}</span>
          {workout.duration_minutes != null && (
            <>
              <span className="text-border-hi">·</span>
              <span className="font-body text-[13px] text-text2 flex items-center gap-1">
                <Clock className="w-3 h-3 text-text3" />
                {formatDuration(workout.duration_minutes)}
              </span>
            </>
          )}
          {workout.total_volume_kg != null && (
            <>
              <span className="text-border-hi">·</span>
              <span className="font-body text-[13px] text-text2 flex items-center gap-1">
                <Dumbbell className="w-3 h-3 text-text3" />
                {formatVolume(workout.total_volume_kg)}
              </span>
            </>
          )}
        </div>

      </div>

      {/* ── Démarrer (si séance non terminée) ────────────────────────── */}
      {!isCompleted && (
        <button
          type="button"
          onClick={() => router.push(`/workouts/${workout.id}/start`)}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-full bg-accent text-bg font-body font-semibold text-[15px] hover:bg-accent-dark transition-colors"
        >
          Démarrer la séance
        </button>
      )}

      {/* ── Exercices ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {workout.exercises.length === 0 ? (
          <p className="font-body text-[14px] text-text3 text-center py-8">
            Aucun exercice enregistré.
          </p>
        ) : (
          workout.exercises.map(({ weId, exercise, sets }) => (
            <div
              key={weId}
              className="bg-surface border border-border rounded-[20px] overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
                <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-elevated border border-border font-body text-[10px] text-text3">
                  {getMuscleGroupLabel(exercise.muscle_group)}
                </span>
                <p className="font-display font-bold text-[15px] text-text1 truncate">
                  {exercise.name}
                </p>
              </div>

              <div className="px-4 py-3">
                {sets.length === 0 ? (
                  <p className="font-body text-[13px] text-text3 text-center py-1">
                    Aucune série
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-[28px_1fr_1fr_52px] gap-x-2 pb-2 border-b border-border">
                      {['#', 'Reps', 'kg', ''].map((h, i) => (
                        <span key={i} className="font-body text-[10px] text-text3 uppercase tracking-wide text-center">
                          {h}
                        </span>
                      ))}
                    </div>

                    {sets.map((set) => (
                      <div
                        key={set.id}
                        className={cn(
                          'grid grid-cols-[28px_1fr_1fr_52px] gap-x-2 py-2.5 border-b border-border/40 last:border-0 items-center',
                          !set.completed && 'opacity-50',
                        )}
                      >
                        <span className="font-body text-[13px] text-text3 text-center">
                          {set.set_number}
                        </span>
                        <span className="font-body text-[14px] text-text1 text-center font-medium">
                          {set.reps ?? '—'}
                        </span>
                        <span className="font-body text-[14px] text-text1 text-center font-medium">
                          {set.weight_kg ?? 0} kg
                        </span>
                        <div className="flex items-center justify-center gap-1">
                          {set.is_pr && (
                            <span className="flex items-center gap-0.5 bg-warning/15 border border-warning/30 text-warning rounded-full px-1.5 py-0.5 font-body text-[9px] font-bold uppercase">
                              <Trophy className="w-2.5 h-2.5" />
                              PR
                            </span>
                          )}
                          {set.completed && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.push(`/workouts/new?duplicate=${workout.id}`)}
          className="flex items-center justify-center gap-2 h-12 rounded-full bg-elevated border border-border text-text1 font-body font-semibold text-[14px] hover:border-border-hi transition-colors"
        >
          <Copy className="w-4 h-4 text-text2" />
          Dupliquer cette séance
        </button>

        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="flex items-center justify-center gap-2 h-12 rounded-full bg-elevated border border-danger/20 text-danger font-body font-semibold text-[14px] hover:bg-danger/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer la séance
        </button>
      </div>

      {/* ── Dialog confirmation ───────────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          showCloseButton={false}
          className="bg-elevated border border-border max-w-[340px] gap-0 p-5"
        >
          <h2 className="font-display font-bold text-[17px] text-text1 mb-2">
            Supprimer la séance ?
          </h2>
          <p className="font-body text-[13px] text-text2 mb-5 leading-relaxed">
            Cette action est irréversible. Tous les exercices et séries associés seront perdus.
          </p>
          <div className="flex gap-3">
            <DialogClose asChild>
              <button className="flex-1 h-10 rounded-[10px] border border-border font-body text-[14px] text-text2 hover:border-border-hi transition-colors">
                Annuler
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 h-10 rounded-[10px] bg-danger/15 border border-danger/30 text-danger font-body text-[14px] font-semibold hover:bg-danger/25 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
