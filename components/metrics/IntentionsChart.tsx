import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IIntentionDistribution } from '@/lib/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { HelpCircle, BarChart3 } from 'lucide-react'

export interface IntentionsChartProps {
  intentions: IIntentionDistribution[]
}

// Consistent premium color palette
const PRESET_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Agendar Cita': { bg: 'bg-indigo-500', text: 'text-indigo-600', dot: 'bg-indigo-500' },
  'Consultar Horario': { bg: 'bg-emerald-500', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  'Preguntar Precios': { bg: 'bg-amber-500', text: 'text-amber-600', dot: 'bg-amber-500' },
  'Anular Cita': { bg: 'bg-rose-500', text: 'text-rose-600', dot: 'bg-rose-500' },
}

const FALLBACK_PALETTE = [
  { bg: 'bg-violet-500', text: 'text-violet-600', dot: 'bg-violet-500' },
  { bg: 'bg-cyan-500', text: 'text-cyan-600', dot: 'bg-cyan-500' },
  { bg: 'bg-teal-500', text: 'text-teal-600', dot: 'bg-teal-500' },
  { bg: 'bg-fuchsia-500', text: 'text-fuchsia-600', dot: 'bg-fuchsia-500' },
]

export const IntentionsChart: React.FC<IntentionsChartProps> = ({ intentions }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!intentions || intentions.length === 0) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[340px] flex items-center justify-center">
        <EmptyState
          title="Sin datos de intenciones"
          description="No se registraron intenciones conversacionales en el periodo seleccionado."
          icon={<HelpCircle className="text-slate-400" size={32} />}
        />
      </div>
    )
  }

  // Get color configuration for each item consistently
  const getItemColors = (name: string, index: number) => {
    if (PRESET_COLORS[name]) return PRESET_COLORS[name]
    return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]
  }

  return (
    <div
      data-testid="intentions-chart-container"
      className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between min-h-[340px] relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-indigo-50"
    >
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">Distribución de Intenciones</h2>
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-0.5">
            Propósito del contacto del paciente
          </p>
        </div>
        <BarChart3 size={18} className="text-indigo-500" />
      </div>

      {/* Stacked Percentage Bar */}
      <div className="space-y-4">
        <div className="relative h-10 w-full bg-slate-50 rounded-2xl flex overflow-hidden border border-slate-100 p-1 gap-1">
          {intentions.map((item, index) => {
            const colors = getItemColors(item.intention, index)
            return (
              <motion.div
                key={item.intention}
                data-testid={`bar-segment-${index}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`h-full rounded-xl ${colors.bg} cursor-pointer relative transition-all duration-200`}
                style={{ width: `${item.percentage}%` }}
                whileHover={{ scaleY: 1.05 }}
              />
            )
          })}
        </div>

        {/* Hover Tooltip Box */}
        <div className="min-h-[48px] flex items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-100/50 px-4 py-2">
          <AnimatePresence mode="wait">
            {hoveredIndex !== null ? (
              <motion.div
                key={hoveredIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2.5 text-sm"
              >
                <span
                  className={`w-3 h-3 rounded-full ${
                    getItemColors(intentions[hoveredIndex].intention, hoveredIndex).dot
                  }`}
                />
                <span className="font-bold text-slate-800">
                  {intentions[hoveredIndex].intention}:
                </span>
                <span className="font-extrabold text-indigo-600">
                  {intentions[hoveredIndex].count}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  ({intentions[hoveredIndex].percentage.toFixed(1)}%)
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
                Pasa el cursor sobre un segmento de la barra para ver detalles
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        {intentions.map((item, index) => {
          const colors = getItemColors(item.intention, index)
          return (
            <div
              key={item.intention}
              data-testid={`legend-item-${index}`}
              className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
                <span className="text-xs font-bold text-slate-700 truncate">
                  {item.intention}
                </span>
              </div>
              <span className="text-xs font-extrabold text-slate-500 shrink-0 ml-1">
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
