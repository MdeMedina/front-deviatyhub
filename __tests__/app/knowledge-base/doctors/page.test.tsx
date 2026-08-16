import React from 'react'
import { render, screen } from '@testing-library/react'
import StandaloneDoctorsPage from '@/app/(dashboard)/knowledge-base/doctors/page'
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

// Mock DoctorsManager component
jest.mock('@/components/clinic/DoctorsManager', () => ({
  DoctorsManager: ({ readOnly }: any) => (
    <div data-testid="mock-doctors-manager" data-readonly={String(readOnly)}>
      DoctorsManager Content
    </div>
  ),
}))

describe('StandaloneDoctorsPage (Fase 6.5 - Doctors Standalone)', () => {
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
          permissions: permissions as any
        }
      },
      access_token: 'mock-access',
      refresh_token: 'mock-refresh',
      expires_in: 3600
    })
  }

  // ==========================================
  // ✅ TEST 1: Renderizado Exitoso con Permisos
  // ==========================================
  it('renders doctors standalone layout and inner DoctorsManager component correctly', () => {
    setupAuth({
      knowledge_base: { view: true, edit: true },
    })

    render(<StandaloneDoctorsPage />)

    expect(screen.getByText('Gestión Standalone de Doctores')).toBeInTheDocument()
    expect(screen.getByTestId('mock-doctors-manager')).toBeInTheDocument()
    expect(screen.getByTestId('mock-doctors-manager')).toHaveAttribute('data-readonly', 'false')
  })

  // ==========================================
  // ✅ TEST 2: Enlace de Retorno a la Base de Conocimiento
  // ==========================================
  it('has a back navigation link pointing to the doctors tab in the general catalog page', () => {
    setupAuth({
      knowledge_base: { view: true, edit: true },
    })

    render(<StandaloneDoctorsPage />)

    const backLink = screen.getByRole('link', { name: 'Volver a Base de Conocimiento' }) // The link enclosing the ArrowLeft icon
    expect(backLink).toHaveAttribute('href', '/knowledge-base?tab=doctors')
  })

  // ==========================================
  // ✅ TEST 3: Renderizado de Modo Editor Completo
  // ==========================================
  it('renders DoctorsManager with full editing rights when user has write access', () => {
    setupAuth({
      knowledge_base: { view: true, edit: true },
    })

    render(<StandaloneDoctorsPage />)

    expect(screen.getByTestId('mock-doctors-manager')).toHaveAttribute('data-readonly', 'false')
    expect(screen.queryByText('Modo Solo Lectura')).not.toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 4: Denegación de Acceso sin Permisos
  // ==========================================
  it('renders Access Denied view when the user lacks view permission', () => {
    setupAuth({
      knowledge_base: { view: false, edit: false },
    })

    render(<StandaloneDoctorsPage />)

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument()
    expect(screen.getByText(/No tienes los permisos necesarios para ver o modificar el cuerpo médico de la clínica/i)).toBeInTheDocument()
    expect(screen.queryByTestId('mock-doctors-manager')).not.toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 5: Renderizado de Solo Lectura
  // ==========================================
  it('forces child DoctorsManager into read-only mode when user lacks write permission', () => {
    setupAuth({
      knowledge_base: { view: true, edit: false },
    })

    render(<StandaloneDoctorsPage />)

    expect(screen.getByText('Modo Solo Lectura')).toBeInTheDocument()
    expect(screen.getByTestId('mock-doctors-manager')).toHaveAttribute('data-readonly', 'true')
  })
})
