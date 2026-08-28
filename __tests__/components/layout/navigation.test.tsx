import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'
import { usePathname, useRouter } from 'next/navigation'

// Mocks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}))

describe('Layout Components — Navigation & Header', () => {
  const mockRouter = { push: jest.fn() }
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Sidebar', () => {
    it('only renders items allowed by user permissions', () => {
      // User with only conversations permission
      useAuthStore.setState({
        user: { 
          email: 'test@deviaty.com', 
          role: { 
            name: 'Agent', 
            permissions: { conversations: { view: true } } 
          } 
        } as any,
        isAuthenticated: true
      })

      render(<Sidebar />)
      
      expect(screen.getByText('Conversaciones')).toBeInTheDocument()
      expect(screen.queryByText('Agenda')).not.toBeInTheDocument()
      expect(screen.queryByText('Configuración')).not.toBeInTheDocument()
    })

    it('highlights the active item based on pathname', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/agenda')
      useAuthStore.setState({
        user: { 
          email: 'admin@deviaty.com', 
          role: { name: 'Admin', is_superadmin: true, permissions: {} } 
        } as any,
        isAuthenticated: true
      })

      render(<Sidebar />)
      const agendaLink = screen.getByText('Agenda').closest('a')
      expect(agendaLink?.className).toContain('bg-[var(--blue-tint)]')
    })
  })

  describe('Header', () => {
    it('displays the user email prefix and role', () => {
      useAuthStore.setState({
        user: { 
          email: 'miguel@deviaty.com', 
          role: { name: 'Lead' } 
        } as any,
        isAuthenticated: true
      })

      render(<Header />)
      expect(screen.getByText('miguel')).toBeInTheDocument()
      expect(screen.getByText('Lead')).toBeInTheDocument()
    })

    it('triggers logout and redirection', () => {
      const clearSessionSpy = jest.spyOn(useAuthStore.getState(), 'clearSession')
      render(<Header />)
      
      const logoutBtn = screen.getByTitle('Cerrar Sesión')
      fireEvent.click(logoutBtn)
      
      expect(clearSessionSpy).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/login')
    })
  })
})
