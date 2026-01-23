import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProgressBar from '@/components/ui/ProgressBar'

describe('ProgressBar', () => {
  it('renders a progress element', () => {
    render(<ProgressBar value={50} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('sets correct value and max', () => {
    render(<ProgressBar value={75} max={100} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('value', '75')
    expect(progress).toHaveAttribute('max', '100')
  })

  it('uses default max of 100', () => {
    render(<ProgressBar value={50} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('max', '100')
  })

  it('shows label when showLabel is true', () => {
    render(<ProgressBar value={75} showLabel />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('does not show label by default', () => {
    render(<ProgressBar value={75} />)
    expect(screen.queryByText('75%')).not.toBeInTheDocument()
  })

  it('applies primary variant by default', () => {
    render(<ProgressBar value={50} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveClass('progress-primary')
  })

  it('applies different variants correctly', () => {
    const { rerender } = render(<ProgressBar value={50} variant="secondary" />)
    expect(screen.getByRole('progressbar')).toHaveClass('progress-secondary')

    rerender(<ProgressBar value={50} variant="success" />)
    expect(screen.getByRole('progressbar')).toHaveClass('progress-success')

    rerender(<ProgressBar value={50} variant="warning" />)
    expect(screen.getByRole('progressbar')).toHaveClass('progress-warning')

    rerender(<ProgressBar value={50} variant="error" />)
    expect(screen.getByRole('progressbar')).toHaveClass('progress-error')
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(<ProgressBar value={50} size="xs" />)
    expect(screen.getByRole('progressbar')).toHaveClass('h-1')

    rerender(<ProgressBar value={50} size="sm" />)
    expect(screen.getByRole('progressbar')).toHaveClass('h-2')

    rerender(<ProgressBar value={50} size="lg" />)
    expect(screen.getByRole('progressbar')).toHaveClass('h-4')
  })

  it('calculates percentage correctly with custom max', () => {
    render(<ProgressBar value={50} max={200} showLabel />)
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('clamps percentage to 0-100 range', () => {
    const { rerender } = render(<ProgressBar value={150} showLabel />)
    expect(screen.getByText('100%')).toBeInTheDocument()

    rerender(<ProgressBar value={-50} showLabel />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<ProgressBar value={50} className="custom-class" />)
    const wrapper = screen.getByRole('progressbar').parentElement
    expect(wrapper).toHaveClass('custom-class')
  })
})
