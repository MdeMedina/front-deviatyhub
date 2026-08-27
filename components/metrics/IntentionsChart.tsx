import React from 'react'
import { IIntentionDistribution } from '@/lib/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { HelpCircle } from 'lucide-react'

export interface IntentionsChartProps {
  intentions: IIntentionDistribution[]
  periodLabel?: string
}

export const IntentionsChart: React.FC<IntentionsChartProps> = ({ intentions, periodLabel }) => {
  if (!intentions || intentions.length === 0) {
    return (
      <div className="bg-[var(--card)] p-6 rounded-[10px] border border-[var(--line)] shadow-[0_1px_2px_rgba(20,20,25,0.05)] min-h-[340px] flex items-center justify-center">
        <EmptyState
          title="Sin datos de intenciones"
          description="No se registraron intenciones conversacionales en el periodo seleccionado."
          icon={<HelpCircle size={22} />}
        />
      </div>
    )
  }

  return (
    <div data-testid="intentions-chart-container" data-card>
      <div data-hd>
        <h2>Distribución de intenciones</h2>
        {periodLabel && <span data-lbl>{periodLabel}</span>}
      </div>

      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {intentions.map((item, index) => (
          <div
            key={item.intention}
            data-testid={`intention-row-${index}`}
            style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>{item.intention}</span>
              <span data-mono style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {item.count} · {item.percentage.toFixed(0)}%
              </span>
            </div>
            <div style={{ height: '6px', background: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                data-testid={`bar-fill-${index}`}
                className="bg-[var(--blue)]"
                style={{ height: '100%', width: `${item.percentage}%`, borderRadius: '3px' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
