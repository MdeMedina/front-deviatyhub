import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TreatmentDetailPage from '@/app/(dashboard)/knowledge-base/treatments/[id]/page'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import {
  useTreatmentDetail,
  useCreateOffer,
  useDeleteOffer
} from '@/lib/api/hooks/use-clinic'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn()
}))

// Mock framer-motion to bypass animation triggers
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}))

// Mock clinic hooks
jest.mock('@/lib/api/hooks/use-clinic', () => ({
  useTreatmentDetail: jest.fn(),
  useCreateOffer: jest.fn(),
  useDeleteOffer: jest.fn()
}))

describe('TreatmentDetailPage (Fase 6.1 & 6.4 - Dynamic details & Offers)', () => {
  const mockPush = jest.fn()
  const mockMutateCreate = jest.fn()
  const mockMutateDelete = jest.fn()

  const mockTreatmentData = {
    id: 'treat-123',
    name: 'Limpieza Dental Ultrasonido',
    description: 'Tratamiento profiláctico completo contra placa y sarro.',
    duration_min: 45,
    price: 60000,
    price_isapre: 40000,
    price_fonasa: 45000,
    accepts_isapre: true,
    accepts_fonasa: true,
    active: true,
    encyclopedia_ref: 'Profilaxis Dental',
    doctors: [
      { id: 'doc-1', name: 'Dr. John Doe' }
    ],
    offers: [
      {
        id: 'offer-1',
        label: 'Cyber Limpieza',
        discount_pct: 20,
        fixed_price: 48000,
        valid_from: '2026-06-01T00:00:00.000Z',
        valid_until: '2026-06-30T00:00:00.000Z',
        active: true
      }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useParams as jest.Mock).mockReturnValue({ id: 'treat-123' })
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })

    // Setup default query states
    ;(useTreatmentDetail as jest.Mock).mockReturnValue({
      data: mockTreatmentData,
      isLoading: false,
      isError: false,
      refetch: jest.fn()
    })
    ;(useCreateOffer as jest.Mock).mockReturnValue({
      mutate: mockMutateCreate,
      isPending: false
    })
    ;(useDeleteOffer as jest.Mock).mockReturnValue({
      mutate: mockMutateDelete,
      isPending: false
    })

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
  // ✅ TEST 1: Renderizado Completo de la Ficha
  // ==========================================
  it('renders complete treatment card detailing clinical parameters, pricing, and doctors', () => {
    setupAuth({
      knowledge_base: { view: true, edit: true }
    })

    render(<TreatmentDetailPage />)

    // Verify Title & Badges
    expect(screen.getByText('Limpieza Dental Ultrasonido')).toBeInTheDocument()
    expect(screen.getByText('Activo en Clínica')).toBeInTheDocument()
    
    // Verify technical description
    expect(screen.getByText(/Tratamiento profiláctico completo contra placa y sarro/i)).toBeInTheDocument()
    expect(screen.getByText('45 minutos por sesión')).toBeInTheDocument()
    expect(screen.getByText('Profilaxis Dental')).toBeInTheDocument()

    // Verify comparative aranceles structure
    expect(screen.getByText('$60.000')).toBeInTheDocument()
    expect(screen.getByText('$40.000')).toBeInTheDocument()
    expect(screen.getByText('$45.000')).toBeInTheDocument()

    // Verify doctors list
    expect(screen.getByText('Dr. John Doe')).toBeInTheDocument()

    // Verify existing offer card
    expect(screen.getByText('Cyber Limpieza')).toBeInTheDocument()
    expect(screen.getByText('20% de descuento')).toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 2: Creación Exitosa de Oferta (useCreateOffer)
  // ==========================================
  it('successfully opens modal, validates fields, and triggers useCreateOffer mutation', async () => {
    setupAuth({
      knowledge_base: { view: true, edit: true }
    })

    render(<TreatmentDetailPage />)

    // Open offer modal
    const openModalBtn = screen.getByTestId('add-offer-btn')
    fireEvent.click(openModalBtn)

    expect(screen.getByText('Crear Nueva Promoción')).toBeInTheDocument()

    // Type form values
    const labelInput = screen.getByLabelText(/Etiqueta \/ Nombre de la Campaña/i)
    const discountInput = screen.getByLabelText(/Porcentaje de Descuento/i)
    const validFromInput = screen.getByLabelText(/Vigente Desde/i)
    const validUntilInput = screen.getByLabelText(/Vigente Hasta/i)

    fireEvent.change(labelInput, { target: { value: 'Descuento Especial Invierno' } })
    fireEvent.change(discountInput, { target: { value: '15' } })
    fireEvent.change(validFromInput, { target: { value: '2026-06-01' } })
    fireEvent.change(validUntilInput, { target: { value: '2026-06-15' } })

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Guardar Promoción/i })
    fireEvent.click(submitBtn)

    // Verify mutation triggered with parsed params
    await waitFor(() => {
      expect(mockMutateCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Descuento Especial Invierno',
          discount_pct: 15,
          active: true
        }),
        expect.any(Object)
      )
    })
  })

  // ==========================================
  // ✅ TEST 3: Eliminación Exitosa de Oferta (useDeleteOffer)
  // ==========================================
  it('displays confirm deletion dialog and triggers useDeleteOffer mutation upon approval', async () => {
    setupAuth({
      knowledge_base: { view: true, edit: true }
    })

    render(<TreatmentDetailPage />)

    // Find and click delete offer button
    const deleteBtn = screen.getByTestId('delete-offer-offer-1')
    fireEvent.click(deleteBtn)

    // Verify delete modal opens
    expect(screen.getByText('¿Deseas desvincular esta promoción?')).toBeInTheDocument()

    // Confirm deletion
    const confirmBtn = screen.getByRole('button', { name: /Eliminar Promoción/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockMutateDelete).toHaveBeenCalledWith('offer-1', expect.any(Object))
    })
  })

  // ==========================================
  // ❌ TEST 4: Denegación de Acceso y Redirección
  // ==========================================
  it('blocks view and displays Access Denied message when the user lacks view permission', () => {
    setupAuth({
      knowledge_base: { view: false, edit: false }
    })

    render(<TreatmentDetailPage />)

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument()
    expect(screen.queryByText('Limpieza Dental Ultrasonido')).not.toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 5: Manejo de Error en Carga de Datos
  // ==========================================
  it('displays a fallback error state when the API call fails', () => {
    setupAuth({
      knowledge_base: { view: true, edit: false }
    })

    // Mock isError state
    ;(useTreatmentDetail as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: jest.fn()
    })

    render(<TreatmentDetailPage />)

    expect(screen.getByText('Error al cargar ficha')).toBeInTheDocument()
    expect(screen.getByText(/No se pudo obtener la información de este tratamiento clínico/i)).toBeInTheDocument()
  })
})
