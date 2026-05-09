'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import type { ILoginResponse, ILoginCredentials } from '@/lib/types'

export const useLogin = () => {
  const { setSession } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: (credentials: ILoginCredentials) =>
      apiClient.post<ILoginResponse>(ENDPOINTS.auth.login, credentials),
    
    onSuccess: (data) => {
      setSession(data)
      // Redirect to dashboard or conversations as default
      router.push('/dashboard')
    },
  })
}
