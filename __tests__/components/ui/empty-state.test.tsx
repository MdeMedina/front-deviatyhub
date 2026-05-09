import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Inbox } from 'lucide-react'

describe('UI Molecules — EmptyState', () => {
  it('successfully renders title and description correctly', () => {
    render(
      <EmptyState 
        title="No conversations" 
        description="Start a new chat to see it here" 
      />
    )
    expect(screen.getByText('No conversations')).toBeInTheDocument()
    expect(screen.getByText('Start a new chat to see it here')).toBeInTheDocument()
  })

  it('successfully renders the action button when the action prop is provided', () => {
    const handleAction = jest.fn()
    render(
      <EmptyState 
        title="Empty" 
        action={{ label: 'Create New', onClick: handleAction }} 
      />
    )
    const btn = screen.getByText('Create New')
    expect(btn).toBeInTheDocument()
    
    fireEvent.click(btn)
    expect(handleAction).toHaveBeenCalled()
  })

  it('successfully renders the icon when provided', () => {
    render(
      <EmptyState 
        title="Empty" 
        icon={<Inbox data-testid="empty-icon" />} 
      />
    )
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument()
  })

  it('does not render the button when the action prop is missing', () => {
    render(<EmptyState title="Only title" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
