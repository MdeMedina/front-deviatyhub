import { useUIStore } from '@/lib/stores/ui.store'

// Mock crypto.randomUUID for JSDOM if not available
if (typeof crypto === 'undefined' || !crypto.randomUUID) {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => Math.random().toString(36).substring(2, 15)
    }
  })
}

describe('Logic — UI Store (Zustand)', () => {
  beforeEach(() => {
    useUIStore.setState({
      isSidebarOpen: true,
      activeModal: null,
      toasts: []
    })
  })

  it('successfully toggles the sidebar state between open and closed', () => {
    const store = useUIStore.getState()
    expect(store.isSidebarOpen).toBe(true)
    
    store.toggleSidebar()
    expect(useUIStore.getState().isSidebarOpen).toBe(false)
    
    store.toggleSidebar()
    expect(useUIStore.getState().isSidebarOpen).toBe(true)
  })

  it('successfully manages the active modal state', () => {
    const store = useUIStore.getState()
    expect(store.activeModal).toBeNull()
    
    store.openModal('test-modal')
    expect(useUIStore.getState().activeModal).toBe('test-modal')
    
    store.closeModal()
    expect(useUIStore.getState().activeModal).toBeNull()
  })

  it('successfully adds and removes toasts from the stack', () => {
    const store = useUIStore.getState()
    expect(store.toasts).toHaveLength(0)
    
    store.addToast({
      type: 'success',
      title: 'Success!',
      message: 'Action completed'
    })
    
    const updatedToasts = useUIStore.getState().toasts
    expect(updatedToasts).toHaveLength(1)
    expect(updatedToasts[0].title).toBe('Success!')
    expect(updatedToasts[0].id).toBeDefined()
    
    const toastId = updatedToasts[0].id
    useUIStore.getState().removeToast(toastId)
    expect(useUIStore.getState().toasts).toHaveLength(0)
  })

  it('successfully ignores removing a toast with a non-existent ID', () => {
    useUIStore.getState().addToast({
      type: 'info',
      title: 'Info',
    })
    
    expect(useUIStore.getState().toasts).toHaveLength(1)
    useUIStore.getState().removeToast('non-existent-id')
    expect(useUIStore.getState().toasts).toHaveLength(1)
  })
})
