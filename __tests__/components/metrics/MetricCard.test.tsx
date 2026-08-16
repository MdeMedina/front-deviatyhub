import React from 'react'
import { render, screen } from '@testing-library/react'
import { MetricCard } from '@/components/metrics/MetricCard'

// Mock framer-motion to avoid animation errors in JSDOM tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, transition, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
  },
}))

describe('MetricCard Molecule (Fase 7.2)', () => {
  // ==========================================
  // ✅ TEST 1: Renderizado del Título y Valor
  // ==========================================
  it('successfully renders the title and value props correctly', () => {
    render(<MetricCard title="Conversaciones Atendidas" value={145} />)

    expect(screen.getByText('Conversaciones Atendidas')).toBeInTheDocument()
    expect(screen.getByText('145')).toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 2: Tendencia Positiva (Flecha Verde)
  // ==========================================
  it('renders a green success trend badge when direction: "up" and positive: true', () => {
    render(
      <MetricCard
        title="Citas Creadas"
        value={48}
        trend={{ value: 12.5, direction: 'up', positive: true }}
      />
    )

    const badge = screen.getByTestId('trend-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('+12.5%')
    
    // Emerald color classes for positive/green indicators
    expect(badge).toHaveClass('bg-emerald-50')
    expect(badge).toHaveClass('text-emerald-600')
    expect(badge).toHaveClass('border-emerald-100')
  })

  // ==========================================
  // ✅ TEST 3: Tendencia Negativa (Flecha Roja)
  // ==========================================
  it('renders a red failure trend badge when direction: "up" and positive: false', () => {
    render(
      <MetricCard
        title="Derivaciones Humanas"
        value={18}
        trend={{ value: 5.4, direction: 'up', positive: false }}
      />
    )

    const badge = screen.getByTestId('trend-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('+5.4%')

    // Rose color classes for negative/red indicators
    expect(badge).toHaveClass('bg-rose-50')
    expect(badge).toHaveClass('text-rose-600')
    expect(badge).toHaveClass('border-rose-100')
  })

  // ==========================================
  // ❌ TEST 4: Sin Tendencia (No Renderiza el Badge)
  // ==========================================
  it('does not render any trend badge when the trend prop is omitted', () => {
    render(<MetricCard title="Conversaciones Totales" value={300} />)

    expect(screen.queryByTestId('trend-badge')).not.toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 5: Valor 0 se Renderiza Correctamente
  // ==========================================
  it('renders "0" as value correctly without falling back to blank string or undefined', () => {
    render(<MetricCard title="Citas Canceladas" value={0} />)

    expect(screen.getByText('Citas Canceladas')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
