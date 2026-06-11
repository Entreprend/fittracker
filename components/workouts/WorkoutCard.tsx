import Link from 'next/link'
import { Clock, Dumbbell, ChevronRight } from 'lucide-react'
import { cn, formatDuration, formatVolume, formatDate } from '@/lib/utils'

export interface WorkoutCardData {
  id: string
  name: string
  date: string
  duration_minutes: number | null
  total_volume_kg: number | null
  exercise_names: string[]
  status?: string
}

interface WorkoutCardProps {
  workout: WorkoutCardData
  isActive?: boolean
  compact?: boolean
}

export default function WorkoutCard({
  workout,
  isActive = false,
  compact = false,
}: WorkoutCardProps) {
  const visibleExercises = workout.exercise_names.slice(0, 3)
  const extraCount = workout.exercise_names.length - visibleExercises.length

  return (
    <Link
      href={`/workouts/${workout.id}`}
      className={cn(
        'block bg-surface border rounded-[20px] p-4 transition-colors',
        isActive
          ? 'border-accent bg-accent-dim'
          : 'border-border hover:border-border-hi',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Infos principales */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Nom + date */}
          <div>
            <p className="font-display font-bold text-[16px] text-text1 truncate leading-tight">
              {workout.name}
            </p>
            <p className="font-body text-[12px] text-text3 mt-0.5">
              {formatDate(workout.date)}
            </p>
          </div>

          {/* Stats */}
          {!compact && (
            <div className="flex items-center gap-3">
              {workout.duration_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-text3" />
                  <span className="font-body text-[12px] text-text2">
                    {formatDuration(workout.duration_minutes)}
                  </span>
                </div>
              )}
              {workout.total_volume_kg && (
                <div className="flex items-center gap-1">
                  <Dumbbell className="w-3.5 h-3.5 text-text3" />
                  <span className="font-body text-[12px] text-text2">
                    {formatVolume(workout.total_volume_kg)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Pills exercices */}
          {workout.exercise_names.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {visibleExercises.map((name) => (
                <span
                  key={name}
                  className="bg-elevated border border-border rounded-full px-2.5 py-0.5 font-body text-[11px] text-text2 leading-none"
                >
                  {name}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="bg-elevated border border-border rounded-full px-2.5 py-0.5 font-body text-[11px] text-text3 leading-none">
                  +{extraCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight className="w-4 h-4 text-text3 shrink-0 mt-1" />
      </div>

      {isActive && (
        <div className="mt-3 pt-3 border-t border-accent/20">
          <span className="font-body text-[12px] text-accent font-medium">
            Séance en cours →
          </span>
        </div>
      )}
    </Link>
  )
}
