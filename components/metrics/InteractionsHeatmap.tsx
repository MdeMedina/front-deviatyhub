import React from 'react'
import { IHourlyInteraction } from '@/lib/types'

export interface InteractionsHeatmapProps {
  data: IHourlyInteraction[]
}

export const InteractionsHeatmap: React.FC<InteractionsHeatmapProps> = ({ data = [] }) => {
  const hours = Array.from({ length: 24 }, (_, h) => {
    const existing = data.find((item) => item.hour === h)
    return { hour: h, count: existing ? existing.count : 0 }
  })

  const maxCount = Math.max(...hours.map((item) => item.count), 0)
  const threshold = maxCount * 0.66

  return (
    <div data-card data-testid="heatmap-container">
      <div data-hd>
        <h2>Interacciones por hora</h2>
        <span data-lbl>0 – 23 h</span>
      </div>

      <div style={{ padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '160px' }}>
          {hours.map((item) => {
            const heightPct = maxCount > 0 ? Math.max(4, Math.round((item.count / maxCount) * 100)) : 4
            const color = item.count > threshold ? 'var(--blue)' : 'var(--surface-2)'

            return (
              <div
                key={item.hour}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', gap: '6px' }}
                title={`${item.hour.toString().padStart(2, '0')}:00 · ${item.count}`}
              >
                <div
                  data-testid={`heatmap-col-${item.hour}`}
                  style={{ height: `${heightPct}%`, background: color, borderRadius: '3px 3px 0 0' }}
                />
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <span data-lbl>00</span>
          <span data-lbl>06</span>
          <span data-lbl>12</span>
          <span data-lbl>18</span>
          <span data-lbl>23</span>
        </div>
      </div>
    </div>
  )
}
