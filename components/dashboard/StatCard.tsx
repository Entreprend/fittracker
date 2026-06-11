import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  delta?: string
  deltaType?: 'positive' | 'neutral' | 'negative'
  icon?: React.ReactNode
  fullWidth?: boolean
}

export default function StatCard({
  label,
  value,
  delta,
  deltaType = 'neutral',
  icon,
  fullWidth = false,
}: StatCardProps) {
  const deltaColor =
    deltaType === 'positive'
      ? 'text-accent'
      : deltaType === 'negative'
        ? 'text-danger'
        : 'text-text3'

  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-[20px] p-4 flex flex-col gap-3',
        fullWidth ? 'col-span-2' : '',
      )}
    >
      {icon && (
        <div className="w-8 h-8 bg-elevated rounded-[10px] flex items-center justify-center">
          {icon}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="font-body text-[11px] uppercase tracking-widest text-text3 leading-none">
          {label}
        </span>

        <span className="font-display font-extrabold text-2xl text-text1 leading-none">
          {value}
        </span>

        {delta && (
          <span className={cn('font-body text-[12px] leading-none mt-0.5', deltaColor)}>
            {delta}
          </span>
        )}
      </div>
    </div>
  )
}
