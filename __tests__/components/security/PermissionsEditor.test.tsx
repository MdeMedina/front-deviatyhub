import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { PermissionsEditor } from '@/components/features/security/PermissionsEditor'
import { IPermissions } from '@/lib/types'
import { makePermissions } from '@/__mocks__/factories'

describe('PermissionsEditor Organism — Editor visual de permisos de rol', () => {
  const mockOnSave = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Permisos base: todo en false para tener control total en cada test
  const makeBlankPermissions = (): IPermissions => ({
    knowledge_base:  { view: false, edit: false },
    agent_actions:   { view: false, edit: false },
    simulator:       { view: false },
    metrics:         { view: false },
    integrations:    { view: false },
    security:        { view: false },
    users:           { view: false, edit: false, create: false, delete: false },
    clinic_config:   { view: false, edit: false },
    conversations:   { view: false, takeover: false },
    agenda:          { view: false, edit: false },
  })

  // ==========================================
  // ✅ TEST 1: Pre-puebla checkboxes con permisos actuales del rol
  // ==========================================
  it('pre-populates checkboxes based on initialPermissions', () => {
    const perms: IPermissions = {
      ...makeBlankPermissions(),
      knowledge_base: { view: true, edit: true },
      agenda:         { view: true, edit: false },
      metrics:        { view: true },
    }

    render(
      <PermissionsEditor
        initialPermissions={perms}
        onSave={mockOnSave}
      />
    )

    // knowledge_base view y edit deben estar checkeados
    expect(screen.getByTestId('checkbox-knowledge_base-view')).toBeChecked()
    expect(screen.getByTestId('checkbox-knowledge_base-edit')).toBeChecked()

    // agenda view checkeado, edit no
    expect(screen.getByTestId('checkbox-agenda-view')).toBeChecked()
    expect(screen.getByTestId('checkbox-agenda-edit')).not.toBeChecked()

    // metrics view checkeado
    expect(screen.getByTestId('checkbox-metrics-view')).toBeChecked()

    // conversations view no checkeado
    expect(screen.getByTestId('checkbox-conversations-view')).not.toBeChecked()
  })

  // ==========================================
  // ✅ TEST 2: Activar "edit" activa automáticamente "view"
  // ==========================================
  it('automatically enables "view" when an edit (write) permission is activated', () => {
    render(
      <PermissionsEditor
        initialPermissions={makeBlankPermissions()}
        onSave={mockOnSave}
      />
    )

    // Inicialmente, agenda view y edit deben estar desmarcados
    const viewCheckbox = screen.getByTestId('checkbox-agenda-view')
    const editCheckbox = screen.getByTestId('checkbox-agenda-edit')
    expect(viewCheckbox).not.toBeChecked()
    expect(editCheckbox).not.toBeChecked()

    // Al hacer click en "edit", "view" se activa automáticamente
    fireEvent.click(screen.getByTestId('perm-agenda-edit'))

    expect(editCheckbox).toBeChecked()
    expect(viewCheckbox).toBeChecked()
  })

  // ==========================================
  // ✅ TEST 3: Al guardar llama a onSave con los permisos actualizados
  // ==========================================
  it('calls onSave with the updated permissions object when Save is clicked', () => {
    render(
      <PermissionsEditor
        initialPermissions={makeBlankPermissions()}
        onSave={mockOnSave}
      />
    )

    // Activar simulator.view
    fireEvent.click(screen.getByTestId('perm-simulator-view'))

    // Activar knowledge_base.edit (debe activar view también)
    fireEvent.click(screen.getByTestId('perm-knowledge_base-edit'))

    // Guardar
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }))

    expect(mockOnSave).toHaveBeenCalledTimes(1)
    const savedPerms: IPermissions = mockOnSave.mock.calls[0][0]

    expect(savedPerms.simulator.view).toBe(true)
    expect(savedPerms.knowledge_base.view).toBe(true)
    expect(savedPerms.knowledge_base.edit).toBe(true)
    // El resto permanece en false
    expect(savedPerms.agenda.view).toBe(false)
    expect(savedPerms.metrics.view).toBe(false)
  })

  // ==========================================
  // ❌ TEST 4: "view" no se puede desactivar si algún permiso de escritura está activo
  // ==========================================
  it('blocks "view" from being unchecked if any write permission is active', () => {
    const perms: IPermissions = {
      ...makeBlankPermissions(),
      // knowledge_base con view y edit activos
      knowledge_base: { view: true, edit: true },
    }

    render(
      <PermissionsEditor
        initialPermissions={perms}
        onSave={mockOnSave}
      />
    )

    const viewCheckbox = screen.getByTestId('checkbox-knowledge_base-view')
    const editCheckbox = screen.getByTestId('checkbox-knowledge_base-edit')

    expect(viewCheckbox).toBeChecked()
    expect(editCheckbox).toBeChecked()

    // Intentar desactivar "view" mientras "edit" está activo → debe estar deshabilitado
    expect(viewCheckbox).toBeDisabled()

    // Desactivar "edit" primero
    fireEvent.click(screen.getByTestId('perm-knowledge_base-edit'))
    expect(editCheckbox).not.toBeChecked()

    // Ahora "view" ya no debería estar deshabilitado
    expect(viewCheckbox).not.toBeDisabled()

    // Y se puede desmarcar
    fireEvent.click(screen.getByTestId('perm-knowledge_base-view'))
    expect(viewCheckbox).not.toBeChecked()
  })

  // ==========================================
  // ❌ TEST 5: Sin permiso users.edit, todos los checkboxes son de solo lectura
  // ==========================================
  it('renders all checkboxes as disabled in readOnly mode (no users.edit permission)', () => {
    const fullPerms = makePermissions() // todos en true por defecto

    render(
      <PermissionsEditor
        initialPermissions={fullPerms}
        onSave={mockOnSave}
        readOnly={true}
      />
    )

    // Todos los checkboxes deben estar deshabilitados
    const allCheckboxes = screen.getAllByRole('checkbox')
    allCheckboxes.forEach((checkbox) => {
      expect(checkbox).toBeDisabled()
    })

    // El botón de guardar no debería aparecer
    expect(screen.queryByRole('button', { name: /Guardar cambios/i })).not.toBeInTheDocument()

    // Debe mostrarse el badge "Solo lectura"
    expect(screen.getByText('Solo lectura')).toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 6: Modo isSuperadmin fuerza todos los checkboxes marcados y deshabilitados
  // ==========================================
  it('renders all checkboxes as checked and disabled in isSuperadmin mode', () => {
    const blankPerms = makeBlankPermissions()

    render(
      <PermissionsEditor
        initialPermissions={blankPerms}
        onSave={mockOnSave}
        isSuperadmin={true}
      />
    )

    // Todos los checkboxes deben estar marcados y deshabilitados
    const allCheckboxes = screen.getAllByRole('checkbox')
    allCheckboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked()
      expect(checkbox).toBeDisabled()
    })

    // Debe mostrarse el badge "Acceso Total"
    expect(screen.getByText('Acceso Total')).toBeInTheDocument()
  })
})
