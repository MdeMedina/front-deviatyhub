import React from 'react'
import { render, screen } from '@testing-library/react'
import { Spinner } from '@/components/ui/Spinner'

describe('UI Atoms — Spinner', () => {
  it('successfully renders with rotation animation classes', () => {
    const { container } = render(<Spinner />)
    const spinner = container.firstChild as HTMLElement
    expect(spinner.className).toContain('animate-spin')
  })

  it('successfully includes aria-label for accessibility', () => {
    render(<Spinner label="Verificando..." />)
    expect(screen.getByLabelText('Verificando...')).toBeInTheDocument()
  })

  it('uses default accessibility label when none is provided', () => {
    render(<Spinner />)
    expect(screen.getByLabelText('Cargando...')).toBeInTheDocument()
  })

  it('does not render visible text (only screen-reader text)', () => {
    render(<Spinner label="Loading" />)
    const srOnly = screen.getByText('Loading')
    expect(srOnly.className).toContain('sr-only')
  })

  it('applies the correct size classes', () => {
    const { container } = render(<Spinner size="lg" />)
    const spinner = container.firstChild as HTMLElement
    expect(spinner.className).toContain('w-12')
    expect(spinner.className).toContain('border-4')
  })
})
