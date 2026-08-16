import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { IUser, IRole, IPermissions } from '@/lib/types'

// ==========================================
// Tipos de payload para mutaciones
// ==========================================

export interface IInviteUserPayload {
  email: string
  roleId: string
}

export interface IUpdateUserPayload {
  id: string
  active?: boolean
  roleId?: string
  password?: string
}

export interface ICreateRolePayload {
  name: string
  permissions: IPermissions
}

export interface IUpdateRolePayload {
  id: string
  name?: string
  permissions?: Partial<IPermissions>
}

// ==========================================
// 1. USUARIOS
// ==========================================

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get<IUser[]>(ENDPOINTS.auth.users),
  })
}

export const useInviteUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: IInviteUserPayload) =>
      apiClient.post<IUser>(ENDPOINTS.auth.invite, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: IUpdateUserPayload) =>
      apiClient.patch<IUser>(ENDPOINTS.auth.user(id), body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(ENDPOINTS.auth.user(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// ==========================================
// 2. ROLES
// ==========================================

export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => apiClient.get<IRole[]>(ENDPOINTS.auth.roles),
  })
}

export const useCreateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ICreateRolePayload) =>
      apiClient.post<IRole>(ENDPOINTS.auth.roles, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

export const useUpdateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: IUpdateRolePayload) =>
      apiClient.patch<IRole>(ENDPOINTS.auth.role(id), body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

export const useDeleteRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(ENDPOINTS.auth.role(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}
