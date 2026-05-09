import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { IUser, ILoginResponse } from '@/lib/types'

interface AuthState {
  user: IUser | null
  access_token: string | null
  refresh_token: string | null
  isAuthenticated: boolean
  setSession: (data: ILoginResponse) => void
  clearSession: () => void
  updateTokens: (access_token: string, refresh_token: string) => void
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      isAuthenticated: false,

      setSession: (data) => set({
        user: data.user,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        isAuthenticated: true,
      }),

      clearSession: () => set({
        user: null,
        access_token: null,
        refresh_token: null,
        isAuthenticated: false,
      }),

      updateTokens: (access_token, refresh_token) => set({
        access_token,
        refresh_token,
      }),

      hasPermission: (permission: string) => {
        const { user } = get()
        if (!user) return false
        
        // Superadmins bypass all permission checks
        if (user.role.is_superadmin) return true

        const [module, action] = permission.split('.')
        if (!module || !action) return false

        const permissions = user.role.permissions as Record<string, Record<string, boolean>>
        return !!permissions[module]?.[action]
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
