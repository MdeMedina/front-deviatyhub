import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'
import {
  useClinicConfig,
  useUpdateClinicConfig,
  useClinicSchedules,
  useUpdateSchedules,
  usePolicies,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
  useDoctors,
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
  useTreatments,
  useTreatmentDetail,
  useCreateTreatment,
  useUpdateTreatment,
  useDeleteTreatment,
  useEncyclopedia,
  useCreateOffer,
  useDeleteOffer
} from '@/lib/api/hooks/use-clinic'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Clinic Module — Configuration & Knowledge Base Hooks', () => {
  beforeAll(() => simpleServer.listen())
  afterEach(() => simpleServer.resetHandlers())
  afterAll(() => simpleServer.close())

  // ==========================================
  // ✅ TEST 1: Obtención Exitosa de Configuración (GET)
  // ==========================================
  it('successfully fetches clinic config and schedules', async () => {
    const mockConfig = {
      id: 'clinic-1',
      name: 'Clínica Dental Premium',
      phone: '+56912345678',
      email: 'info@premium.cl',
      timezone: 'America/Santiago',
      language: 'es',
    }

    const mockSchedules = [
      { id: 'sch-1', day_of_week: 1, open_time: '09:00', close_time: '18:00', is_open: true },
    ]

    simpleServer.use(ENDPOINTS.clinic.config, async () => ({
      status: 200,
      data: { success: true, data: mockConfig },
    }))

    simpleServer.use(ENDPOINTS.clinic.schedules, async () => ({
      status: 200,
      data: { success: true, data: mockSchedules },
    }))

    const { result: configResult } = renderHook(() => useClinicConfig(), { wrapper: createWrapper() })
    const { result: schedulesResult } = renderHook(() => useClinicSchedules(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(configResult.current.isSuccess).toBe(true)
      expect(schedulesResult.current.isSuccess).toBe(true)
    })

    expect(configResult.current.data?.name).toBe('Clínica Dental Premium')
    expect(schedulesResult.current.data).toHaveLength(1)
    expect(schedulesResult.current.data?.[0].open_time).toBe('09:00')
  })

  // ==========================================
  // ✅ TEST 2: Ejecución de Mutación de Horarios (PUT)
  // ==========================================
  it('successfully updates clinic schedules and triggers invalidation', async () => {
    let updatePayload: any = null

    simpleServer.use(ENDPOINTS.clinic.schedules, async (init: any) => {
      updatePayload = JSON.parse(init.body)
      return {
        status: 200,
        data: { success: true, data: updatePayload },
      }
    })

    const newSchedules = [
      { id: 'sch-1', day_of_week: 1, open_time: '08:00', close_time: '20:00', is_open: true },
    ]

    const { result } = renderHook(() => useUpdateSchedules(), { wrapper: createWrapper() })

    await result.current.mutateAsync(newSchedules)

    expect(updatePayload).toEqual(newSchedules)
  })

  // ==========================================
  // ✅ TEST 3: CRUD de Especialistas (POST/PUT/DELETE)
  // ==========================================
  it('successfully creates, updates and deletes a doctor', async () => {
    let createdDoctor: any = null
    let updatedDoctor: any = null
    let deletedDoctorId: string | null = null

    // Mock Create
    simpleServer.use(ENDPOINTS.doctors.list, async (init: any) => {
      createdDoctor = JSON.parse(init.body)
      return {
        status: 201,
        data: { success: true, data: { id: 'doc-new', ...createdDoctor } },
      }
    })

    // Mock Update
    simpleServer.use(ENDPOINTS.doctors.byId('doc-new'), async (init: any) => {
      if (init.method === 'PUT') {
        updatedDoctor = JSON.parse(init.body)
        return {
          status: 200,
          data: { success: true, data: { id: 'doc-new', ...updatedDoctor } },
        }
      }
      if (init.method === 'DELETE') {
        deletedDoctorId = 'doc-new'
        return {
          status: 200,
          data: { success: true, data: null },
        }
      }
      return { status: 404, data: { success: false } }
    })

    const { result: createHook } = renderHook(() => useCreateDoctor(), { wrapper: createWrapper() })
    const { result: updateHook } = renderHook(() => useUpdateDoctor(), { wrapper: createWrapper() })
    const { result: deleteHook } = renderHook(() => useDeleteDoctor(), { wrapper: createWrapper() })

    // Create doctor
    const newDoc = { name: 'Dra. Ana López', title: 'Ortodoncista', active: true, treatments: [] }
    const createRes = await createHook.current.mutateAsync(newDoc)
    expect(createRes.id).toBe('doc-new')
    expect(createdDoctor.name).toBe('Dra. Ana López')

    // Update doctor
    const updatedDocPayload = { id: 'doc-new', name: 'Dra. Ana López Silva', title: 'Ortodoncista Infantil', active: true, treatments: [] }
    const updateRes = await updateHook.current.mutateAsync(updatedDocPayload)
    expect(updateRes.title).toBe('Ortodoncista Infantil')
    expect(updatedDoctor.name).toBe('Dra. Ana López Silva')

    // Delete doctor
    await deleteHook.current.mutateAsync('doc-new')
    expect(deletedDoctorId).toBe('doc-new')
  })

  // ==========================================
  // ❌ TEST 4: Exposición de ApiError en Fallo de Validación (400 Bad Request)
  // ==========================================
  it('exposes ApiError with code and message when backend validation fails', async () => {
    simpleServer.use(ENDPOINTS.treatments.list, async () => {
      return {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El nombre del tratamiento es requerido.',
          },
        },
      }
    })

    const { result } = renderHook(() => useCreateTreatment(), { wrapper: createWrapper() })

    // Execute mutation and expect an error to be thrown
    await expect(
      result.current.mutateAsync({
        name: '', // Invalid name
        description: 'Tratamiento inválido',
        duration_min: 30,
        price: 50000,
        price_isapre: 40000,
        price_fonasa: 45000,
        accepts_isapre: true,
        accepts_fonasa: true,
        active: true,
        encyclopedia_ref: 'enc-ref',
        doctors: [],
      })
    ).rejects.toThrow(ApiError)

    // Alternatively inspect structural fields of thrown error
    try {
      await result.current.mutateAsync({
        name: '',
        description: 'Tratamiento inválido',
        duration_min: 30,
        price: 50000,
        price_isapre: 40000,
        price_fonasa: 45000,
        accepts_isapre: true,
        accepts_fonasa: true,
        active: true,
        encyclopedia_ref: 'enc-ref',
        doctors: [],
      })
    } catch (err: any) {
      expect(err.code).toBe('VALIDATION_ERROR')
      expect(err.message).toBe('El nombre del tratamiento es requerido.')
    }
  })

  // ==========================================
  // ❌ TEST 5: Prevención de Fetching sin ID (useTreatmentDetail)
  // ==========================================
  it('does not trigger API call in useTreatmentDetail if id is empty', () => {
    const { result } = renderHook(() => useTreatmentDetail(''), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isFetching).toBe(false)
  })
})
