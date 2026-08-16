import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TreatmentsManager } from '@/components/clinic/TreatmentsManager'
import {
  useTreatments,
  useCreateTreatment,
  useUpdateTreatment,
  useDeleteTreatment,
  useEncyclopedia,
} from '@/lib/api/hooks/use-clinic'
import { useUIStore } from '@/lib/stores/ui.store'

// Mock the Modal component to render inline and simply in JSDOM tests
jest.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, children, title, onClose }: any) => {
    if (!isOpen) return null
    return (
      <div data-testid="mock-modal" aria-label={title}>
        <div className="flex items-center justify-between">
          <h3>{title}</h3>
          <button onClick={onClose} aria-label="Cerrar modal">X</button>
        </div>
        <div>{children}</div>
      </div>
    )
  }
}))

// Mock hooks
jest.mock('@/lib/api/hooks/use-clinic')

describe('TreatmentsManager — CRUD & Medical Autocomplete Integration', () => {
  const mockCreateMutate = jest.fn()
  const mockUpdateMutate = jest.fn()
  const mockDeleteMutate = jest.fn()
  let addToastSpy: jest.SpyInstance

  const mockTreatmentsData = [
    {
      id: 't1',
      name: 'Limpieza Dental',
      description: 'Limpieza profunda con ultrasonido y profilaxis.',
      price: 25000,
      duration_min: 30,
      price_isapre: 25000,
      price_fonasa: 25000,
      accepts_isapre: true,
      accepts_fonasa: true,
      active: true,
      encyclopedia_ref: '',
      doctors: [],
    },
    {
      id: 't2',
      name: 'Endodoncia Simple',
      description: 'Tratamiento de conducto molar regular.',
      price: 85000,
      duration_min: 60,
      price_isapre: 85000,
      price_fonasa: 85000,
      accepts_isapre: true,
      accepts_fonasa: true,
      active: true,
      encyclopedia_ref: '',
      doctors: [],
    },
  ]

  const mockEncyclopediaData = [
    {
      id: 'e1',
      name: 'Endodoncia',
      description: 'Tratamiento clínico del conducto radicular dental.',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useTreatments as jest.Mock).mockReturnValue({
      data: mockTreatmentsData,
      isLoading: false,
      isError: false,
    })
    ;(useCreateTreatment as jest.Mock).mockReturnValue({
      mutate: mockCreateMutate,
      isPending: false,
    })
    ;(useUpdateTreatment as jest.Mock).mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
    })
    ;(useDeleteTreatment as jest.Mock).mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    })
    ;(useEncyclopedia as jest.Mock).mockReturnValue({
      data: mockEncyclopediaData,
      isLoading: false,
    })
    addToastSpy = jest.spyOn(useUIStore.getState(), 'addToast').mockImplementation(() => {})
  })

  afterEach(() => {
    addToastSpy.mockRestore()
  })

  // ==========================================
  // ✅ TEST 1: Renderizado Inicial y Filtro de Búsqueda
  // ==========================================
  it('renders treatment cards and filters them dynamically via search term', () => {
    render(<TreatmentsManager />)

    expect(screen.getByText('Limpieza Dental')).toBeInTheDocument()
    expect(screen.getByText('Endodoncia Simple')).toBeInTheDocument()

    // Type in search bar
    const searchInput = screen.getByPlaceholderText(/Buscar tratamientos/i)
    fireEvent.change(searchInput, { target: { value: 'Limpieza' } })

    // "Limpieza" should still be visible, "Endodoncia" should disappear
    expect(screen.getByText('Limpieza Dental')).toBeInTheDocument()
    expect(screen.queryByText('Endodoncia Simple')).not.toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 2: Operación de Creación Exitosa (POST)
  // ==========================================
  it('opens creation modal and submits new treatment payload correctly', async () => {
    mockCreateMutate.mockImplementation((payload, options) => {
      options.onSuccess()
    })

    render(<TreatmentsManager />)

    // Click Add Button
    fireEvent.click(screen.getByText('Agregar Tratamiento'))

    // Fill form fields
    const nameInput = await screen.findByLabelText(/Nombre del Tratamiento/i)
    const descInput = await screen.findByPlaceholderText(/Escribe los detalles e indicaciones/i)
    const priceInput = await screen.findByLabelText(/Precio/i)
    const durationInput = await screen.findByLabelText(/Duración/i)

    fireEvent.change(nameInput, { target: { value: 'Ortodoncia Metálica' } })
    fireEvent.change(descInput, { target: { value: 'Instalación de frenillos estándar.' } })
    fireEvent.change(priceInput, { target: { value: '350000' } })
    fireEvent.change(durationInput, { target: { value: '90' } })

    // Submit form
    fireEvent.submit(screen.getByRole('form'))

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledWith(
        {
          name: 'Ortodoncia Metálica',
          description: 'Instalación de frenillos estándar.',
          price: 350000,
          duration_min: 90,
          price_isapre: 350000,
          price_fonasa: 350000,
          accepts_isapre: true,
          accepts_fonasa: true,
          active: true,
          encyclopedia_ref: '',
          doctors: [],
        },
        expect.any(Object)
      )
    })

    expect(addToastSpy).toHaveBeenCalledWith({
      title: 'Tratamiento creado',
      message: 'El nuevo tratamiento se ha agregado al catálogo.',
      type: 'success',
    })
  })

  // ==========================================
  // ✅ TEST 3: Operación de Edición Exitosa (PATCH)
  // ==========================================
  it('opens edit modal with populated fields and updates treatment correctly', async () => {
    mockUpdateMutate.mockImplementation((payload, options) => {
      options.onSuccess()
    })

    render(<TreatmentsManager />)

    // Click Edit on the first treatment (Limpieza Dental)
    const editButtons = screen.getAllByTitle('Editar Tratamiento')
    fireEvent.click(editButtons[0])

    // Verify fields are pre-populated
    const nameInput = await screen.findByLabelText(/Nombre del Tratamiento/i)
    expect(nameInput).toHaveValue('Limpieza Dental')

    // Modify price
    const priceInput = await screen.findByLabelText(/Precio/i)
    fireEvent.change(priceInput, { target: { value: '30000' } })

    // Submit
    fireEvent.submit(screen.getByRole('form'))

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith(
        {
          id: 't1',
          name: 'Limpieza Dental',
          description: 'Limpieza profunda con ultrasonido y profilaxis.',
          price: 30000,
          duration_min: 30,
          price_isapre: 30000,
          price_fonasa: 30000,
          accepts_isapre: true,
          accepts_fonasa: true,
          active: true,
          encyclopedia_ref: '',
          doctors: [],
        },
        expect.any(Object)
      )
    })

    expect(addToastSpy).toHaveBeenCalledWith({
      title: 'Tratamiento actualizado',
      message: 'El tratamiento ha sido modificado exitosamente.',
      type: 'success',
    })
  })

  // ==========================================
  // ✅ TEST 4: Autocompletado desde la Enciclopedia Médica
  // ==========================================
  it('fills name and description automatically when selecting a result from the encyclopedia search', async () => {
    render(<TreatmentsManager />)

    fireEvent.click(screen.getByText('Agregar Tratamiento'))

    const encInput = await screen.findByPlaceholderText(/Escribe para buscar/i)
    fireEvent.change(encInput, { target: { value: 'Endo' } })

    // Suggestions list should render matches
    const suggestionsBtn = await screen.findByRole('button', { name: /Endodoncia/i })
    expect(suggestionsBtn).toBeInTheDocument()

    // Click suggestion
    fireEvent.click(suggestionsBtn)

    // Inputs should be pre-populated
    const nameInput = await screen.findByLabelText(/Nombre del Tratamiento/i)
    const descInput = await screen.findByPlaceholderText(/Escribe los detalles e indicaciones/i)

    expect(nameInput).toHaveValue('Endodoncia')
    expect(descInput).toHaveValue('Tratamiento clínico del conducto radicular dental.')
  })

  // ==========================================
  // ❌ TEST 5: Validación de Rangos Numéricos Inválidos
  // ==========================================
  it('prevents form submission and shows errors when price is negative or duration is zero', async () => {
    render(<TreatmentsManager />)

    fireEvent.click(screen.getByText('Agregar Tratamiento'))

    const nameInput = await screen.findByLabelText(/Nombre del Tratamiento/i)
    const priceInput = await screen.findByLabelText(/Precio/i)
    const durationInput = await screen.findByLabelText(/Duración/i)

    fireEvent.change(nameInput, { target: { value: 'Tratamiento Fallido' } })
    fireEvent.change(priceInput, { target: { value: '-20' } })
    fireEvent.change(durationInput, { target: { value: '0' } })

    fireEvent.submit(screen.getByRole('form'))

    expect(await screen.findByText('El precio debe ser mayor o igual a 0')).toBeInTheDocument()
    expect(await screen.findByText('La duración debe ser mayor a 0 minutos')).toBeInTheDocument()
    expect(mockCreateMutate).not.toHaveBeenCalled()
  })

  // ==========================================
  // ❌ TEST 6: Operación de Eliminación Segura (DELETE)
  // ==========================================
  it('opens confirmation modal and deletes treatment successfully', async () => {
    mockDeleteMutate.mockImplementation((id, options) => {
      options.onSuccess()
    })

    render(<TreatmentsManager />)

    // Click Trash on the second treatment (Endodoncia Simple)
    const deleteButtons = screen.getAllByTitle('Eliminar Tratamiento')
    fireEvent.click(deleteButtons[1])

    // Expect delete confirmation modal details to show
    expect(
      await screen.findByText(/Esta acción eliminará el tratamiento/i)
    ).toBeInTheDocument()

    // Click Confirm button
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Eliminar' }))

    await waitFor(() => {
      expect(mockDeleteMutate).toHaveBeenCalledWith('t2', expect.any(Object))
    })

    expect(addToastSpy).toHaveBeenCalledWith({
      title: 'Tratamiento eliminado',
      message: 'El tratamiento se ha eliminado con éxito.',
      type: 'success',
    })
  })
})
