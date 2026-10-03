import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { IUser, ILoginResponse } from '@/lib/types'

/** Clínica sobre la que está trabajando un superusuario de la plataforma. */
export interface ActingClinic {
  id: string
  name: string
}

interface AuthState {
  user: IUser | null
  /**
   * Solo para el equipo de la plataforma: la clínica en la que ha entrado desde
   * el backoffice. Todas las peticiones viajan con ella (x-act-as-clinic) y el
   * gateway las trata como si fueran de esa clínica.
   */
  actingClinic: ActingClinic | null
  setActingClinic: (clinic: ActingClinic | null) => void
  access_token: string | null
  refresh_token: string | null
  isAuthenticated: boolean
  setSession: (data: ILoginResponse) => void
  clearSession: () => void
  updateTokens: (access_token: string, refresh_token: string) => void
  hasPermission: (permission: string) => boolean
  /**
   * Como hasPermission, pero SIN el atajo de superadmin.
   *
   * Hay opciones que no son un privilegio sino una pertenencia: "Mi jornada"
   * solo tiene sentido para quien atiende pacientes. Con el atajo, un
   * superadmin la veía en el menú y al entrar se encontraba con que su cuenta
   * no es la de un profesional.
   */
  hasRolePermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      isAuthenticated: false,
      actingClinic: null,

      setActingClinic: (clinic) => set({ actingClinic: clinic }),

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
        actingClinic: null,
      }),

      updateTokens: (access_token, refresh_token) => set({
        access_token,
        refresh_token,
      }),

      hasPermission: (permission: string) => {
        const { user } = get()
        if (!user) return false
        
        // El equipo de la plataforma administra cualquier clínica en la que entre.
        if (user.platform_admin) return true

        const [module, action] = permission.split('.')
        if (!module || !action) return false

        // Lo que la plataforma no le habilita a la clínica no lo tiene nadie de
        // ella, tampoco su administrador.
        if (user.clinic_modules?.[module] === false) return false

        // El administrador de la clínica tiene todo lo habilitado.
        if (user.role.is_superadmin) return true

        const permissions = user.role.permissions as unknown as Record<string, Record<string, boolean>>
        return !!permissions[module]?.[action]
      },

      hasRolePermission: (permission: string) => {
        const { user } = get()
        if (!user) return false

        const [module, action] = permission.split('.')
        if (!module || !action) return false

        const permissions = user.role.permissions as unknown as Record<string, Record<string, boolean>>
        return !!permissions[module]?.[action]
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
