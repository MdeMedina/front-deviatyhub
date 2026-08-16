import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'
import {
  useUsers,
  useRoles,
  useInviteUser,
  useUpdateUser,
  useDeleteUser,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '@/lib/api/hooks/use-users-roles'
import { makeUser, makeRole, makePermissions } from '@/__mocks__/factories'
import { IUser, IRole } from '@/lib/types'

const createWrapper = (queryClientInstance?: QueryClient) => {
  const queryClient = queryClientInstance || new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Users & Roles Module — Hooks useUsers, useRoles y mutaciones CRUD', () => {
  beforeAll(() => simpleServer.listen())
  afterEach(() => simpleServer.resetHandlers())
  afterAll(() => simpleServer.close())

  const mockUsers: IUser[] = [
    makeUser({ email: 'admin@deviaty.com' }),
    makeUser({ email: 'recepcion@deviaty.com' }),
  ]

  const mockRoles: IRole[] = [
    makeRole({ name: 'Administrador', is_superadmin: true }),
    makeRole({ name: 'Recepcionista', is_superadmin: false }),
  ]

  // ==========================================
  // ✅ TEST 1: useUsers — retorna lista correctamente
  // ==========================================
  it('useUsers fetches and returns the full list of users', async () => {
    simpleServer.use(ENDPOINTS.auth.users, async () => ({
      status: 200,
      data: { success: true, data: mockUsers },
    }))

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].email).toBe('admin@deviaty.com')
    expect(result.current.data?.[1].email).toBe('recepcion@deviaty.com')
  })

  // ==========================================
  // ✅ TEST 2: useRoles — retorna lista correctamente
  // ==========================================
  it('useRoles fetches and returns all available roles', async () => {
    simpleServer.use(ENDPOINTS.auth.roles, async () => ({
      status: 200,
      data: { success: true, data: mockRoles },
    }))

    const { result } = renderHook(() => useRoles(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].name).toBe('Administrador')
    expect(result.current.data?.[0].is_superadmin).toBe(true)
    expect(result.current.data?.[1].name).toBe('Recepcionista')
    expect(result.current.data?.[1].is_superadmin).toBe(false)
  })

  // ==========================================
  // ✅ TEST 3: useInviteUser — llama al endpoint con body correcto e invalida caché
  // ==========================================
  it('useInviteUser posts the correct payload and invalidates the users cache', async () => {
    const invitedUser = makeUser({ email: 'nuevo@deviaty.com' })

    simpleServer.use(ENDPOINTS.auth.invite, async () => ({
      status: 201,
      data: { success: true, data: invitedUser },
    }))

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useInviteUser(), {
      wrapper: createWrapper(queryClient),
    })

    const payload = { email: 'nuevo@deviaty.com', roleId: mockRoles[1].id }
    const response = await result.current.mutateAsync(payload)

    // Verifica que el endpoint correcto fue llamado
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/users/invite'),
      expect.any(Object)
    )

    // Verifica que el resultado es el usuario creado
    expect(response.email).toBe('nuevo@deviaty.com')

    // Verifica que la caché de usuarios se invalida
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] })
  })

  // ==========================================
  // ❌ TEST 4: useDeleteRole — rol con usuarios asignados retorna ROLE_HAS_USERS
  // ==========================================
  it('useDeleteRole propagates ROLE_HAS_USERS error when the role still has assigned users', async () => {
    const roleId = 'role-with-users-123'

    simpleServer.use(ENDPOINTS.auth.role(roleId), async () => ({
      status: 409,
      data: {
        success: false,
        error: {
          code: 'ROLE_HAS_USERS',
          message: 'No se puede eliminar un rol que tiene usuarios asignados.',
        },
      },
    }))

    const { result } = renderHook(() => useDeleteRole(), { wrapper: createWrapper() })

    await expect(result.current.mutateAsync(roleId)).rejects.toThrow(ApiError)

    try {
      await result.current.mutateAsync(roleId)
    } catch (err: any) {
      expect(err.code).toBe('ROLE_HAS_USERS')
      expect(err.message).toBe('No se puede eliminar un rol que tiene usuarios asignados.')
    }
  })

  // ==========================================
  // ❌ TEST 5: useInviteUser — email ya existente retorna EMAIL_ALREADY_EXISTS
  // ==========================================
  it('useInviteUser propagates EMAIL_ALREADY_EXISTS when the email is already registered', async () => {
    simpleServer.use(ENDPOINTS.auth.invite, async () => ({
      status: 409,
      data: {
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'El email ya está registrado en el sistema.',
        },
      },
    }))

    const { result } = renderHook(() => useInviteUser(), { wrapper: createWrapper() })

    const payload = { email: 'existing@deviaty.com', roleId: mockRoles[0].id }

    await expect(result.current.mutateAsync(payload)).rejects.toThrow(ApiError)

    try {
      await result.current.mutateAsync(payload)
    } catch (err: any) {
      expect(err.code).toBe('EMAIL_ALREADY_EXISTS')
      expect(err.message).toBe('El email ya está registrado en el sistema.')
    }
  })
})
