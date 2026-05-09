import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Toast } from '@/components/ui/Toast'
import { IToast } from '@/lib/types'

describe('UI Molecules — Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const mockToast: IToast = {
    id: '1',
    title: 'Success!',
    message: 'Operation completed',
    type: 'success',
    duration: 3000
  }

  it('successfully renders title and message correctly', () => {
    render(<Toast toast={mockToast} onRemove={() => {}} />)
    expect(screen.getByText('Success!')).toBeInTheDocument()
    expect(screen.getByText('Operation completed')).toBeInTheDocument()
  })

  it('calls onRemove automatically after the specified duration', () => {
    const handleRemove = jest.fn()
    render(<Toast toast={mockToast} onRemove={handleRemove} />)
    
    act(() => {
      jest.advanceTimersByTime(3000)
    })
    
    expect(handleRemove).toHaveBeenCalledWith('1')
  })

  it('calls onRemove when the close button is clicked', () => {
    const handleRemove = jest.fn()
    render(<Toast toast={mockToast} onRemove={handleRemove} />)
    
    const closeBtn = screen.getByLabelText('Cerrar notificación')
    fireEvent.click(closeBtn)
    
    expect(handleRemove).toHaveBeenCalledWith('1')
  })

  it('applies correct success styles', () => {
    const { container } = render(<Toast toast={mockToast} onRemove={() => {}} />)
    const toastEl = container.firstChild as HTMLElement
    expect(toastEl.className).toContain('border-emerald-100')
  })
})
