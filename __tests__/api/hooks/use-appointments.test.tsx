import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { 
  useAppointments, 
  useAppointmentDetail, 
  useUpdateAppointmentStatus, 
  useRescheduleAppointment 
} from '@/lib/api/hooks/use-appointments'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { AppointmentStatus, AppointmentSource, Channel } from '@/lib/types'
import React from 'react'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Agenda Module — Hooks', () => {
  beforeAll(() => simpleServer.listen())
  afterEach(() => simpleServer.resetHandlers())
  afterAll(() => simpleServer.close())

  const mockAppointments = [
    {
      id: 'apt-1',
      contact_name: 'John Doe',
      contact_id: 'c1',
      treatment: { id: 't1', name: 'Limpieza' },
      doctor: { id: 'd1', name: 'Dr. Smith' },
      scheduled_at: new Date().toISOString(),
      duration_min: 30,
      status: AppointmentStatus.CONFIRMED,
      source: AppointmentSource.HUMAN,
      channel: Channel.WHATSAPP,
      conversation_id: 'conv-1',
      notes: ''
    }
  ]

  describe('useAppointments', () => {
    it('successfully fetches a list of appointments', async () => {
      simpleServer.use(ENDPOINTS.agenda.appointments, async () => ({
        status: 200,
        data: {
          success: true,
          data: { data: mockAppointments, meta: { total: 1, page: 1, limit: 10, total_pages: 1 } }
        }
      }))

      const { result } = renderHook(() => useAppointments(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.data).toHaveLength(1)
      expect(result.current.data?.data[0].contact_name).toBe('John Doe')
    })
  })

  describe('useAppointmentDetail', () => {
    it('successfully fetches appointment details by ID', async () => {
      const detail = { ...mockAppointments[0], history: [] }
      simpleServer.use(ENDPOINTS.agenda.byId('apt-1'), async () => ({
        status: 200,
        data: { success: true, data: detail }
      }))

      const { result } = renderHook(() => useAppointmentDetail('apt-1'), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.id).toBe('apt-1')
    })

    it('does not fetch when id is missing', () => {
      const { result } = renderHook(() => useAppointmentDetail(null), { wrapper: createWrapper() })
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Mutations', () => {
    it('successfully updates appointment status', async () => {
      let statusCalled = false
      simpleServer.use(ENDPOINTS.agenda.status('apt-1'), async () => {
        statusCalled = true
        return { status: 200, data: { success: true, data: {} } }
      })

      const { result } = renderHook(() => useUpdateAppointmentStatus(), { wrapper: createWrapper() })

      result.current.mutate({ id: 'apt-1', status: AppointmentStatus.COMPLETED })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(statusCalled).toBe(true)
    })

    it('successfully reschedules an appointment', async () => {
      let rescheduleCalled = false
      simpleServer.use(ENDPOINTS.agenda.reschedule('apt-1'), async () => {
        rescheduleCalled = true
        return { status: 200, data: { success: true, data: {} } }
      })

      const { result } = renderHook(() => useRescheduleAppointment(), { wrapper: createWrapper() })

      result.current.mutate({ id: 'apt-1', scheduled_at: new Date().toISOString() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(rescheduleCalled).toBe(true)
    })
  })
})
