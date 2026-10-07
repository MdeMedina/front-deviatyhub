import { useAuthStore } from '@/lib/stores/auth.store'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export class ApiError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

/**
 * La sesión terminó y no se puede renovar: se borra y se vuelve al login con
 * el aviso. Antes, con la renovación rota, la sesión quedaba "abierta" con
 * tokens vacíos y cada pantalla fallaba sin sacar al usuario.
 */
export function cerrarSesionExpirada() {
  useAuthStore.getState().clearSession()
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login?expirada=1'
  }
}

/** Segundos que le quedan a un JWT; null si no se puede leer. */
export function segundosRestantes(token: string | null | undefined): number | null {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp - Date.now() / 1000 : null
  } catch {
    return null
  }
}

export interface ApiClientOptions extends RequestInit {
  params?: Record<string, any>
}

async function fetchWithAuth<T>(url: string, options: ApiClientOptions = {}): Promise<T> {
  const state = useAuthStore.getState()
  const { access_token, refresh_token, updateTokens, clearSession } = state

  const headers: Record<string, string> = {
    ...Object.fromEntries(new Headers(options.headers).entries()),
  }

  if (access_token) {
    headers['Authorization'] = `Bearer ${access_token}`
  }
  // Superusuario trabajando dentro de otra clínica. El gateway solo la acepta
  // si el token es de alguien de la plataforma; a cualquier otro se le ignora.
  if (state.actingClinic && state.user?.platform_admin) {
    headers['x-act-as-clinic'] = state.actingClinic.id
  }
  // Solo se declara JSON cuando hay cuerpo. El gateway (Fastify) rechaza con
  // 400 "Body cannot be empty when content-type is set to 'application/json'"
  // cualquier petición que lo declare y llegue vacía.
  if (!headers['Content-Type'] && options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  // Build query string dynamically from params
  let finalUrl = url
  if (options.params) {
    const query = new URLSearchParams()
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        query.append(key, val.toString())
      }
    })
    const queryString = query.toString()
    if (queryString) {
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString
    }
  }

  const response = await fetch(finalUrl, { ...options, headers })

  // Un 401 con sesión abierta pero sin forma de renovarla: se terminó.
  // (Sin sesión, un 401 es el del propio login con credenciales malas, y ese
  // lo muestra el formulario.)
  if (response.status === 401 && access_token && !refresh_token) {
    cerrarSesionExpirada()
    throw new ApiError('SESSION_EXPIRED', 'Tu sesión expiró')
  }

  // Handle Token Refresh on 401
  if (response.status === 401 && refresh_token) {
    if (!isRefreshing) {
      isRefreshing = true
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token }),
        })

        const refreshData = await refreshRes.json()

        // El servidor devolvía los tokens como accessToken/refreshToken y aquí
        // se leían como access_token/refresh_token: se guardaban vacíos y la
        // sesión quedaba rota. Se aceptan los dos, y sin tokens no hay sesión.
        const nuevos = refreshData?.data || {}
        const newAccess = nuevos.access_token ?? nuevos.accessToken
        const newRefresh = nuevos.refresh_token ?? nuevos.refreshToken
        if (refreshRes.ok && refreshData.success && newAccess && newRefresh) {
          updateTokens(newAccess, newRefresh)
          isRefreshing = false
          onRefreshed(newAccess)
          // Retry original request
          return fetchWithAuth<T>(url, options)
        } else {
          isRefreshing = false
          refreshSubscribers = []
          cerrarSesionExpirada()
          throw new ApiError('SESSION_EXPIRED', 'Tu sesión expiró')
        }
      } catch (error) {
        isRefreshing = false
        refreshSubscribers = []
        cerrarSesionExpirada()
        throw error
      }
    } else {
      // If already refreshing, wait for the new token
      return new Promise((resolve) => {
        subscribeTokenRefresh(() => {
          resolve(fetchWithAuth<T>(url, options))
        })
      })
    }
  }

  // Handle regular responses
  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.message || 'An unexpected error occurred'
    )
  }

  return data.data
}

export const apiClient = {
  get: <T>(url: string, options?: ApiClientOptions) => 
    fetchWithAuth<T>(url, { ...options, method: 'GET' }),
  
  post: <T>(url: string, body?: any, options?: ApiClientOptions) => 
    fetchWithAuth<T>(url, { ...options, method: 'POST', body: JSON.stringify(body ?? {}) }),
  
  put: <T>(url: string, body?: any, options?: ApiClientOptions) => 
    fetchWithAuth<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body ?? {}) }),
  
  patch: <T>(url: string, body?: any, options?: ApiClientOptions) => 
    fetchWithAuth<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  
  delete: <T>(url: string, options?: ApiClientOptions) => 
    fetchWithAuth<T>(url, { ...options, method: 'DELETE' }),
}
