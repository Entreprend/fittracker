import { cn } from '@/lib/utils'

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const

interface WeekStreakProps {
  /** Dates ISO (YYYY-MM-DD) des séances effectuées cette semaine */
  workoutDates: string[]
  /** Objectif de séances par semaine */
  goal?: number
}

function getMondayOfCurrentWeek(): Date {
  const today = new Date()
  const day = today.getDay() // 0 = Dimanche
  const diff = day === 0 ? -6 : 1 - day // ramener au lundi
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default function WeekStreak({ workoutDates, goal = 5 }: WeekStreakProps) {
  const monday = getMondayOfCurrentWeek()
  const todayISO = toISODate(new Date())
  const workoutSet = new Set(workoutDates)
  const completedThisWeek = workoutDates.length

  // Génère les 7 jours L → D
  const weekDays = DAY_LABELS.map((label, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const iso = toISODate(date)
    const isToday = iso === todayISO
    const hasWorkout = workoutSet.has(iso)
    const isPast = iso < todayISO
    return { label, iso, isToday, hasWorkout, isPast }
  })

  return (
    <div className="flex flex-col gap-3">
      {/* Légende streak */}
      <div className="flex items-center justify-between">
        <span className="font-body text-[13px] text-text2 font-medium">
          Cette semaine
        </span>
        <span className="font-display font-bold text-[13px]">
          <span className="text-accent">{completedThisWeek}</span>
          <span className="text-text3"> / {goal} séances</span>
        </span>
      </div>

      {/* Jours */}
      <div className="flex gap-2">
        {weekDays.map(({ label, iso, isToday, hasWorkout }) => (
          <div
            key={iso}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1.5',
              'h-12 rounded-[10px] border transition-colors',
              isToday
                ? 'bg-accent border-accent'
                : hasWorkout
                  ? 'bg-accent-dim border-accent'
                  : 'bg-elevated border-border',
            )}
          >
            <span
              className={cn(
                'font-body text-[11px] font-medium leading-none',
                isToday ? 'text-bg font-bold' : hasWorkout ? 'text-accent' : 'text-text3',
              )}
            >
              {label}
            </span>
            {hasWorkout && !isToday && (
              <div className="w-1 h-1 rounded-full bg-accent" />
            )}
            {isToday && (
              <div className="w-1 h-1 rounded-full bg-bg opacity-60" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
