import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { UsersTable } from '@/components/features/users/UsersTable'
import { IUser } from '@/lib/types'

describe('UsersTable Component Molecule — List view & control panels', () => {
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnToggleActive = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockUsers: IUser[] = [
    {
      id: 'u-1',
      email: 'john@deviaty.com',
      clinic_id: 'c-1',
      active: true,
      role: { id: 'r-1', name: 'Administrador', is_superadmin: false, permissions: {} as any },
    },
    {
      id: 'u-2',
      email: 'jane@deviaty.com',
      clinic_id: 'c-1',
      active: false,
      role: { id: 'r-2', name: 'Recepcionista', is_superadmin: false, permissions: {} as any },
    },
  ]

  // ==========================================
  // ✅ TEST 1: Renderizado básico
  // ==========================================
  it('renders user details (email, role, status) correctly for each row', () => {
    render(
      <UsersTable
        users={mockUsers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    )

    expect(screen.getByText('john@deviaty.com')).toBeInTheDocument()
    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()

    expect(screen.getByText('jane@deviaty.com')).toBeInTheDocument()
    expect(screen.getByText('Recepcionista')).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 2: Filtrado por buscador
  // ==========================================
  it('filters rows based on the search query input', () => {
    render(
      <UsersTable
        users={mockUsers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    )

    const searchInput = screen.getByPlaceholderText(/Buscar por correo o rol/i)
    
    // Search email
    fireEvent.change(searchInput, { target: { value: 'john' } })
    expect(screen.getByText('john@deviaty.com')).toBeInTheDocument()
    expect(screen.queryByText('jane@deviaty.com')).not.toBeInTheDocument()

    // Clear and search role name
    fireEvent.change(searchInput, { target: { value: 'Recepcionista' } })
    expect(screen.getByText('jane@deviaty.com')).toBeInTheDocument()
    expect(screen.queryByText('john@deviaty.com')).not.toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 3: Disparo de Callbacks
  // ==========================================
  it('triggers onEdit, onDelete, and onToggleActive callbacks correctly', () => {
    render(
      <UsersTable
        users={mockUsers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    )

    // Trigger edit
    fireEvent.click(screen.getByTestId('edit-user-btn-u-1'))
    expect(mockOnEdit).toHaveBeenCalledWith(mockUsers[0])

    // Trigger toggle active
    fireEvent.click(screen.getByTestId('toggle-status-btn-u-1'))
    expect(mockOnToggleActive).toHaveBeenCalledWith(mockUsers[0])

    // Trigger delete
    fireEvent.click(screen.getByTestId('delete-user-btn-u-1'))
    expect(mockOnDelete).toHaveBeenCalledWith('u-1')
  })

  // ==========================================
  // ❌ TEST 4: Ocultación de acciones si es readonly
  // ==========================================
  it('hides action buttons when readOnly is true', () => {
    render(
      <UsersTable
        users={mockUsers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
        readOnly={true}
      />
    )

    expect(screen.queryByTestId('edit-user-btn-u-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('toggle-status-btn-u-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('delete-user-btn-u-1')).not.toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 5: Controles finos de permisos (canEdit / canDelete)
  // ==========================================
  it('conditionally hides edit or delete actions based on canEdit/canDelete flags', () => {
    const { rerender } = render(
      <UsersTable
        users={mockUsers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
        canEdit={false}
        canDelete={true}
      />
    )

    // No edit/toggle, yes delete
    expect(screen.queryByTestId('edit-user-btn-u-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('toggle-status-btn-u-1')).not.toBeInTheDocument()
    expect(screen.getByTestId('delete-user-btn-u-1')).toBeInTheDocument()

    // Rerender with edit=true, delete=false
    rerender(
      <UsersTable
        users={mockUsers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
        canEdit={true}
        canDelete={false}
      />
    )

    expect(screen.getByTestId('edit-user-btn-u-1')).toBeInTheDocument()
    expect(screen.getByTestId('toggle-status-btn-u-1')).toBeInTheDocument()
    expect(screen.queryByTestId('delete-user-btn-u-1')).not.toBeInTheDocument()
  })
})
