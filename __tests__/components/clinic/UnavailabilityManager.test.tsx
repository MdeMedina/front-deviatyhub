import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UnavailabilityManager } from '@/components/clinic/UnavailabilityManager'
import {
  useUnavailability,
  useCreateUnavailability,
  useUpdateUnavailability,
  useDeleteUnavailability
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

describe('UnavailabilityManager — UI & Validation Integration (Fase 6.1)', () => {
  const mockCreateMutate = jest.fn()
  const mockUpdateMutate = jest.fn()
  const mockDeleteMutate = jest.fn()
  let addToastSpy: jest.SpyInstance

  const mockBlocks = [
    {
      id: 'block-1',
      name: 'Almuerzo del Equipo',
      days_of_week: [1, 2, 3, 4, 5],
      start_time: '13:00',
      end_time: '14:30',
      active: true,
    },
    {
      id: 'block-2',
      name: 'Reunión Semanal',
      days_of_week: [5],
      start_time: '17:00',
      end_time: '18:00',
      active: false,
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(useUnavailability as jest.Mock).mockReturnValue({
      data: mockBlocks,
      isLoading: false,
      isError: false,
    })
    ;(useCreateUnavailability as jest.Mock).mockReturnValue({
      mutate: mockCreateMutate,
      isPending: false,
    })
    ;(useUpdateUnavailability as jest.Mock).mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
    })
    ;(useDeleteUnavailability as jest.Mock).mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    })

    addToastSpy = jest.spyOn(useUIStore.getState(), 'addToast').mockImplementation(() => {})
  })

  afterEach(() => {
    addToastSpy.mockRestore()
  })

  // ==========================================
  // ✅ TEST 1: Renderizado Inicial y Listado
  // ==========================================
  it('renders list of current unavailability blocks with details and badges', () => {
    render(<UnavailabilityManager />)

    expect(screen.getByText('Almuerzo del Equipo')).toBeInTheDocument()
    expect(screen.getByText('13:00 - 14:30')).toBeInTheDocument()
    expect(screen.getByText('Reunión Semanal')).toBeInTheDocument()
    expect(screen.getByText('17:00 - 18:00')).toBeInTheDocument()
    
    // Check presence of status badges
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 2: Creación Funcional con Éxito (POST)
  // ==========================================
  it('opens create modal, allows filling details, and submits to create mutation', async () => {
    mockCreateMutate.mockImplementation((payload, options) => {
      options.onSuccess()
    })

    render(<UnavailabilityManager />)

    const addButton = screen.getByRole('button', { name: /Agregar Bloqueo/i })
    fireEvent.click(addButton)

    // Form inputs inside modal
    const nameInput = screen.getByLabelText(/Nombre del Bloqueo/i)
    fireEvent.change(nameInput, { target: { value: 'Bloqueo Dentalink' } })

    // Select Monday (short code L) and Wednesday (short code M)
    // There are two 'M' short codes (Martes & Miércoles).
    // Let's toggle the button by testing-aria or short code.
    const dayLunesBtn = screen.getByRole('button', { name: /Toggle día Lunes/i })
    fireEvent.click(dayLunesBtn)

    const startTimeInput = screen.getByLabelText('Hora de Inicio')
    const endTimeInput = screen.getByLabelText('Hora de Término')
    
    fireEvent.change(startTimeInput, { target: { value: '08:00' } })
    fireEvent.change(endTimeInput, { target: { value: '09:00' } })

    fireEvent.submit(screen.getByLabelText('unavailability-form'))

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledWith(
        {
          name: 'Bloqueo Dentalink',
          days_of_week: [1],
          start_time: '08:00',
          end_time: '09:00',
          active: true,
        },
        expect.any(Object)
      )
    })

    expect(addToastSpy).toHaveBeenCalledWith({
      title: 'Bloqueo creado',
      message: 'El nuevo bloqueo de no disponibilidad se ha registrado con éxito.',
      type: 'success',
    })
  })

  // ==========================================
  // ✅ TEST 3: Edición Funcional Exitosa (PUT)
  // ==========================================
  it('opens edit modal with pre-populated values and submits update mutation', async () => {
    mockUpdateMutate.mockImplementation((payload, options) => {
      options.onSuccess()
    })

    render(<UnavailabilityManager />)

    // Click Edit icon button for 'Almuerzo del Equipo'
    const editBtn = screen.getByRole('button', { name: /Editar Almuerzo del Equipo/i })
    fireEvent.click(editBtn)

    const nameInput = screen.getByLabelText(/Nombre del Bloqueo/i)
    expect(nameInput).toHaveValue('Almuerzo del Equipo')

    // Change name
    fireEvent.change(nameInput, { target: { value: 'Almuerzo Ampliado' } })

    fireEvent.submit(screen.getByLabelText('unavailability-form'))

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith(
        {
          id: 'block-1',
          name: 'Almuerzo Ampliado',
          days_of_week: [1, 2, 3, 4, 5],
          start_time: '13:00',
          end_time: '14:30',
          active: true,
        },
        expect.any(Object)
      )
    })

    expect(addToastSpy).toHaveBeenCalledWith({
      title: 'Bloqueo actualizado',
      message: 'El bloqueo de no disponibilidad se ha actualizado correctamente.',
      type: 'success',
    })
  })

  // ==========================================
  // ❌ TEST 4: Control de Error (Hora Inicio >= Término)
  // ==========================================
  it('prevents form submit and displays validation error if start_time is greater than or equal to end_time', async () => {
    render(<UnavailabilityManager />)

    const addButton = screen.getByRole('button', { name: /Agregar Bloqueo/i })
    fireEvent.click(addButton)

    const nameInput = screen.getByLabelText(/Nombre del Bloqueo/i)
    fireEvent.change(nameInput, { target: { value: 'Error Horas' } })

    const dayLunesBtn = screen.getByRole('button', { name: /Toggle día Lunes/i })
    fireEvent.click(dayLunesBtn)

    const startTimeInput = screen.getByLabelText('Hora de Inicio')
    const endTimeInput = screen.getByLabelText('Hora de Término')
    
    // Set start time 14:00 and end time 13:00 (Invalid!)
    fireEvent.change(startTimeInput, { target: { value: '14:00' } })
    fireEvent.change(endTimeInput, { target: { value: '13:00' } })

    fireEvent.submit(screen.getByLabelText('unavailability-form'))

    expect(await screen.findByText('La hora de término debe ser mayor a la hora de inicio')).toBeInTheDocument()
    expect(mockCreateMutate).not.toHaveBeenCalled()
  })

  // ==========================================
  // ❌ TEST 5: Fallo de Carga de API
  // ==========================================
  it('displays accurate fallback error state when query API fails to load data', () => {
    ;(useUnavailability as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    render(<UnavailabilityManager />)

    expect(
      screen.getByText('No se pudieron cargar los periodos de no disponibilidad.')
    ).toBeInTheDocument()
    expect(screen.queryByText('Almuerzo del Equipo')).not.toBeInTheDocument()
  })
})
