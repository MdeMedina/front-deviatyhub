import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClinicConfigForm } from '@/components/clinic/ClinicConfigForm'
import { useClinicConfig, useUpdateClinicConfig } from '@/lib/api/hooks/use-clinic'
import { useUIStore } from '@/lib/stores/ui.store'

// Mock hooks
jest.mock('@/lib/api/hooks/use-clinic')

describe('ClinicConfigForm — UI & Validation Integration', () => {
  const mockMutate = jest.fn()
  let addToastSpy: jest.SpyInstance

  const mockClinicData = {
    id: 'clinic-123',
    name: 'Clinica Dental San Miguel',
    email: 'contacto@sanmiguel.cl',
    phone: '+56987654321',
    address: 'Gran Avenida 4567',
    timezone: 'America/Santiago',
    language: 'es',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useClinicConfig as jest.Mock).mockReturnValue({
      data: mockClinicData,
      isLoading: false,
      isError: false,
    })
    ;(useUpdateClinicConfig as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    })
    addToastSpy = jest.spyOn(useUIStore.getState(), 'addToast').mockImplementation(() => {})
  })

  afterEach(() => {
    addToastSpy.mockRestore()
  })

  // ==========================================
  // ✅ TEST 1: Pre-poblamiento y Carga de Datos
  // ==========================================
  it('pre-populates the form fields with current clinic data from the query hook', () => {
    render(<ClinicConfigForm />)

    expect(screen.getByLabelText(/Nombre de la Clínica/i)).toHaveValue('Clinica Dental San Miguel')
    expect(screen.getByLabelText(/Teléfono de Contacto/i)).toHaveValue('+56987654321')
    expect(screen.getByLabelText(/Correo Electrónico/i)).toHaveValue('contacto@sanmiguel.cl')
    expect(screen.getByLabelText(/Dirección Física/i)).toHaveValue('Gran Avenida 4567')
    expect(screen.getByLabelText(/Zona Horaria/i)).toHaveValue('America/Santiago')
    expect(screen.getByLabelText(/Idioma por Defecto/i)).toHaveValue('es')
  })

  // ==========================================
  // ✅ TEST 2: Envío y Mutación Exitosa (PATCH)
  // ==========================================
  it('submits updated values and triggers the update mutation successfully', async () => {
    // Setup mutate to trigger onSuccess
    mockMutate.mockImplementation((payload, options) => {
      options.onSuccess()
    })

    render(<ClinicConfigForm />)

    const nameInput = screen.getByLabelText(/Nombre de la Clínica/i)
    const emailInput = screen.getByLabelText(/Correo Electrónico/i)

    fireEvent.change(nameInput, { target: { value: 'Clinica Dental Actualizada' } })
    fireEvent.change(emailInput, { target: { value: 'soporte@actualizada.cl' } })

    fireEvent.submit(screen.getByRole('form'))

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          name: 'Clinica Dental Actualizada',
          email: 'soporte@actualizada.cl',
          phone: '+56987654321',
          address: 'Gran Avenida 4567',
          timezone: 'America/Santiago',
          language: 'es',
        },
        expect.any(Object)
      )
    })

    expect(addToastSpy).toHaveBeenCalledWith({
      title: 'Configuración guardada',
      message: 'Los datos de la clínica se han actualizado con éxito.',
      type: 'success',
    })
  })

  // ==========================================
  // ✅ TEST 3: Estado de Cargando y Botón Deshabilitado (Pending)
  // ==========================================
  it('disables the save button and shows a spinner while update is pending', () => {
    ;(useUpdateClinicConfig as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    })

    render(<ClinicConfigForm />)

    const saveButton = screen.getByRole('button', { name: /Procesando.../i })
    expect(saveButton).toBeDisabled()
  })

  // ❌ TEST 4: Validación de Email Inválido (Previene API)
  it('shows validation error for invalid email format and prevents API call', async () => {
    render(<ClinicConfigForm />)

    const emailInput = screen.getByLabelText(/Correo Electrónico/i)
    fireEvent.change(emailInput, { target: { value: 'correo-sin-formato' } })

    fireEvent.submit(screen.getByRole('form'))

    expect(await screen.findByText('El formato del correo electrónico no es válido')).toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  // ❌ TEST 5: Validación de Campos Requeridos Vacíos
  it('shows errors for empty required fields (name, phone) and prevents API call', async () => {
    render(<ClinicConfigForm />)

    const nameInput = screen.getByLabelText(/Nombre de la Clínica/i)
    const phoneInput = screen.getByLabelText(/Teléfono de Contacto/i)

    fireEvent.change(nameInput, { target: { value: '' } })
    fireEvent.change(phoneInput, { target: { value: '' } })

    fireEvent.submit(screen.getByRole('form'))

    expect(await screen.findByText('El nombre de la clínica es requerido')).toBeInTheDocument()
    expect(await screen.findByText('El teléfono es requerido')).toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })
})
