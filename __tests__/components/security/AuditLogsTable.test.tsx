import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuditLogsTable } from '@/components/features/security/AuditLogsTable'
import { IAuditLog, AuditLogPeriod } from '@/lib/types'

describe('AuditLogsTable Organism — Tabla de logs de auditoría', () => {
  const mockOnPeriodChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ---- Factories ----

  const makeLog = (overrides?: Partial<IAuditLog>): IAuditLog => ({
    id: `log-${Math.random().toString(36).substring(2, 8)}`,
    user_email: 'admin@deviaty.com',
    action: 'UPDATE',
    entity: 'Doctor',
    created_at: '2026-05-24T15:00:00Z',
    changes: {
      before: { name: 'Dr. Smith', active: true },
      after:  { name: 'Dr. Smith Jr.', active: true },
    },
    ...overrides,
  })

  const defaultProps = {
    logs: [makeLog({ id: 'log-1' }), makeLog({ id: 'log-2', action: 'DELETE', entity: 'Role' })],
    period: '7d' as AuditLogPeriod,
    onPeriodChange: mockOnPeriodChange,
    canView: true,
  }

  // ==========================================
  // ✅ TEST 1: Muestra los campos: usuario, acción, entidad, fecha
  // ==========================================
  it('renders the user, action, entity and date fields for each log row', () => {
    render(<AuditLogsTable {...defaultProps} />)

    // Primer log
    expect(screen.getByTestId('log-user-log-1')).toHaveTextContent('admin@deviaty.com')
    expect(screen.getByTestId('log-action-log-1')).toHaveTextContent('UPDATE')
    expect(screen.getByTestId('log-entity-log-1')).toHaveTextContent('Doctor')
    expect(screen.getByTestId('log-date-log-1')).toBeInTheDocument()

    // Segundo log
    expect(screen.getByTestId('log-action-log-2')).toHaveTextContent('DELETE')
    expect(screen.getByTestId('log-entity-log-2')).toHaveTextContent('Role')
  })

  // ==========================================
  // ✅ TEST 2: El campo `changes` se puede expandir para ver before/after en JSON
  // ==========================================
  it('expands a row on click to show before/after changes as formatted JSON', () => {
    const log = makeLog({
      id: 'log-expand',
      changes: {
        before: { name: 'Dr. Smith', active: true },
        after:  { name: 'Dr. Smith Jr.', active: false },
      },
    })

    render(
      <AuditLogsTable
        logs={[log]}
        period="7d"
        onPeriodChange={mockOnPeriodChange}
        canView={true}
      />
    )

    // Detail row should not exist before clicking
    expect(screen.queryByTestId('audit-detail-log-expand')).not.toBeInTheDocument()

    // Click the row to expand
    fireEvent.click(screen.getByTestId('audit-row-log-expand'))

    // Now detail should be visible
    const detail = screen.getByTestId('audit-detail-log-expand')
    expect(detail).toBeInTheDocument()

    // before JSON should show old name
    expect(screen.getByTestId('log-before-log-expand')).toHaveTextContent('Dr. Smith')
    // after JSON should show new name
    expect(screen.getByTestId('log-after-log-expand')).toHaveTextContent('Dr. Smith Jr.')

    // Click again to collapse
    fireEvent.click(screen.getByTestId('audit-row-log-expand'))
    expect(screen.queryByTestId('audit-detail-log-expand')).not.toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 3: El filtro de período (7d/30d) hace un nuevo fetch con el parámetro correcto
  // ==========================================
  it('calls onPeriodChange with the correct period value when a filter button is clicked', () => {
    render(<AuditLogsTable {...defaultProps} period="7d" />)

    // Verify initial active period
    const btn7d  = screen.getByTestId('period-btn-7d')
    const btn30d = screen.getByTestId('period-btn-30d')
    expect(btn7d).toBeInTheDocument()
    expect(btn30d).toBeInTheDocument()

    // Click 30d
    fireEvent.click(btn30d)
    expect(mockOnPeriodChange).toHaveBeenCalledTimes(1)
    expect(mockOnPeriodChange).toHaveBeenCalledWith('30d')

    // Click 7d
    fireEvent.click(btn7d)
    expect(mockOnPeriodChange).toHaveBeenCalledTimes(2)
    expect(mockOnPeriodChange).toHaveBeenCalledWith('7d')
  })

  // ==========================================
  // ❌ TEST 4: Sin permiso security.view, la página no renderiza la tabla
  // ==========================================
  it('does not render the table when canView is false — shows access restricted message instead', () => {
    render(
      <AuditLogsTable
        logs={defaultProps.logs}
        period="7d"
        onPeriodChange={mockOnPeriodChange}
        canView={false}
      />
    )

    // Table should not be rendered
    expect(screen.queryByTestId('period-filter')).not.toBeInTheDocument()
    expect(screen.queryByTestId('audit-row-log-1')).not.toBeInTheDocument()

    // Should show access restricted placeholder
    expect(screen.getByTestId('audit-no-permission')).toBeInTheDocument()
    expect(screen.getByText('Acceso restringido')).toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 5: Un log sin changes.before (CREATE) muestra "—" en la columna before
  // ==========================================
  it('displays "—" in the before column when changes.before is null (CREATE action)', () => {
    const createLog = makeLog({
      id: 'log-create',
      action: 'CREATE',
      entity: 'Treatment',
      changes: {
        before: null, // CREATE: no hay estado previo
        after:  { name: 'Limpieza Dental', price: 25000 },
      },
    })

    render(
      <AuditLogsTable
        logs={[createLog]}
        period="7d"
        onPeriodChange={mockOnPeriodChange}
        canView={true}
      />
    )

    // Expand the row
    fireEvent.click(screen.getByTestId('audit-row-log-create'))

    // before must show "—"
    expect(screen.getByTestId('log-before-log-create')).toHaveTextContent('—')

    // after must show the actual data
    expect(screen.getByTestId('log-after-log-create')).toHaveTextContent('Limpieza Dental')
    expect(screen.getByTestId('log-after-log-create')).toHaveTextContent('25000')
  })
})
