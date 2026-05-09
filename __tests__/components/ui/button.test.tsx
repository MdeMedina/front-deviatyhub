import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('UI Atoms — Button', () => {
  it('successfully renders the children content correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('successfully shows the spinner and disables interaction when loading is true', () => {
    const handleClick = jest.fn()
    render(<Button loading onClick={handleClick}>Submit</Button>)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Procesando...')).toBeInTheDocument()
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('successfully applies the correct variant classes (primary check)', () => {
    render(<Button variant="primary">Primary</Button>)
    const button = screen.getByRole('button')
    // Check for core gradient classes as a proxy for the variant
    expect(button.className).toContain('from-indigo-600')
    expect(button.className).toContain('to-purple-600')
  })

  it('does not trigger onClick when disabled is true', () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies fullWidth class when fullWidth prop is provided', () => {
    render(<Button fullWidth>Full Width</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('w-full')
  })
})
