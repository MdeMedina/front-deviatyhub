import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '@/components/ui/Modal'

describe('UI Molecules — Modal', () => {
  it('successfully renders nothing when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        Content
      </Modal>
    )
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('successfully renders title and content when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Welcome">
        Modal Content
      </Modal>
    )
    expect(screen.getByText('Welcome')).toBeInTheDocument()
    expect(screen.getByText('Modal Content')).toBeInTheDocument()
  })

  it('calls onClose when clicking the close button', () => {
    const handleClose = jest.fn()
    render(
      <Modal isOpen={true} onClose={handleClose} title="Title">
        Content
      </Modal>
    )
    
    const closeBtn = screen.getByLabelText('Cerrar modal')
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalled()
  })

  it('renders footer content when provided', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        title="Title" 
        footer={<button>Action</button>}
      >
        Content
      </Modal>
    )
    expect(screen.getByText('Action')).toBeInTheDocument()
  })
})
