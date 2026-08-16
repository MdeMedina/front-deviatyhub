import { render, screen, waitFor } from '@testing-library/react'
import DashboardLayout from '@/app/(dashboard)/layout'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useRouter } from 'next/navigation'

// Mock the store and router
jest.mock('@/lib/stores/auth.store')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/dashboard')
}))

describe('Security — Route Protection & Redirection', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    })
  })

  it('successfully redirects unauthenticated users to the login page', async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: false
    })

    render(
      <DashboardLayout>
        <div>Protected Content</div>
      </DashboardLayout>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('successfully allows authenticated users to access protected dashboard content', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      hasPermission: jest.fn(() => true)
    })

    render(
      <DashboardLayout>
        <div data-testid="protected-content">Protected Content</div>
      </DashboardLayout>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })
})
