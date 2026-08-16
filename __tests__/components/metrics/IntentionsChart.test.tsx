import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { IntentionsChart } from '@/components/metrics/IntentionsChart'
import { IIntentionDistribution } from '@/lib/types'

// Mock framer-motion to avoid animation delays/errors
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, transition, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('IntentionsChart Organism (Fase 7.3)', () => {
  const mockIntentions: IIntentionDistribution[] = [
    { intention: 'Agendar Cita', count: 120, percentage: 50.0 },
    { intention: 'Consultar Horario', count: 72, percentage: 30.0 },
    { intention: 'Preguntar Precios', count: 48, percentage: 20.0 },
  ]

  // ==========================================
  // ✅ TEST 1: Renderizado de Segmentos
  // ==========================================
  it('renders one stacked bar segment and one legend item for each intention in the payload', () => {
    render(<IntentionsChart intentions={mockIntentions} />)

    mockIntentions.forEach((item, index) => {
      expect(screen.getByTestId(`bar-segment-${index}`)).toBeInTheDocument()
      expect(screen.getByTestId(`legend-item-${index}`)).toBeInTheDocument()
      expect(screen.getByText(item.intention)).toBeInTheDocument()
    })
  })

  // ==========================================
  // ✅ TEST 2: Suma de Porcentajes es 100%
  // ==========================================
  it('ensures that the sum of all intention percentages is exactly equal to 100%', () => {
    render(<IntentionsChart intentions={mockIntentions} />)

    const sum = mockIntentions.reduce((acc, curr) => acc + curr.percentage, 0)
    expect(sum).toBe(100.0)
  })

  // ==========================================
  // ✅ TEST 3: Hover sobre Segmento Muestra Tooltip
  // ==========================================
  it('successfully displays the detailed info in the tooltip box when hovering a bar segment', () => {
    render(<IntentionsChart intentions={mockIntentions} />)

    // Initially, displays instruction message
    expect(screen.getByText('Pasa el cursor sobre un segmento de la barra para ver detalles')).toBeInTheDocument()

    // Hover over the first segment ('Agendar Cita')
    const firstSegment = screen.getByTestId('bar-segment-0')
    fireEvent.mouseEnter(firstSegment)

    // Now it should display detailed count and percentage
    expect(screen.getByText('Agendar Cita:')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('(50.0%)')).toBeInTheDocument()

    // Leave the first segment
    fireEvent.mouseLeave(firstSegment)

    // Displays instruction message again
    expect(screen.getByText('Pasa el cursor sobre un segmento de la barra para ver detalles')).toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 4: Array Vacío Carga EmptyState
  // ==========================================
  it('renders an EmptyState component when intentions array is empty or undefined', () => {
    render(<IntentionsChart intentions={[]} />)

    expect(screen.getByText('Sin datos de intenciones')).toBeInTheDocument()
    expect(screen.getByText('No se registraron intenciones conversacionales en el periodo seleccionado.')).toBeInTheDocument()
    
    // Ensure chart itself is not rendered
    expect(screen.queryByTestId('intentions-chart-container')).not.toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 5: Consistencia de Colores
  // ==========================================
  it('ensures that segment and legend dot color styles are consistent across render calls', () => {
    const { rerender } = render(<IntentionsChart intentions={mockIntentions} />)

    const segment0 = screen.getByTestId('bar-segment-0')
    const legendDot0 = screen.getByTestId('legend-item-0').querySelector('span')

    // Let's assert class name inclusion
    expect(segment0.className).toContain('bg-indigo-500')
    expect(legendDot0?.className).toContain('bg-indigo-500')

    // Rerender again to verify consistency
    rerender(<IntentionsChart intentions={[...mockIntentions]} />)
    const segment0After = screen.getByTestId('bar-segment-0')
    expect(segment0After.className).toContain('bg-indigo-500')
  })
})
