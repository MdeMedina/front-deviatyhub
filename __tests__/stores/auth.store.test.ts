import { useAuthStore } from '@/lib/stores/auth.store'
import { IUser } from '@/lib/types'

describe('Logic — Auth Store (Zustand)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  const mockUser: IUser = {
    id: '1',
    email: 'test@example.com',
    clinic_id: 'clinic-1',
    active: true,
    role: {
      id: 'role-1',
      name: 'User',
      is_superadmin: false,
      permissions: {
        knowledge_base: { view: true, edit: true },
        agent_actions: { view: true, edit: true },
        simulator: { view: true },
        metrics: { view: true },
        integrations: { view: true },
        security: { view: true },
        users: { view: true, edit: true, create: true, delete: true },
        clinic_config: { view: true, edit: true },
        conversations: { view: true, takeover: true },
        agenda: { view: true, edit: true }
      }
    }
  }

  it('successfully updates the state when setSession is called with valid data', () => {
    useAuthStore.getState().setSession({
      user: mockUser,
      access_token: 'access-123',
      refresh_token: 'refresh-456',
      expires_in: 3600
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
      refresh_token: 'refresh-456',
      expires_in: 3600
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
      role: { ...mockUser.role, is_superadmin: true, permissions: {} as any }
    }
    
    useAuthStore.getState().setSession({
      user: superUser,
      access_token: 'at',
      refresh_token: 'rt',
      expires_in: 3600
    })

    expect(useAuthStore.getState().hasPermission('any.thing')).toBe(true)
    expect(useAuthStore.getState().hasPermission('random.action')).toBe(true)
  })

  it('successfully validates specific module.action permissions for regular users', () => {
    const customUser: IUser = {
      ...mockUser,
      role: {
        ...mockUser.role,
        permissions: {
          ...mockUser.role.permissions,
          conversations: { view: true, takeover: false },
          agenda: { view: true, edit: false }
        }
      }
    }

    useAuthStore.getState().setSession({
      user: customUser,
      access_token: 'at',
      refresh_token: 'rt',
      expires_in: 3600
    })

    expect(useAuthStore.getState().hasPermission('conversations.view')).toBe(true)
    expect(useAuthStore.getState().hasPermission('conversations.takeover')).toBe(false)
    expect(useAuthStore.getState().hasPermission('agenda.view')).toBe(true)
    expect(useAuthStore.getState().hasPermission('agenda.edit')).toBe(false)
  })

  it('successfully denies access when the user is not authenticated', () => {
    expect(useAuthStore.getState().hasPermission('conversations.view')).toBe(false)
  })
})
