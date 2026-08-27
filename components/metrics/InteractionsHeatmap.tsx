import React, { useState } from 'react'
import { IHourlyInteraction } from '@/lib/types'
import { Clock, Activity } from 'lucide-react'

export interface InteractionsHeatmapProps {
  data: IHourlyInteraction[]
}

export const InteractionsHeatmap: React.FC<InteractionsHeatmapProps> = ({ data = [] }) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)

  const full24HoursData = Array.from({ length: 24 }, (_, h) => {
    const existing = data.find((item) => item.hour === h)
    return {
      hour: h,
      count: existing ? existing.count : 0,
    }
  })

  const maxCount = Math.max(...full24HoursData.map((item) => item.count), 0)

  const getColumnOpacity = (count: number) => {
    if (maxCount === 0) return 0.15
    return 0.15 + (count / maxCount) * 0.85
  }

  const formatHourLabel = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  return (
    <div
      data-testid="heatmap-container"
      className="bg-[var(--card)] p-5 rounded-[10px] border border-[var(--line)] shadow-[0_1px_2px_rgba(20,20,25,0.05)] space-y-5 flex flex-col justify-between min-h-[340px]"
    >
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-[var(--line-soft)] pb-3">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--ink)] leading-tight">Interacciones por Hora</h2>
          <p className="microlabel text-[9.5px] mt-0.5">
            Distribución de tráfico conversacional (24h)
          </p>
        </div>
        <Clock size={16} className="text-[var(--dim)]" />
      </div>

      {/* Heatmap Columns Grid */}
      <div className="flex items-end justify-between gap-1 h-36 pt-2 px-1">
        {full24HoursData.map((item) => {
          const opacity = getColumnOpacity(item.count)
          const isMax = maxCount > 0 && item.count === maxCount

          return (
            <div
              key={item.hour}
              className="flex-1 flex flex-col items-center h-full group/col"
            >
              <div className="relative w-full h-full flex items-end">
                <div
                  data-testid={`heatmap-col-${item.hour}`}
                  onMouseEnter={() => setHoveredHour(item.hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                  className={`w-full rounded-t-[3px] cursor-pointer transition-all ${
                    isMax ? 'bg-[var(--blue)]' : 'bg-[var(--blue)]'
                  }`}
                  style={{
                    opacity: opacity,
                    height: maxCount > 0 ? `${Math.max((item.count / maxCount) * 100, 10)}%` : '15%',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Interactive Info / Tooltip Box */}
      <div className="min-h-[38px] flex items-center justify-center bg-[var(--surface)] rounded-[7px] border border-[var(--line)] px-3 py-1.5 text-[12.5px]">
        {hoveredHour !== null ? (
          <div className="flex items-center gap-2">
            <Activity size={13} className="text-[var(--blue)]" />
            <span className="font-semibold text-[var(--ink)] tabular">
              {formatHourLabel(hoveredHour)}:
            </span>
            <span className="font-semibold text-[var(--blue)] tabular">
              {full24HoursData[hoveredHour].count}
            </span>
            <span className="microlabel text-[9.5px] text-[var(--muted)]">
              interacciones
            </span>
          </div>
        ) : (
          <p className="text-[11.5px] text-[var(--dim)]">
            Pasa el cursor sobre una columna para ver la actividad horaria
          </p>
        )}
      </div>

      {/* Axis X Labels */}
      <div className="flex justify-between microlabel text-[9px] text-[var(--dim)] px-1 pt-2 border-t border-[var(--line-soft)] tabular">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  )
}
