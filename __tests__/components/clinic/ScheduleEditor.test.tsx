import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ScheduleEditor } from '@/components/clinic/ScheduleEditor'
import { useClinicSchedules, useUpdateSchedules } from '@/lib/api/hooks/use-clinic'
import { useUIStore } from '@/lib/stores/ui.store'

// Mock hooks
jest.mock('@/lib/api/hooks/use-clinic')

describe('ScheduleEditor — UI & Validation Integration', () => {
  const mockMutate = jest.fn()
  let addToastSpy: jest.SpyInstance

  const mockSchedulesData = [
    { id: '1', day_of_week: 1, open_time: '09:00', close_time: '18:00', is_open: true },
    { id: '2', day_of_week: 2, open_time: '09:00', close_time: '18:00', is_open: true },
    { id: '3', day_of_week: 3, open_time: '09:00', close_time: '18:00', is_open: true },
    { id: '4', day_of_week: 4, open_time: '09:00', close_time: '18:00', is_open: true },
    { id: '5', day_of_week: 5, open_time: '09:00', close_time: '18:00', is_open: true },
    { id: '6', day_of_week: 6, open_time: '09:00', close_time: '14:00', is_open: false },
    { id: '0', day_of_week: 0, open_time: '09:00', close_time: '14:00', is_open: false },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useClinicSchedules as jest.Mock).mockReturnValue({
      data: mockSchedulesData,
      isLoading: false,
      isError: false,
    })
    ;(useUpdateSchedules as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    })
    addToastSpy = jest.spyOn(useUIStore.getState(), 'addToast').mockImplementation(() => {})
  })

  afterEach(() => {
    addToastSpy.mockRestore()
  })

  // ==========================================
  // ✅ TEST 1: Renderizado Completo y Pre-poblamiento
  // ==========================================
  it('renders all 7 days of the week populated with backend data correctly', () => {
    render(<ScheduleEditor />)

    expect(screen.getByText('Lunes')).toBeInTheDocument()
    expect(screen.getByText('Sábado')).toBeInTheDocument()
    expect(screen.getByText('Domingo')).toBeInTheDocument()

    // Retrieve inputs for Lunes
    const lunesOpen = screen.getByLabelText('Lunes Hora Apertura')
    const lunesClose = screen.getByLabelText('Lunes Hora Cierre')
    expect(lunesOpen).toHaveValue('09:00')
    expect(lunesClose).toHaveValue('18:00')

    // Closed days inputs should be disabled
    const sabadoOpen = screen.getByLabelText('Sábado Hora Apertura')
    expect(sabadoOpen).toBeDisabled()
  })

  // ==========================================
  // ✅ TEST 2: Interactividad del Switch (Toggle)
  // ==========================================
  it('toggles a closed day to open, enabling its hour inputs', () => {
    render(<ScheduleEditor />)

    const sabadoOpen = screen.getByLabelText('Sábado Hora Apertura')
    expect(sabadoOpen).toBeDisabled()

    // Click toggle button for Sábado
    const toggleButton = screen.getByRole('button', { name: 'Toggle Sábado' })
    fireEvent.click(toggleButton)

    // Should now be enabled
    expect(sabadoOpen).not.toBeDisabled()
  })

  // ==========================================
  // ✅ TEST 3: Envío Exitoso de Payload Actualizado
  // ==========================================
  it('submits updated schedules successfully when valid', async () => {
    mockMutate.mockImplementation((payload, options) => {
      options.onSuccess()
    })

    render(<ScheduleEditor />)

    // Modify Martes open time
    const martesOpen = screen.getByLabelText('Martes Hora Apertura')
    fireEvent.change(martesOpen, { target: { value: '08:30' } })

    // Submit form using standard submit call
    fireEvent.submit(screen.getByRole('form'))

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled()
    })

    // Confirm toast was shown
    expect(addToastSpy).toHaveBeenCalledWith({
      title: 'Horarios actualizados',
      message: 'El horario de atención semanal se ha guardado con éxito.',
      type: 'success',
    })
  })

  // ==========================================
  // ❌ TEST 4: Validación Horaria Inválida (open_time >= close_time)
  // ==========================================
  it('shows error message and blocks submission when open_time is greater or equal to close_time', async () => {
    render(<ScheduleEditor />)

    // Set Lunes close time to be BEFORE open time (e.g. 08:00)
    const lunesClose = screen.getByLabelText('Lunes Hora Cierre')
    fireEvent.change(lunesClose, { target: { value: '08:00' } })

    // Submit form
    fireEvent.submit(screen.getByRole('form'))

    expect(
      await screen.findByText('La hora de apertura debe ser menor a la hora de cierre')
    ).toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  // ==========================================
  // ❌ TEST 5: Deshabilitación del Botón durante Envío (Pending)
  // ==========================================
  it('disables the save button and displays processing state when update is pending', () => {
    ;(useUpdateSchedules as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    })

    render(<ScheduleEditor />)

    const saveButton = screen.getByRole('button', { name: /Procesando.../i })
    expect(saveButton).toBeDisabled()
  })
})
