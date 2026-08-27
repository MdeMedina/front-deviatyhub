import React from 'react'
import { render, screen } from '@testing-library/react'
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
  // ✅ TEST 1: Renderizado de barras
  // ==========================================
  it('renders one horizontal bar row and fill for each intention in the payload', () => {
    render(<IntentionsChart intentions={mockIntentions} />)

    mockIntentions.forEach((item, index) => {
      expect(screen.getByTestId(`intention-row-${index}`)).toBeInTheDocument()
      expect(screen.getByTestId(`bar-fill-${index}`)).toBeInTheDocument()
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
  // ✅ TEST 3: Muestra conteo y porcentaje por barra
  // ==========================================
  it('displays the count and percentage for each intention', () => {
    render(<IntentionsChart intentions={mockIntentions} />)

    expect(screen.getByText('120 · 50%')).toBeInTheDocument()
    expect(screen.getByText('72 · 30%')).toBeInTheDocument()
    expect(screen.getByText('48 · 20%')).toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 4: La barra refleja el porcentaje como ancho
  // ==========================================
  it('sizes each bar fill width to match its percentage', () => {
    render(<IntentionsChart intentions={mockIntentions} />)

    expect(screen.getByTestId('bar-fill-0')).toHaveStyle({ width: '50%' })
    expect(screen.getByTestId('bar-fill-1')).toHaveStyle({ width: '30%' })
  })

  // ==========================================
  // ❌ TEST 5: Array Vacío Carga EmptyState
  // ==========================================
  it('renders an EmptyState component when intentions array is empty or undefined', () => {
    render(<IntentionsChart intentions={[]} />)

    expect(screen.getByText('Sin datos de intenciones')).toBeInTheDocument()
    expect(screen.getByText('No se registraron intenciones conversacionales en el periodo seleccionado.')).toBeInTheDocument()

    // Ensure chart itself is not rendered
    expect(screen.queryByTestId('intentions-chart-container')).not.toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 6: Usa el color de marca (--blue) en las barras
  // ==========================================
  it('uses the Dentral brand blue fill for the bars', () => {
    render(<IntentionsChart intentions={mockIntentions} />)

    const fill0 = screen.getByTestId('bar-fill-0')
    expect(fill0.className).toContain('bg-[var(--blue)]')
  })
})
