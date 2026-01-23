import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from '@/components/ui/StatCard'

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Questions" value={42} />)
    expect(screen.getByText('Questions')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders string value correctly', () => {
    render(<StatCard title="Score" value="85%" />)
    expect(screen.getByText('85%')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<StatCard title="Streak" value={7} description="Record: 14 jours" />)
    expect(screen.getByText('Record: 14 jours')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(<StatCard title="Test" value={1} icon={<span data-testid="icon">Icon</span>} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('applies primary variant by default', () => {
    render(<StatCard title="Test" value={1} />)
    const value = screen.getByText('1')
    expect(value).toHaveClass('text-primary')
  })

  it('applies different variants correctly', () => {
    const { rerender } = render(<StatCard title="Test" value={1} variant="secondary" />)
    expect(screen.getByText('1')).toHaveClass('text-secondary')

    rerender(<StatCard title="Test" value={1} variant="accent" />)
    expect(screen.getByText('1')).toHaveClass('text-accent')

    rerender(<StatCard title="Test" value={1} variant="success" />)
    expect(screen.getByText('1')).toHaveClass('text-success')

    rerender(<StatCard title="Test" value={1} variant="warning" />)
    expect(screen.getByText('1')).toHaveClass('text-warning')

    rerender(<StatCard title="Test" value={1} variant="error" />)
    expect(screen.getByText('1')).toHaveClass('text-error')
  })

  it('has stat base classes', () => {
    render(<StatCard title="Test" value={1} />)
    const stat = screen.getByText('Test').closest('.stat')
    expect(stat).toHaveClass('bg-base-200', 'rounded-lg')
  })
})
