import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { InteractionsHeatmap } from '@/components/metrics/InteractionsHeatmap'
import { IHourlyInteraction } from '@/lib/types'

// Mock framer-motion to avoid animation errors in JSDOM environment
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, transition, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

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
  // ✅ TEST 2: Opacidad Más Alta en Hora de Pico
  // ==========================================
  it('ensures that the peak hour has the highest opacity style value (1.0)', () => {
    render(<InteractionsHeatmap data={mockHourlyData} />)

    const peakColumn = screen.getByTestId('heatmap-col-12')
    const lowerColumn = screen.getByTestId('heatmap-col-8')
    const zeroColumn = screen.getByTestId('heatmap-col-4') // hour 4 has count: 0

    // Parse computed inline styles for opacity
    const peakOpacity = parseFloat(peakColumn.style.opacity)
    const lowerOpacity = parseFloat(lowerColumn.style.opacity)
    const zeroOpacity = parseFloat(zeroColumn.style.opacity)

    expect(peakOpacity).toBe(1.0) // Maximum opacity
    expect(peakOpacity).toBeGreaterThan(lowerOpacity)
    expect(lowerOpacity).toBeGreaterThan(zeroOpacity)
  })

  // ==========================================
  // ✅ TEST 3: Opacidad Mínima en Horas Vacías
  // ==========================================
  it('ensures that hours with 0 count have a positive minimum opacity style (0.15)', () => {
    render(<InteractionsHeatmap data={mockHourlyData} />)

    const zeroColumn = screen.getByTestId('heatmap-col-4') // count: 0
    const opacity = parseFloat(zeroColumn.style.opacity)

    expect(opacity).toBe(0.15) // Not zero or empty
  })

  // ==========================================
  // ❌ TEST 4: Tráfico Cero Uniforme
  // ==========================================
  it('ensures that when all counts are 0, all 24 columns share the same minimum opacity (0.15)', () => {
    render(<InteractionsHeatmap data={[]} />)

    const firstOpacity = parseFloat(screen.getByTestId('heatmap-col-0').style.opacity)

    expect(firstOpacity).toBe(0.15)

    for (let h = 0; h < 24; h++) {
      const col = screen.getByTestId(`heatmap-col-${h}`)
      const colOpacity = parseFloat(col.style.opacity)
      expect(colOpacity).toBe(firstOpacity)
    }
  })

  // ==========================================
  // ❌ TEST 5: Hover sobre Columna
  // ==========================================
  it('successfully updates the interactive information panel when hovering over a column', () => {
    render(<InteractionsHeatmap data={mockHourlyData} />)

    expect(screen.getByText('Pasa el cursor sobre una columna para ver la actividad horaria')).toBeInTheDocument()

    // Hover over peak hour 12
    const peakColumn = screen.getByTestId('heatmap-col-12')
    fireEvent.mouseEnter(peakColumn)

    expect(screen.getByText('12:00:')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('interacciones')).toBeInTheDocument()

    // Leave peak hour
    fireEvent.mouseLeave(peakColumn)

    expect(screen.getByText('Pasa el cursor sobre una columna para ver la actividad horaria')).toBeInTheDocument()
  })
})
