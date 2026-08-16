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
  if (!headers['Content-Type']) {
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

        if (refreshRes.ok && refreshData.success) {
          const { access_token: newAccess, refresh_token: newRefresh } = refreshData.data
          updateTokens(newAccess, newRefresh)
          isRefreshing = false
          onRefreshed(newAccess)
          // Retry original request
          return fetchWithAuth<T>(url, options)
        } else {
          isRefreshing = false
          clearSession()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          throw new ApiError('AUTH_FAILED', 'Session expired')
        }
      } catch (error) {
        isRefreshing = false
        clearSession()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
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
    fetchWithAuth<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  
  put: <T>(url: string, body?: any, options?: ApiClientOptions) => 
    fetchWithAuth<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  
  patch: <T>(url: string, body?: any, options?: ApiClientOptions) => 
    fetchWithAuth<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  
  delete: <T>(url: string, options?: ApiClientOptions) => 
    fetchWithAuth<T>(url, { ...options, method: 'DELETE' }),
}
