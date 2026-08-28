import { create } from 'zustand'

export interface IToast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export type Theme = 'light' | 'dark'

interface UIState {
  isSidebarOpen: boolean
  activeModal: string | null
  toasts: IToast[]
  theme: Theme
  
  // Theme actions
  setTheme: (theme: Theme) => void
  toggleTheme: () => void

  // Sidebar actions
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  
  // Modal actions
  openModal: (id: string) => void
  closeModal: () => void
  
  // Toast actions
  addToast: (toast: Omit<IToast, 'id'>) => void
  removeToast: (id: string) => void
}

const applyTheme = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  activeModal: null,
  toasts: [],
  theme: 'light',

  setTheme: (theme: Theme) => {
    applyTheme(theme)
    set({ theme })
  },

  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light'
    applyTheme(nextTheme)
    return { theme: nextTheme }
  }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  openModal: (id) => set({ activeModal: id }),
  
  closeModal: () => set({ activeModal: null }),

  addToast: (toast) => set((state) => {
    const id = crypto.randomUUID()
    return {
      toasts: [...state.toasts, { ...toast, id }]
    }
  }),

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
}))
