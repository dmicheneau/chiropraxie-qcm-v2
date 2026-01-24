import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from '@/components/ui/Modal'

// Mock HTMLDialogElement methods
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

describe('Modal', () => {
  it('renders children when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        Modal content
      </Modal>
    )
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Modal Title">
        Content
      </Modal>
    )
    expect(screen.getByText('Modal Title')).toBeInTheDocument()
  })

  it('renders actions when provided', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} actions={<button>Save</button>}>
        Content
      </Modal>
    )
    // Dialog hides content from accessibility tree when closed, use hidden: true
    expect(screen.getByRole('button', { name: 'Save', hidden: true })).toBeInTheDocument()
  })

  it('calls showModal when isOpen becomes true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        Content
      </Modal>
    )
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled()
  })

  it('calls close when isOpen becomes false', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}}>
        Content
      </Modal>
    )
    
    rerender(
      <Modal isOpen={false} onClose={() => {}}>
        Content
      </Modal>
    )
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    
    render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>
    )
    
    await user.click(screen.getByRole('button', { name: 'Fermer la fenêtre', hidden: true }))
    expect(onClose).toHaveBeenCalled()
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} size="sm">
        Content
      </Modal>
    )
    expect(screen.getByText('Content').closest('.modal-box')).toHaveClass('max-w-sm')

    rerender(
      <Modal isOpen={true} onClose={() => {}} size="lg">
        Content
      </Modal>
    )
    expect(screen.getByText('Content').closest('.modal-box')).toHaveClass('max-w-lg')
  })

  it('uses medium size by default', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        Content
      </Modal>
    )
    expect(screen.getByText('Content').closest('.modal-box')).toHaveClass('max-w-md')
  })
})
