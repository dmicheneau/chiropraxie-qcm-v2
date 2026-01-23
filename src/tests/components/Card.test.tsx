import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Card from '@/components/ui/Card'

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('renders title when provided as string', () => {
    render(<Card title="Card Title">Content</Card>)
    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card Title')).toHaveClass('card-title')
  })

  it('renders title when provided as ReactNode', () => {
    render(<Card title={<span data-testid="custom-title">Custom Title</span>}>Content</Card>)
    expect(screen.getByTestId('custom-title')).toBeInTheDocument()
  })

  it('renders actions when provided', () => {
    render(
      <Card actions={<button>Action</button>}>
        Content
      </Card>
    )
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Card className="custom-class">Content</Card>)
    const card = screen.getByText('Content').closest('.card')
    expect(card).toHaveClass('custom-class')
  })

  it('applies compact padding when compact prop is true', () => {
    render(<Card compact>Content</Card>)
    const cardBody = screen.getByText('Content').closest('.card-body')
    expect(cardBody).toHaveClass('p-4')
  })

  it('has base card classes', () => {
    render(<Card>Content</Card>)
    const card = screen.getByText('Content').closest('.card')
    expect(card).toHaveClass('bg-base-200', 'shadow-xl')
  })
})
