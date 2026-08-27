import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/Input'

describe('UI Atoms — Input', () => {
  it('successfully calls onChange with the correct value when typing', () => {
    const handleChange = jest.fn()
    render(<Input value="" onChange={handleChange} placeholder="Test input" />)
    
    const input = screen.getByPlaceholderText('Test input')
    fireEvent.change(input, { target: { value: 'Hello' } })
    
    expect(handleChange).toHaveBeenCalledWith('Hello')
  })

  it('successfully displays the error message in red when the error prop is provided', () => {
    render(<Input value="" onChange={() => {}} error="Required field" />)
    
    const errorMsg = screen.getByText('Required field')
    expect(errorMsg).toBeInTheDocument()
    expect(errorMsg.className).toContain('text-[var(--neg)]')
  })

  it('successfully renders icons when provided', () => {
    render(
      <Input 
        value="" 
        onChange={() => {}} 
        leftIcon={<span data-testid="left-icon">L</span>}
        rightIcon={<span data-testid="right-icon">R</span>}
      />
    )
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
  })

  it('is visually disabled when the disabled prop is true', () => {
    render(<Input value="Fixed" onChange={() => {}} disabled />)
    const input = screen.getByDisplayValue('Fixed')
    expect(input).toBeDisabled()
    expect(input.className).toContain('disabled:bg-[var(--surface)]')
  })

  it('renders a label and associates it with the input', () => {
    render(<Input label="Username" value="" onChange={() => {}} />)
    const label = screen.getByText('Username')
    const input = screen.getByLabelText('Username')
    
    expect(label).toBeInTheDocument()
    expect(input).toBeInTheDocument()
  })
})
