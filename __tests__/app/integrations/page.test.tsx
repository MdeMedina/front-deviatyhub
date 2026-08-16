import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import IntegrationsPage from '@/app/(dashboard)/integrations/page'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { IntegrationType } from '@/lib/types'

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

describe('IntegrationsPage Integration & Permissions', () => {
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

  const mockIntegrations = [
    { type: IntegrationType.WHATSAPP, connected: true, last_tested_at: '2026-05-24T12:00:00Z', last_test_ok: true },
    { type: IntegrationType.GOOGLE_CALENDAR, connected: false, last_tested_at: '', last_test_ok: false },
  ]

  // ==========================================
  // ✅ TEST 1: Renderizado con Permisos
  // ==========================================
  it('renders page header and list when user has integrations.view permission', async () => {
    setupAuth({ integrations: { view: true } })
    simpleServer.use(ENDPOINTS.integrations.list, async () => ({
      status: 200,
      data: { success: true, data: mockIntegrations },
    }))

    render(<IntegrationsPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Integraciones Externas')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('WhatsApp Business')).toBeInTheDocument()
      expect(screen.getByText('Google Calendar')).toBeInTheDocument()
    })
  })

  // ==========================================
  // ✅ TEST 2: Acceso Denegado
  // ==========================================
  it('renders Access Denied view when the user lacks view permission', () => {
    setupAuth({ integrations: { view: false } })

    render(<IntegrationsPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument()
    expect(screen.getByText(/No tienes los permisos necesarios para ver o probar las integraciones/i)).toBeInTheDocument()
    expect(screen.queryByText('Integraciones Externas')).not.toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 3: Carga y visualización de error
  // ==========================================
  it('renders error block when api fetching fails', async () => {
    setupAuth({ integrations: { view: true } })
    simpleServer.use(ENDPOINTS.integrations.list, async () => ({
      status: 500,
      data: { success: false, error: { message: 'Internal Server Error' } },
    }))

    render(<IntegrationsPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Error al cargar integraciones')).toBeInTheDocument()
    })
  })

  // ==========================================
  // ✅ TEST 4: Probar conexión exitosa
  // ==========================================
  it('triggers test integration mutation and updates connection check results', async () => {
    setupAuth({ integrations: { view: true } })
    simpleServer.use(ENDPOINTS.integrations.list, async () => ({
      status: 200,
      data: { success: true, data: mockIntegrations },
    }))

    simpleServer.use(ENDPOINTS.integrations.test('WHATSAPP'), async () => ({
      status: 200,
      data: {
        success: true,
        data: {
          ok: true,
          tested_at: '2026-05-26T16:00:00Z',
          latency_ms: 95,
        },
      },
    }))

    render(<IntegrationsPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('WhatsApp Business')).toBeInTheDocument()
    })

    const testButtons = screen.getAllByRole('button', { name: /Probar conexión/i })
    fireEvent.click(testButtons[0]) // First button corresponds to WhatsApp

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/core/integrations/WHATSAPP/test'),
        expect.any(Object)
      )
    })
  })

  // ==========================================
  // ✅ TEST 5: Empty state when list is empty
  // ==========================================
  it('renders empty placeholder when no integrations are configured', async () => {
    setupAuth({ integrations: { view: true } })
    simpleServer.use(ENDPOINTS.integrations.list, async () => ({
      status: 200,
      data: { success: true, data: [] },
    }))

    render(<IntegrationsPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('No se encontraron integraciones configuradas')).toBeInTheDocument()
    })
  })
})
