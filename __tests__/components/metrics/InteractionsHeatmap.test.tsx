import React from 'react'
import { render, screen } from '@testing-library/react'
import { InteractionsHeatmap } from '@/components/metrics/InteractionsHeatmap'
import { IHourlyInteraction } from '@/lib/types'

describe('InteractionsHeatmap Organism (Fase 7.4)', () => {
  const mockHourlyData: IHourlyInteraction[] = [
    { hour: 0, count: 5 },
    { hour: 8, count: 45 },
    { hour: 12, count: 120 }, // Max activity
    { hour: 18, count: 80 },
    { hour: 23, count: 15 },
  ]

  // ==========================================
  // ✅ TEST 1: Renderizado de 24 Columnas
  // ==========================================
  it('always renders exactly 24 vertical columns representing hours 0 to 23', () => {
    render(<InteractionsHeatmap data={mockHourlyData} />)

    for (let h = 0; h < 24; h++) {
      expect(screen.getByTestId(`heatmap-col-${h}`)).toBeInTheDocument()
    }
  })

  // ==========================================
  // ✅ TEST 2: Altura Máxima en Hora de Pico
  // ==========================================
  it('gives the peak hour the tallest bar (100%) and taller than lower/zero hours', () => {
    render(<InteractionsHeatmap data={mockHourlyData} />)

    const peakHeight = parseFloat(screen.getByTestId('heatmap-col-12').style.height)
    const lowerHeight = parseFloat(screen.getByTestId('heatmap-col-8').style.height)
    const zeroHeight = parseFloat(screen.getByTestId('heatmap-col-4').style.height) // hour 4 has count: 0

    expect(peakHeight).toBe(100)
    expect(peakHeight).toBeGreaterThan(lowerHeight)
    expect(lowerHeight).toBeGreaterThan(zeroHeight)
  })

  // ==========================================
  // ✅ TEST 3: Altura Mínima en Horas Vacías
  // ==========================================
  it('gives hours with 0 count a positive minimum bar height (4%)', () => {
    render(<InteractionsHeatmap data={mockHourlyData} />)

    const zeroHeight = parseFloat(screen.getByTestId('heatmap-col-4').style.height)
    expect(zeroHeight).toBe(4)
  })

  // ==========================================
  // ✅ TEST 4: Tráfico Cero Uniforme
  // ==========================================
  it('gives every column the same minimum height (4%) when all counts are 0', () => {
    render(<InteractionsHeatmap data={[]} />)

    for (let h = 0; h < 24; h++) {
      const height = parseFloat(screen.getByTestId(`heatmap-col-${h}`).style.height)
      expect(height).toBe(4)
    }
  })

  // ==========================================
  // ✅ TEST 5: Color Sólido de Dos Estados
  // ==========================================
  it('paints high-traffic hours with --blue and low-traffic hours with --surface-2', () => {
    render(<InteractionsHeatmap data={mockHourlyData} />)

    // Peak (120) is above the threshold → brand blue
    expect(screen.getByTestId('heatmap-col-12').style.background).toBe('var(--blue)')
    // Low hour (5) is below the threshold → muted surface
    expect(screen.getByTestId('heatmap-col-0').style.background).toBe('var(--surface-2)')
    // Zero hour → muted surface
    expect(screen.getByTestId('heatmap-col-4').style.background).toBe('var(--surface-2)')
  })
})
