import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { IntegrationCard } from '@/components/features/integrations/IntegrationCard'
import { IntegrationType, IIntegration } from '@/lib/types'

describe('IntegrationCard Component Molecule — Presentation & Testing Controls', () => {
  const mockOnTest = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const makeMockIntegration = (overrides?: Partial<IIntegration>): IIntegration => ({
    type: IntegrationType.WHATSAPP,
    connected: true,
    last_tested_at: '2026-05-24T15:28:00Z',
    last_test_ok: true,
    latency_ms: 120,
    ...overrides,
  })

  // ==========================================
  // ✅ TEST 1: Renderizado general (nombre, descripción, icono)
  // ==========================================
  it('renders commercial brand name, description, and status correctly', () => {
    const integration = makeMockIntegration({ type: IntegrationType.GOOGLE_CALENDAR })

    render(
      <IntegrationCard
        integration={integration}
        onTest={mockOnTest}
        isTesting={false}
      />
    )

    // Verify mapped name and description are shown
    expect(screen.getByText('Google Calendar')).toBeInTheDocument()
    expect(
      screen.getByText(/Sincronización en tiempo real de la agenda médica/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Probar conexión/i })).toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 2: Badge de conectividad (verde vs gris)
  // ==========================================
  it('displays the correct badge status based on the connected state', () => {
    // 1. Connected: true -> shows "Conectado"
    const { rerender } = render(
      <IntegrationCard
        integration={makeMockIntegration({ connected: true })}
        onTest={mockOnTest}
        isTesting={false}
      />
    )
    expect(screen.getByText('Conectado')).toBeInTheDocument()
    expect(screen.queryByText('Desconectado')).not.toBeInTheDocument()

    // 2. Connected: false -> shows "Desconectado"
    rerender(
      <IntegrationCard
        integration={makeMockIntegration({ connected: false })}
        onTest={mockOnTest}
        isTesting={false}
      />
    )
    expect(screen.getByText('Desconectado')).toBeInTheDocument()
    expect(screen.queryByText('Conectado')).not.toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 3: Botón "Probar conexión" e interacción (isTesting: true)
  // ==========================================
  it('calls onTest when clicked, and shows loading state when isTesting is true', () => {
    // 1. When not testing: button is clickable
    const { rerender } = render(
      <IntegrationCard
        integration={makeMockIntegration()}
        onTest={mockOnTest}
        isTesting={false}
      />
    )

    const btn = screen.getByRole('button', { name: /Probar conexión/i })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
    expect(mockOnTest).toHaveBeenCalledTimes(1)

    // 2. When isTesting: true -> button is disabled, showing spinner/loading text
    rerender(
      <IntegrationCard
        integration={makeMockIntegration()}
        onTest={mockOnTest}
        isTesting={true}
      />
    )

    const disabledBtn = screen.getByRole('button', { name: /Procesando.../i })
    expect(disabledBtn).toBeDisabled()
  })

  // ==========================================
  // ❌ TEST 4: Ocultar fecha e indicadores si last_tested_at es nulo o vacío
  // ==========================================
  it('does not render last test details section if last_tested_at is null or empty', () => {
    const integration = makeMockIntegration({
      last_tested_at: '',
      last_test_ok: false,
      latency_ms: undefined,
    })

    render(
      <IntegrationCard
        integration={integration}
        onTest={mockOnTest}
        isTesting={false}
      />
    )

    expect(screen.queryByText('Conexión OK')).not.toBeInTheDocument()
    expect(screen.queryByText('Fallo de conexión')).not.toBeInTheDocument()
    expect(screen.queryByTestId('latency-tooltip')).not.toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 5: Renderizado condicional del tooltip de latencia
  // ==========================================
  it('conditionally displays the latency indicator and tooltip only when latency_ms is provided', () => {
    // 1. With latency_ms provided: renders indicator
    const { rerender } = render(
      <IntegrationCard
        integration={makeMockIntegration({ latency_ms: 180 })}
        onTest={mockOnTest}
        isTesting={false}
      />
    )

    expect(screen.getByText('180 ms')).toBeInTheDocument()
    const tooltip = screen.getByTestId('latency-tooltip')
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveTextContent('Latencia del último test')

    // 2. Without latency_ms: does not render indicator
    rerender(
      <IntegrationCard
        integration={makeMockIntegration({ latency_ms: undefined })}
        onTest={mockOnTest}
        isTesting={false}
      />
    )

    expect(screen.queryByText('180 ms')).not.toBeInTheDocument()
    expect(screen.queryByTestId('latency-tooltip')).not.toBeInTheDocument()
  })
})
