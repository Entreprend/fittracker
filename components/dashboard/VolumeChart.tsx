"use client"

import {
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export interface VolumeDataPoint {
  week: string   // label semaine ex: "S1", "S2", ...
  volume: number // kg total
  isCurrent: boolean
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-elevated border border-border-hi rounded-[10px] px-3 py-2">
      <span className="font-body text-[12px] text-text1 font-medium">
        {payload[0].value.toLocaleString('fr-FR')} kg
      </span>
    </div>
  )
}

interface VolumeChartProps {
  data: VolumeDataPoint[]
}

export default function VolumeChart({ data }: VolumeChartProps) {
  if (!data.length) {
    return (
      <div className="h-[80px] flex items-center justify-center">
        <span className="font-body text-[12px] text-text3">Pas encore de données</span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={data} barCategoryGap="20%">
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
        />
        <Bar dataKey="volume" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.isCurrent ? '#14B8A6' : '#1A221A'}
              stroke={entry.isCurrent ? 'none' : '#1E2A1E'}
              strokeWidth={1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
