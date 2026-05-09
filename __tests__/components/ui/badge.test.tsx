import React from 'react'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'

describe('UI Atoms — Badge', () => {
  it('successfully renders the label text correctly', () => {
    render(<Badge label="Active" variant="success" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('successfully applies the correct variant classes (success check)', () => {
    const { container } = render(<Badge label="Success" variant="success" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-emerald-50')
    expect(badge.className).toContain('text-emerald-700')
  })

  it('renders the dot indicator when the dot prop is true', () => {
    const { container } = render(<Badge label="Warning" variant="warning" dot />)
    const dot = container.querySelector('.rounded-full.bg-amber-500')
    expect(dot).toBeInTheDocument()
  })

  it('applies smaller size classes when size is sm', () => {
    const { container } = render(<Badge label="Small" variant="info" size="sm" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('text-[10px]')
  })
})
