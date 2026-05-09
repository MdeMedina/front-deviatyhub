import { render, screen } from '@testing-library/react'
import NotFound from '@/app/not-found'
import ErrorPage from '@/app/error'

describe('Base UI Components', () => {
  // Silence console.error for expected error logging in ErrorPage
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('404 Not Found Page', () => {
    it('successfully renders the 404 status code and clear heading', () => {
      render(<NotFound />)
      expect(screen.getByText('404')).toBeInTheDocument()
      expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument()
    })

    it('successfully renders the return to dashboard link with correct href', () => {
      render(<NotFound />)
      const link = screen.getByRole('link', { name: /Return to Dashboard/i })
      expect(link).toHaveAttribute('href', '/conversations')
    })
  })

  describe('Error Feedback Page', () => {
    const mockReset = jest.fn()
    const mockError = new Error('Test error')

    it('successfully renders the error message to the user', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />)
      expect(screen.getByText(/Something went wrong!/i)).toBeInTheDocument()
    })

    it('successfully triggers the retry logic when clicking the "Try again" button', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />)
      const button = screen.getByRole('button', { name: /Try again/i })
      button.click()
      expect(mockReset).toHaveBeenCalled()
    })
  })
})
