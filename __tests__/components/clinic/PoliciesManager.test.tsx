import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PoliciesManager } from '@/components/clinic/PoliciesManager'
import {
  usePolicies,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy
} from '@/lib/api/hooks/use-clinic'
import { useUIStore } from '@/lib/stores/ui.store'

// Mock hooks
jest.mock('@/lib/api/hooks/use-clinic')

// Mock framer-motion to bypass animation triggers
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('PoliciesManager — UI & Validation Integration (Fase 6.2)', () => {
  const mockCreateMutate = jest.fn()
  const mockUpdateMutate = jest.fn()
  const mockDeleteMutate = jest.fn()
  let addToastSpy: jest.SpyInstance

  const mockPolicies = [
    {
      id: 'policy-1',
      title: 'Política de Cancelación 24hs',
      description: 'El paciente debe cancelar o reprogramar con un mínimo de 24 horas de anticipación.',
      active: true,
    },
    {
      id: 'policy-2',
      title: 'Regla de Inasistencia',
      description: 'Tras tres inasistencias injustificadas, se requerirá pago anticipado para nuevas reservas.',
      active: false,
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(usePolicies as jest.Mock).mockReturnValue({
      data: mockPolicies,
      isLoading: false,
      isError: false,
    })
    ;(useCreatePolicy as jest.Mock).mockReturnValue({
      mutate: mockCreateMutate,
      isPending: false,
    })
    ;(useUpdatePolicy as jest.Mock).mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
    })
    ;(useDeletePolicy as jest.Mock).mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    })

    addToastSpy = jest.spyOn(useUIStore.getState(), 'addToast').mockImplementation(() => {})
  })

  afterEach(() => {
    addToastSpy.mockRestore()
  })

  // ==========================================
  // ✅ TEST 1: Renderizado Inicial de Políticas
  // ==========================================
  it('renders clinical policies catalog list with detailed texts and badges', () => {
    render(<PoliciesManager />)

    expect(screen.getByText('Política de Cancelación 24hs')).toBeInTheDocument()
    expect(
      screen.getByText(/El paciente debe cancelar o reprogramar con un mínimo de 24 horas/i)
    ).toBeInTheDocument()
    
    expect(screen.getByText('Regla de Inasistencia')).toBeInTheDocument()
    expect(
      screen.getByText(/Tras tres inasistencias injustificadas, se requerirá pago anticipado/i)
    ).toBeInTheDocument()

    expect(screen.getByText('Activa')).toBeInTheDocument()
    expect(screen.getByText('Inactiva')).toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 2: Creación Exitosa (POST)
  // ==========================================
  it('opens create modal, processes input, and submits to create mutation', async () => {
    mockCreateMutate.mockImplementation((payload, options) => {
      options.onSuccess()
    })

    render(<PoliciesManager />)

    const addButton = screen.getByRole('button', { name: /Agregar Política/i })
    fireEvent.click(addButton)

    // Form inputs inside modal
    const titleInput = screen.getByLabelText(/Título de la Política/i)
    fireEvent.change(titleInput, { target: { value: 'Política de Reembolsos' } })

    const descriptionInput = screen.getByLabelText(/Descripción detallada/i)
    fireEvent.change(descriptionInput, { target: { value: 'Se realiza reembolso del 100% si se cancela con 48hs de anticipación.' } })

    fireEvent.submit(screen.getByLabelText('policy-form'))

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledWith(
        {
          title: 'Política de Reembolsos',
          description: 'Se realiza reembolso del 100% si se cancela con 48hs de anticipación.',
          active: true,
        },
        expect.any(Object)
      )
    })

    expect(addToastSpy).toHaveBeenCalledWith({
      title: 'Política creada',
      message: 'Se ha registrado la nueva política con éxito.',
      type: 'success',
    })
  })

  // ==========================================
  // ✅ TEST 3: Edición Exitosa (PUT)
  // ==========================================
  it('opens edit modal pre-populated and triggers update mutation correctly', async () => {
    mockUpdateMutate.mockImplementation((payload, options) => {
      options.onSuccess()
    })

    render(<PoliciesManager />)

    // Click Edit button for 'Política de Cancelación 24hs'
    const editBtn = screen.getByRole('button', { name: /Editar Política de Cancelación 24hs/i })
    fireEvent.click(editBtn)

    const titleInput = screen.getByLabelText(/Título de la Política/i)
    expect(titleInput).toHaveValue('Política de Cancelación 24hs')

    // Change title
    fireEvent.change(titleInput, { target: { value: 'Política de Cancelación 12hs' } })

    fireEvent.submit(screen.getByLabelText('policy-form'))

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith(
        {
          id: 'policy-1',
          title: 'Política de Cancelación 12hs',
          description: 'El paciente debe cancelar o reprogramar con un mínimo de 24 horas de anticipación.',
          active: true,
        },
        expect.any(Object)
      )
    })

    expect(addToastSpy).toHaveBeenCalledWith({
      title: 'Política actualizada',
      message: 'La política clínica se ha modificado con éxito.',
      type: 'success',
    })
  })

  // ==========================================
  // ❌ TEST 4: Validación de Campos Requeridos Vacíos
  // ==========================================
  it('shows error validations when title or description is missing and prevents submit', async () => {
    render(<PoliciesManager />)

    const addButton = screen.getByRole('button', { name: /Agregar Política/i })
    fireEvent.click(addButton)

    const titleInput = screen.getByLabelText(/Título de la Política/i)
    fireEvent.change(titleInput, { target: { value: '' } }) // Empty title

    fireEvent.submit(screen.getByLabelText('policy-form'))

    expect(await screen.findByText('El título de la política es requerido')).toBeInTheDocument()
    expect(mockCreateMutate).not.toHaveBeenCalled()
  })

  // ==========================================
  // ❌ TEST 5: Fallo de Carga de API
  // ==========================================
  it('renders standard resilient error component when query call fails', () => {
    ;(usePolicies as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    render(<PoliciesManager />)

    expect(
      screen.getByText('No se pudieron cargar las políticas de la clínica.')
    ).toBeInTheDocument()
    expect(screen.queryByText('Política de Cancelación 24hs')).not.toBeInTheDocument()
  })
})
