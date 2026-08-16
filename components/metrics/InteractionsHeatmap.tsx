import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IHourlyInteraction } from '@/lib/types'
import { Clock, Activity } from 'lucide-react'

export interface InteractionsHeatmapProps {
  data: IHourlyInteraction[]
}

export const InteractionsHeatmap: React.FC<InteractionsHeatmapProps> = ({ data = [] }) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)

  // Ensure we have all 24 hours represented, sorting from 0 to 23
  const full24HoursData = Array.from({ length: 24 }, (_, h) => {
    const existing = data.find((item) => item.hour === h)
    return {
      hour: h,
      count: existing ? existing.count : 0,
    }
  })

  // Calculate maximum count to scale opacity
  const maxCount = Math.max(...full24HoursData.map((item) => item.count), 0)

  // Calculate opacity for a given count
  const getColumnOpacity = (count: number) => {
    if (maxCount === 0) return 0.15 // If all counts are 0, uniform minimum opacity
    // Map count lineally from 0.15 (min opacity) to 1.0 (max opacity)
    return 0.15 + (count / maxCount) * 0.85
  }

  // Format hour label: e.g. 9 -> "09:00", 18 -> "18:00"
  const formatHourLabel = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  return (
    <div
      data-testid="heatmap-container"
      className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between min-h-[340px] relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-indigo-50"
    >
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">Interacciones por Hora</h2>
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-0.5">
            Distribución de tráfico conversacional
          </p>
        </div>
        <Clock size={18} className="text-indigo-500" />
      </div>

      {/* Heatmap Columns Grid */}
      <div className="flex items-end justify-between gap-1.5 h-36 pt-4 px-1">
        {full24HoursData.map((item) => {
          const opacity = getColumnOpacity(item.count)
          const isMax = maxCount > 0 && item.count === maxCount

          return (
            <div
              key={item.hour}
              className="flex-1 flex flex-col items-center h-full group/col"
            >
              {/* Vertical Column Bar */}
              <div className="relative w-full h-full flex items-end">
                <motion.div
                  data-testid={`heatmap-col-${item.hour}`}
                  onMouseEnter={() => setHoveredHour(item.hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                  whileHover={{ scaleY: 1.05, y: -2 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`w-full rounded-t-lg cursor-pointer transition-all duration-200 ${
                    isMax ? 'bg-indigo-600 shadow-sm shadow-indigo-100' : 'bg-indigo-500'
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
      <div className="min-h-[48px] flex items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-100/50 px-4 py-2">
        <AnimatePresence mode="wait">
          {hoveredHour !== null ? (
            <motion.div
              key={hoveredHour}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2 text-sm"
            >
              <Activity size={14} className="text-indigo-500 animate-pulse" />
              <span className="font-bold text-slate-800">
                {formatHourLabel(hoveredHour)}:
              </span>
              <span className="font-extrabold text-indigo-600">
                {full24HoursData[hoveredHour].count}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                interacciones
              </span>
            </motion.div>
          ) : (
            <motion.p
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-medium text-slate-400 italic"
            >
              Pasa el cursor sobre una columna para ver la actividad horaria
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Axis X Labels */}
      <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1 pt-1 border-t border-slate-50">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  )
}
