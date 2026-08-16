import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import KnowledgeBasePage from '@/app/(dashboard)/knowledge-base/page'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock framer-motion to bypass animation triggers
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock child organism components to isolate the page layout
jest.mock('@/components/clinic/ClinicConfigForm', () => ({
  ClinicConfigForm: ({ readOnly }: any) => (
    <div data-testid="mock-config" data-readonly={String(readOnly)}>
      ClinicConfigForm Content
    </div>
  )
}))

jest.mock('@/components/clinic/ScheduleEditor', () => ({
  ScheduleEditor: ({ readOnly }: any) => (
    <div data-testid="mock-schedules" data-readonly={String(readOnly)}>
      ScheduleEditor Content
    </div>
  )
}))

jest.mock('@/components/clinic/TreatmentsManager', () => ({
  TreatmentsManager: ({ readOnly }: any) => (
    <div data-testid="mock-treatments" data-readonly={String(readOnly)}>
      TreatmentsManager Content
    </div>
  )
}))

jest.mock('@/components/clinic/UnavailabilityManager', () => ({
  UnavailabilityManager: ({ readOnly }: any) => (
    <div data-testid="mock-unavailability" data-readonly={String(readOnly)}>
      UnavailabilityManager Content
    </div>
  )
}))

jest.mock('@/components/clinic/PoliciesManager', () => ({
  PoliciesManager: ({ readOnly }: any) => (
    <div data-testid="mock-policies" data-readonly={String(readOnly)}>
      PoliciesManager Content
    </div>
  )
}))

jest.mock('@/components/clinic/DoctorsManager', () => ({
  DoctorsManager: ({ readOnly }: any) => (
    <div data-testid="mock-doctors" data-readonly={String(readOnly)}>
      DoctorsManager Content
    </div>
  )
}))

describe('KnowledgeBasePage (Fase 6.5)', () => {
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
  // ✅ TEST 1: Renderizado de Tab Activo Según URL
  // ==========================================
  it('renders the active tab content based on the URL search param (?tab=treatments)', () => {
    setupAuth({
      knowledge_base: { view: true, edit: true }
    })
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('?tab=treatments'))

    render(<KnowledgeBasePage />)

    expect(screen.getByTestId('mock-treatments')).toBeInTheDocument()
    expect(screen.queryByTestId('mock-config')).not.toBeInTheDocument()
    expect(screen.queryByTestId('mock-schedules')).not.toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 2: Actualización de URL al cambiar de Tab
  // ==========================================
  it('updates the URL query param correctly when clicking on a different tab button', () => {
    setupAuth({
      knowledge_base: { view: true, edit: true }
    })
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('?tab=general'))

    render(<KnowledgeBasePage />)

    const schedulesTabBtn = screen.getByRole('button', { name: /Horarios/i })
    fireEvent.click(schedulesTabBtn)

    expect(mockPush).toHaveBeenCalledWith('?tab=schedules')
  })

  // ==========================================
  // ✅ TEST 3: Cada Tab Muestra su Organismo Correspondiente
  // ==========================================
  it('displays the correct sub-organism component for each selected active tab', () => {
    setupAuth({
      knowledge_base: { view: true, edit: true }
    })

    // General tab
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('?tab=general'))
    const { rerender } = render(<KnowledgeBasePage />)
    expect(screen.getByTestId('mock-config')).toBeInTheDocument()

    // Schedules tab
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('?tab=schedules'))
    rerender(<KnowledgeBasePage />)
    expect(screen.getByTestId('mock-schedules')).toBeInTheDocument()

    // Treatments tab
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('?tab=treatments'))
    rerender(<KnowledgeBasePage />)
    expect(screen.getByTestId('mock-treatments')).toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 4: Denegación de Acceso sin Permiso
  // ==========================================
  it('blocks page view and shows Access Denied layout when the user lacks knowledge_base.view permission', () => {
    setupAuth({
      knowledge_base: { view: false, edit: false } // No permissions
    })
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''))

    render(<KnowledgeBasePage />)

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument()
    expect(screen.getByText(/No tienes los permisos necesarios para ver o modificar la base de conocimiento/i)).toBeInTheDocument()
    expect(screen.queryByTestId('mock-config')).not.toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 5: Formularios de Solo Lectura sin Permiso de Edición
  // ==========================================
  it('forces child forms to be read-only when the user has view permissions but lacks knowledge_base.edit', () => {
    setupAuth({
      knowledge_base: { view: true, edit: false } // View-only access
    })
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('?tab=general'))

    render(<KnowledgeBasePage />)

    const configComponent = screen.getByTestId('mock-config')
    expect(configComponent).toHaveAttribute('data-readonly', 'true')
    expect(screen.getByText('Modo Solo Lectura')).toBeInTheDocument()
  })
})
