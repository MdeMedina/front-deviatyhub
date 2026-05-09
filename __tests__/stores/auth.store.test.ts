import { useAuthStore } from '@/lib/stores/auth.store'
import { IUser } from '@/lib/types'

describe('Logic — Auth Store (Zustand)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  const mockUser: IUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: {
      id: 'role-1',
      name: 'User',
      is_superadmin: false,
      permissions: {
        conversations: { view: true, send: true },
        agenda: { view: true, create: false }
      }
    },
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }

  it('successfully updates the state when setSession is called with valid data', () => {
    useAuthStore.getState().setSession({
      user: mockUser,
      access_token: 'access-123',
      refresh_token: 'refresh-456'
    })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(mockUser)
    expect(state.access_token).toBe('access-123')
  })

  it('successfully clears the session and resets the state to defaults', () => {
    useAuthStore.getState().setSession({
      user: mockUser,
      access_token: 'access-123',
      refresh_token: 'refresh-456'
    })

    useAuthStore.getState().clearSession()
    const state = useAuthStore.getState()
    
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.access_token).toBeNull()
  })

  it('successfully grants access to superadmins regardless of specific module permissions', () => {
    const superUser: IUser = {
      ...mockUser,
      role: { ...mockUser.role, is_superadmin: true, permissions: {} }
    }
    
    useAuthStore.getState().setSession({
      user: superUser,
      access_token: 'at',
      refresh_token: 'rt'
    })

    expect(useAuthStore.getState().hasPermission('any.thing')).toBe(true)
    expect(useAuthStore.getState().hasPermission('random.action')).toBe(true)
  })

  it('successfully validates specific module.action permissions for regular users', () => {
    useAuthStore.getState().setSession({
      user: mockUser,
      access_token: 'at',
      refresh_token: 'rt'
    })

    expect(useAuthStore.getState().hasPermission('conversations.view')).toBe(true)
    expect(useAuthStore.getState().hasPermission('conversations.send')).toBe(true)
    expect(useAuthStore.getState().hasPermission('agenda.view')).toBe(true)
    expect(useAuthStore.getState().hasPermission('agenda.create')).toBe(false)
  })

  it('successfully denies access when the user is not authenticated', () => {
    expect(useAuthStore.getState().hasPermission('conversations.view')).toBe(false)
  })
})
