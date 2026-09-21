'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import type { ILoginResponse, ILoginCredentials, ISetPasswordCredentials } from '@/lib/types'

export const useLogin = () => {
  const { setSession } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: (credentials: ILoginCredentials) =>
      apiClient.post<ILoginResponse>(ENDPOINTS.auth.login, credentials),
    
    onSuccess: (data) => {
      setSession(data)
      // Un profesional no ve el dashboard (son datos de negocio, no suyos), así
      // que mandarle ahí sería dejarle en una página vacía nada más entrar.
      const permisos = (data as any)?.user?.role?.permissions
      const esProfesional = !(data as any)?.user?.role?.is_superadmin
        && !!permisos?.own_schedule?.view
      router.push(esProfesional ? '/my-schedule' : '/dashboard')
    },
  })
}

export const useSetPassword = () => {
  return useMutation({
    mutationFn: (credentials: ISetPasswordCredentials) =>
      apiClient.post(ENDPOINTS.auth.setPassword, credentials),
  })
}

