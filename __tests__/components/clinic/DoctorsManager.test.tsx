import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DoctorsManager } from '@/components/clinic/DoctorsManager'
import {
  useDoctors,
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
  useTreatments
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

describe('DoctorsManager — UI & Validation Integration (Fase 6.3)', () => {
  const mockCreateMutate = jest.fn()
  const mockUpdateMutate = jest.fn()
  const mockDeleteMutate = jest.fn()
  let addToastSpy: jest.SpyInstance

  const mockTreatments = [
    { id: 'treatment-1', name: 'Limpieza Dental', price: 45000 },
    { id: 'treatment-2', name: 'Endodoncia Unirradicular', price: 120000 },
  ]

  const mockDoctors = [
    {
      id: 'doctor-1',
      name: 'Dr. John Doe',
      title: 'Ortodoncista',
      active: true,
      treatments: [{ id: 'treatment-1', name: 'Limpieza Dental' }],
    },
    {
      id: 'doctor-2',
      name: 'Dra. Jane Smith',
      title: 'Cirujano Dentista',
      active: false,
      treatments: [],
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(useDoctors as jest.Mock).mockReturnValue({
      data: mockDoctors,
      isLoading: false,
      isError: false,
    })
    ;(useTreatments as jest.Mock).mockReturnValue({
      data: mockTreatments,
      isLoading: false,
      isError: false,
    })
    ;(useCreateDoctor as jest.Mock).mockReturnValue({
      mutate: mockCreateMutate,
      isPending: false,
    })
    ;(useUpdateDoctor as jest.Mock).mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
    })
    ;(useDeleteDoctor as jest.Mock).mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    })

    addToastSpy = jest.spyOn(useUIStore.getState(), 'addToast').mockImplementation(() => {})
  })

  afterEach(() => {
    addToastSpy.mockRestore()
  })

  // ==========================================
  // ✅ TEST 1: Renderizado Inicial de Doctores
  // ==========================================
  it('renders clinical doctors profile cards with details and associated treatment badges', () => {
    render(<DoctorsManager />)

    expect(screen.getByText('Dr. John Doe')).toBeInTheDocument()
    expect(screen.getByText('Ortodoncista')).toBeInTheDocument()
    expect(screen.getByText('Limpieza Dental')).toBeInTheDocument()

    expect(screen.getByText('Dra. Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Cirujano Dentista')).toBeInTheDocument()
    expect(screen.getByText('Sin tratamientos vinculados.')).toBeInTheDocument()
    
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 2: Asignación de Especialidades y Creación (POST)
  // ==========================================
  it('opens create modal, allows selecting treatments from catalog, and submits create mutation', async () => {
    mockCreateMutate.mockImplementation((payload, options) => {
      options.onSuccess()
    })

    render(<DoctorsManager />)

    const addButton = screen.getByRole('button', { name: /Agregar Especialista/i })
    fireEvent.click(addButton)

    const nameInput = screen.getByLabelText(/Nombre Completo/i)
    fireEvent.change(nameInput, { target: { value: 'Dr. Gregory House' } })

    const titleInput = screen.getByLabelText(/Especialidad \/ Cargo/i)
    fireEvent.change(titleInput, { target: { value: 'Diagnosta' } })

    // Check treatment list exists in modal and click "Limpieza Dental" checkbox
    const treatmentCheckbox = screen.getByLabelText('Tratamiento Limpieza Dental')
    fireEvent.click(treatmentCheckbox)

    fireEvent.submit(screen.getByLabelText('doctor-form'))

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledWith(
        {
          name: 'Dr. Gregory House',
          title: 'Diagnosta',
          active: true,
          treatments: [{ id: 'treatment-1', name: 'Limpieza Dental' }],
        },
        expect.any(Object)
      )
    })

    expect(addToastSpy).toHaveBeenCalledWith({
      title: 'Doctor registrado',
      message: 'El nuevo especialista clínico ha sido creado con éxito.',
      type: 'success',
    })
  })

  // ==========================================
  // ✅ TEST 3: Modificación de Ficha de Doctor (PUT)
  // ==========================================
  it('opens edit modal pre-populated and submits updated fields correctly', async () => {
    mockUpdateMutate.mockImplementation((payload, options) => {
      options.onSuccess()
    })

    render(<DoctorsManager />)

    // Click Edit button for 'Dr. John Doe'
    const editBtn = screen.getByRole('button', { name: /Editar Dr. John Doe/i })
    fireEvent.click(editBtn)

    const nameInput = screen.getByLabelText(/Nombre Completo/i)
    expect(nameInput).toHaveValue('Dr. John Doe')

    // Change name
    fireEvent.change(nameInput, { target: { value: 'Dr. Johnny Doe' } })

    fireEvent.submit(screen.getByLabelText('doctor-form'))

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith(
        {
          id: 'doctor-1',
          name: 'Dr. Johnny Doe',
          title: 'Ortodoncista',
          active: true,
          treatments: [{ id: 'treatment-1', name: 'Limpieza Dental' }],
        },
        expect.any(Object)
      )
    })

    expect(addToastSpy).toHaveBeenCalledWith({
      title: 'Doctor actualizado',
      message: 'El perfil del doctor se ha guardado correctamente.',
      type: 'success',
    })
  })

  // ==========================================
  // ❌ TEST 4: Validación de Nombre o Cargo Vacío
  // ==========================================
  it('blocks submit and shows alert message if required doctor name is empty', async () => {
    render(<DoctorsManager />)

    const addButton = screen.getByRole('button', { name: /Agregar Especialista/i })
    fireEvent.click(addButton)

    const nameInput = screen.getByLabelText(/Nombre Completo/i)
    fireEvent.change(nameInput, { target: { value: '' } }) // Empty

    fireEvent.submit(screen.getByLabelText('doctor-form'))

    expect(await screen.findByText('El nombre del doctor es requerido')).toBeInTheDocument()
    expect(mockCreateMutate).not.toHaveBeenCalled()
  })

  // ==========================================
  // ❌ TEST 5: Fallo de Carga de API
  // ==========================================
  it('shows precise error fallback layout when query service fails to respond', () => {
    ;(useDoctors as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    render(<DoctorsManager />)

    expect(
      screen.getByText('No se pudo obtener el listado de doctores.')
    ).toBeInTheDocument()
    expect(screen.queryByText('Dr. John Doe')).not.toBeInTheDocument()
  })
})
