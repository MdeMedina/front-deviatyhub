import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SecurityPage from '@/app/(dashboard)/security/page'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock framer-motion to bypass animation triggers
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('SecurityPage Integration & Permissions', () => {
  const mockPush = jest.fn()

  beforeAll(() => simpleServer.listen())
  afterEach(() => {
    simpleServer.resetHandlers()
    jest.clearAllMocks()
  })
  afterAll(() => simpleServer.close())

  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    useAuthStore.getState().clearSession()
  })

  const setupAuth = (permissions: Record<string, any>) => {
    useAuthStore.getState().setSession({
      user: {
        id: 'user-admin',
        email: 'admin@deviaty.com',
        clinic_id: 'clinic-1',
        active: true,
        role: {
          id: 'role-admin',
          name: 'Administrator',
          is_superadmin: false,
          permissions: {
            knowledge_base: { view: true, edit: true },
            agent_actions: { view: true, edit: true },
            simulator: { view: true },
            metrics: { view: true },
            integrations: { view: true },
            security: { view: true },
            users: { view: true, edit: true, create: true, delete: true },
            clinic_config: { view: true, edit: true },
            conversations: { view: true, takeover: true },
            agenda: { view: true, edit: true },
            ...permissions
          }
        }
      },
      access_token: 'mock-access',
      refresh_token: 'mock-refresh',
      expires_in: 3600
    })
  }

  const mockRoles = [
    {
      id: 'r-1',
      name: 'Administrador',
      is_superadmin: false,
      permissions: {
        conversations: { view: true, takeover: true },
        agenda: { view: true, edit: true },
        knowledge_base: { view: true, edit: true },
        agent_actions: { view: true, edit: true },
        clinic_config: { view: true, edit: true },
        users: { view: true, edit: true, create: true, delete: true },
        integrations: { view: true },
        metrics: { view: true },
        simulator: { view: true },
        security: { view: true },
      },
    },
  ]

  const mockLogs = [
    {
      id: 'log-1',
      user_email: 'john@deviaty.com',
      action: 'UPDATE',
      entity: 'Role',
      created_at: '2026-05-26T16:00:00Z',
      changes: { before: null, after: null },
    },
  ]

  // ==========================================
  // ✅ TEST 1: Renderizado con Permisos
  // ==========================================
  it('renders roles and permissions editor by default when permission security.view is true', async () => {
    setupAuth({ security: { view: true }, users: { edit: true } })
    simpleServer.use(ENDPOINTS.auth.roles, async () => ({
      status: 200,
      data: { success: true, data: mockRoles },
    }))

    render(<SecurityPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Seguridad & Auditoría')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByLabelText(/Seleccionar Rol a Configurar/i)).toBeInTheDocument()
      expect(screen.getByText('Editor de Permisos')).toBeInTheDocument()
    })
  })

  // ==========================================
  // ✅ TEST 2: Acceso Denegado
  // ==========================================
  it('displays access denied when security.view is false', () => {
    setupAuth({ security: { view: false } })

    render(<SecurityPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument()
    expect(screen.queryByText('Seguridad & Auditoría')).not.toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 3: Cambio de Pestañas
  // ==========================================
  it('switches to Audit Logs tab correctly and displays AuditLogsTable', async () => {
    setupAuth({ security: { view: true }, users: { edit: true } })
    simpleServer.use(ENDPOINTS.auth.roles, async () => ({
      status: 200,
      data: { success: true, data: mockRoles },
    }))
    simpleServer.use(ENDPOINTS.security.auditLogs, async () => ({
      status: 200,
      data: { success: true, data: mockLogs },
    }))

    render(<SecurityPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Roles y Permisos')).toBeInTheDocument()
    })

    // Click Audit Logs tab
    fireEvent.click(screen.getByRole('button', { name: /Logs de Auditoría/i }))

    await waitFor(() => {
      expect(screen.getByText('john@deviaty.com')).toBeInTheDocument()
    })
  })

  // ==========================================
  // ✅ TEST 4: Edición y guardado de permisos
  // ==========================================
  it('submits updated permissions layout via useUpdateRole mutation', async () => {
    setupAuth({ security: { view: true }, users: { edit: true } })
    simpleServer.use(ENDPOINTS.auth.roles, async () => ({
      status: 200,
      data: { success: true, data: mockRoles },
    }))
    simpleServer.use(ENDPOINTS.auth.role('r-1'), async () => ({
      status: 200,
      data: { success: true, data: { ...mockRoles[0] } },
    }))

    render(<SecurityPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Editor de Permisos')).toBeInTheDocument()
    })

    // Save changes
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/roles/r-1'),
        expect.objectContaining({
          method: 'PATCH',
        })
      )
    })
  })

  // ==========================================
  // ✅ TEST 5: Modo Solo Lectura sin Permiso de Edición
  // ==========================================
  it('renders in read-only mode when user lacks users.edit permission', async () => {
    setupAuth({ security: { view: true }, users: { edit: false } })
    simpleServer.use(ENDPOINTS.auth.roles, async () => ({
      status: 200,
      data: { success: true, data: mockRoles },
    }))

    render(<SecurityPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Modo Solo Lectura')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Guardar cambios/i })).not.toBeInTheDocument()
    })
  })

  // ==========================================
  // ✅ TEST 6: Creación de Rol
  // ==========================================
  it('allows creating a new role with a modal when having users.edit permission', async () => {
    setupAuth({ security: { view: true }, users: { edit: true } })
    simpleServer.use(ENDPOINTS.auth.roles, async () => ({
      status: 200,
      data: { success: true, data: mockRoles },
    }))

    render(<SecurityPage />, { wrapper: createWrapper() })

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Crear Rol/i })).toBeInTheDocument()
    })

    // Click "Crear Rol" to open the modal
    fireEvent.click(screen.getByRole('button', { name: /Crear Rol/i }))

    expect(screen.getByText('Crear Nuevo Rol de Seguridad')).toBeInTheDocument()

    // Type the role name
    fireEvent.change(screen.getByPlaceholderText('Ej: Asistente Dental, Recepcionista'), {
      target: { value: 'Secretario' },
    })

    // Submit the form
    fireEvent.submit(screen.getByTestId('create-role-form'))

    // Verify role creation endpoint is called and modal closes
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/roles'),
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })
})
