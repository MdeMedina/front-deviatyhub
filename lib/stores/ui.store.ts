import { create } from 'zustand'

export interface IToast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface UIState {
  isSidebarOpen: boolean
  activeModal: string | null
  toasts: IToast[]
  
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

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  activeModal: null,
  toasts: [],

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
