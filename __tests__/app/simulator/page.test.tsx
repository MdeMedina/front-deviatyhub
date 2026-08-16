import React from 'react'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import SimulatorPage from '@/app/(dashboard)/simulator/page'
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

// Mock SimulatorChat component
jest.mock('@/components/features/simulator/SimulatorChat', () => ({
  SimulatorChat: () => <div data-testid="mock-simulator-chat">SimulatorChat Content</div>,
}))

describe('SimulatorPage Integration & Permissions', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    useAuthStore.getState().clearSession()
  })

  const setupAuth = (permissions: Record<string, any>) => {
    useAuthStore.getState().setSession({
      access_token: 'mock-access',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
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
            simulator: { view: true, ...permissions },
            metrics: { view: true },
            integrations: { view: true },
            security: { view: true },
            users: { view: true, edit: true, create: true, delete: true },
            clinic_config: { view: true, edit: true },
            conversations: { view: true, takeover: true },
            agenda: { view: true, edit: true },
          } as any,
        },
      },
    })
  }

  // ==========================================
  // ❌ TEST 1: Acceso denegado si no tiene permiso simulator.view
  // ==========================================
  it('renders Access Denied screen when user lacks simulator.view permission', () => {
    setupAuth({ view: false })

    render(<SimulatorPage />)

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument()
    expect(
      screen.getByText(/No tienes los permisos necesarios para acceder al simulador/i)
    ).toBeInTheDocument()
    expect(screen.queryByTestId('mock-simulator-chat')).not.toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 2: Acceso permitido si tiene permiso simulator.view
  // ==========================================
  it('renders simulator page and SimulatorChat component when user has permission', () => {
    setupAuth({ view: true })

    render(<SimulatorPage />)

    expect(screen.queryByText('Acceso Denegado')).not.toBeInTheDocument()
    expect(screen.getByText('Simulador del Agente')).toBeInTheDocument()
    expect(screen.getByTestId('mock-simulator-chat')).toBeInTheDocument()
  })
})
