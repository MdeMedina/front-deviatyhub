import React from 'react'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import SettingsPage from '@/app/(dashboard)/settings/page'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'

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

// Mock ClinicConfigForm component
jest.mock('@/components/clinic/ClinicConfigForm', () => ({
  ClinicConfigForm: ({ readOnly }: any) => (
    <div data-testid="mock-clinic-config-form" data-readonly={String(readOnly)}>
      ClinicConfigForm Content
    </div>
  ),
}))

describe('SettingsPage Integration & Permissions', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
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

  // ==========================================
  // ✅ TEST 1: Renderizado con Permisos
  // ==========================================
  it('renders page header and config form when user has clinic_config.view permission', () => {
    setupAuth({ clinic_config: { view: true, edit: true } })

    render(<SettingsPage />)

    expect(screen.getByText('Configuración de la Clínica')).toBeInTheDocument()
    expect(screen.getByTestId('mock-clinic-config-form')).toBeInTheDocument()
    expect(screen.getByTestId('mock-clinic-config-form')).toHaveAttribute('data-readonly', 'false')
  })

  // ==========================================
  // ✅ TEST 2: Renderizado en Modo Edición
  // ==========================================
  it('renders ClinicConfigForm in edit mode when user has edit permissions', () => {
    setupAuth({ clinic_config: { view: true, edit: true } })

    render(<SettingsPage />)

    expect(screen.getByTestId('mock-clinic-config-form')).toHaveAttribute('data-readonly', 'false')
    expect(screen.queryByText('Modo Solo Lectura')).not.toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 3: Renderizado en Modo Solo Lectura
  // ==========================================
  it('renders ClinicConfigForm in readOnly mode when user lacks edit permissions', () => {
    setupAuth({ clinic_config: { view: true, edit: false } })

    render(<SettingsPage />)

    expect(screen.getByTestId('mock-clinic-config-form')).toHaveAttribute('data-readonly', 'true')
    expect(screen.getByText('Modo Solo Lectura')).toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 4: Acceso Denegado por falta de Permisos de Vista
  // ==========================================
  it('renders Access Denied view when the user lacks view permission', () => {
    setupAuth({ clinic_config: { view: false, edit: false } })

    render(<SettingsPage />)

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument()
    expect(screen.getByText(/No tienes los permisos necesarios para ver o modificar la configuración de la clínica/i)).toBeInTheDocument()
    expect(screen.queryByTestId('mock-clinic-config-form')).not.toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 5: Link para volver al dashboard
  // ==========================================
  it('has a link to return to the dashboard from access denied page', () => {
    setupAuth({ clinic_config: { view: false, edit: false } })

    render(<SettingsPage />)

    const homeLink = screen.getByRole('link', { name: /Ir al Dashboard/i })
    expect(homeLink).toHaveAttribute('href', '/dashboard')
  })
})
