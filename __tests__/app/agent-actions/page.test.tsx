import React from 'react'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import AgentActionsPage from '@/app/(dashboard)/agent-actions/page'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock AgentActionToggle component
jest.mock('@/components/clinic/AgentActionToggle', () => ({
  AgentActionToggle: ({ readOnly }: any) => (
    <div data-testid="mock-agent-action-toggle" data-readonly={String(readOnly)}>
      AgentActionToggle Content
    </div>
  ),
}))

describe('AgentActionsPage Integration & Permissions', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    useAuthStore.getState().clearSession()
  })

  const setupAuth = (permissions: Record<string, any>) => {
    useAuthStore.getState().setSession({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        clinic_id: 'clinic-1',
        active: true,
        role: {
          id: 'role-1',
          name: 'Manager',
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
      access_token: 'token-123',
      refresh_token: 'refresh-123',
      expires_in: 3600
    })
  }

  // ==========================================
  // ✅ TEST 1: Renderizado Exitoso con Permisos
  // ==========================================
  it('renders agent actions layout and AgentActionToggle correctly', () => {
    setupAuth({
      agent_actions: { view: true, edit: true }
    })

    render(<AgentActionsPage />)

    expect(screen.getByText('Configuración del Agente')).toBeInTheDocument()
    expect(screen.getByTestId('mock-agent-action-toggle')).toBeInTheDocument()
    expect(screen.getByTestId('mock-agent-action-toggle')).toHaveAttribute('data-readonly', 'false')
  })

  // ==========================================
  // ✅ TEST 2: Renderizado en Modo Edición
  // ==========================================
  it('renders AgentActionToggle in edit mode when user has edit permissions', () => {
    setupAuth({
      agent_actions: { view: true, edit: true }
    })

    render(<AgentActionsPage />)

    expect(screen.getByTestId('mock-agent-action-toggle')).toHaveAttribute('data-readonly', 'false')
  })

  // ==========================================
  // ✅ TEST 3: Renderizado en Modo Solo Lectura
  // ==========================================
  it('renders AgentActionToggle in readOnly mode when user lacks edit permissions', () => {
    setupAuth({
      agent_actions: { view: true, edit: false }
    })

    render(<AgentActionsPage />)

    expect(screen.getByTestId('mock-agent-action-toggle')).toHaveAttribute('data-readonly', 'true')
  })

  // ==========================================
  // ❌ TEST 4: Acceso Denegado por falta de Permisos de Vista
  // ==========================================
  it('renders Access Denied view when the user lacks view permission', () => {
    setupAuth({
      agent_actions: { view: false, edit: false }
    })

    render(<AgentActionsPage />)

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument()
    expect(screen.getByText(/No tienes los permisos necesarios para ver o modificar las configuraciones de acciones del agente/i)).toBeInTheDocument()
    expect(screen.queryByTestId('mock-agent-action-toggle')).not.toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 5: Navegación de Retorno desde Acceso Denegado
  // ==========================================
  it('has a functional button to return to dashboard from access denied page', () => {
    setupAuth({
      agent_actions: { view: false, edit: false }
    })

    render(<AgentActionsPage />)

    const homeButton = screen.getByRole('link', { name: /Ir al Dashboard/i })
    expect(homeButton).toHaveAttribute('href', '/dashboard')
  })
})
