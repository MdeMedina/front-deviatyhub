import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UsersPage from '@/app/(dashboard)/users/page'
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

// Mock react-dom portal because document.body portal breaks in jsdom without container setup
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: any) => node,
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

describe('UsersPage Integration & Permissions', () => {
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
    window.confirm = jest.fn(() => true)
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

  const mockUsers = [
    {
      id: 'u-1',
      email: 'john@deviaty.com',
      clinic_id: 'clinic-1',
      active: true,
      role: { id: 'r-1', name: 'Administrador' },
    },
  ]

  const mockRoles = [
    { id: 'r-1', name: 'Administrador', permissions: {} },
    { id: 'r-2', name: 'Recepcionista', permissions: {} },
  ]

  // ==========================================
  // ✅ TEST 1: Renderizado con Permisos
  // ==========================================
  it('renders page headers and lists users when view permissions are met', async () => {
    setupAuth({ users: { view: true, edit: true, create: true, delete: true } })
    simpleServer.use(ENDPOINTS.auth.users, async () => ({
      status: 200,
      data: { success: true, data: mockUsers },
    }))
    simpleServer.use(ENDPOINTS.auth.roles, async () => ({
      status: 200,
      data: { success: true, data: mockRoles },
    }))

    render(<UsersPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Usuarios & Accesos')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('john@deviaty.com')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Invitar Usuario/i })).toBeInTheDocument()
    })
  })

  // ==========================================
  // ✅ TEST 2: Acceso Denegado
  // ==========================================
  it('displays access denied when users.view is false', () => {
    setupAuth({ users: { view: false } })

    render(<UsersPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument()
    expect(screen.queryByText('Usuarios & Accesos')).not.toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 3: Crear / Invitar Usuario exitosamente
  // ==========================================
  it('submits invitation form successfully and triggers invite API', async () => {
    setupAuth({ users: { view: true, create: true } })
    simpleServer.use(ENDPOINTS.auth.users, async () => ({
      status: 200,
      data: { success: true, data: mockUsers },
    }))
    simpleServer.use(ENDPOINTS.auth.roles, async () => ({
      status: 200,
      data: { success: true, data: mockRoles },
    }))

    simpleServer.use(ENDPOINTS.auth.invite, async () => ({
      status: 200,
      data: {
        success: true,
        data: {
          id: 'u-new',
          email: 'new@deviaty.com',
          clinic_id: 'clinic-1',
          active: true,
          role: mockRoles[1],
        },
      },
    }))

    render(<UsersPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('john@deviaty.com')).toBeInTheDocument()
    })

    // Click Invite Button
    fireEvent.click(screen.getByRole('button', { name: /Invitar Usuario/i }))

    // Fill Modal Form
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'new@deviaty.com' } })
    fireEvent.change(screen.getByLabelText(/Rol de Seguridad/i), { target: { value: 'r-2' } })

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Enviar Invitación/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/users/invite'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'new@deviaty.com', roleId: 'r-2' }),
        })
      )
    })
  })

  // ==========================================
  // ✅ TEST 4: Modificar rol de usuario
  // ==========================================
  it('opens edit modal and saves updated role selection', async () => {
    setupAuth({ users: { view: true, edit: true } })
    simpleServer.use(ENDPOINTS.auth.users, async () => ({
      status: 200,
      data: { success: true, data: mockUsers },
    }))
    simpleServer.use(ENDPOINTS.auth.roles, async () => ({
      status: 200,
      data: { success: true, data: mockRoles },
    }))

    simpleServer.use(ENDPOINTS.auth.user('u-1'), async () => ({
      status: 200,
      data: {
        success: true,
        data: { ...mockUsers[0], role_id: 'r-2', role: mockRoles[1] },
      },
    }))

    render(<UsersPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('john@deviaty.com')).toBeInTheDocument()
    })

    // Click Edit button
    fireEvent.click(screen.getByTestId('edit-user-btn-u-1'))

    // Expect modal to show edit details
    expect(screen.getByText('Editar Usuario')).toBeInTheDocument()

    // Change Role Select
    fireEvent.change(screen.getByLabelText(/Rol de Seguridad/i), { target: { value: 'r-2' } })

    // Change Password Input
    fireEvent.change(screen.getByLabelText(/Nueva Contraseña \(Opcional\)/i), { target: { value: 'secret123' } })

    // Save
    fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/users/u-1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ roleId: 'r-2', password: 'secret123' }),
        })
      )
    })
  })

  // ==========================================
  // ✅ TEST 5: Toggle de estado active
  // ==========================================
  it('toggles user active status successfully when status button clicked', async () => {
    setupAuth({ users: { view: true, edit: true } })
    simpleServer.use(ENDPOINTS.auth.users, async () => ({
      status: 200,
      data: { success: true, data: mockUsers },
    }))
    simpleServer.use(ENDPOINTS.auth.roles, async () => ({
      status: 200,
      data: { success: true, data: mockRoles },
    }))

    simpleServer.use(ENDPOINTS.auth.user('u-1'), async () => ({
      status: 200,
      data: {
        success: true,
        data: { ...mockUsers[0], active: false },
      },
    }))

    render(<UsersPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('john@deviaty.com')).toBeInTheDocument()
    })

    // Click Toggle active button
    fireEvent.click(screen.getByTestId('toggle-status-btn-u-1'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/users/u-1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ active: false }),
        })
      )
    })
  })
})
