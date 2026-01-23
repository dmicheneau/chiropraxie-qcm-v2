import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '@/components/ui/Button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-primary')
  })

  it('applies different variants correctly', () => {
    const { rerender } = render(<Button variant="secondary">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-secondary')

    rerender(<Button variant="accent">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-accent')

    rerender(<Button variant="error">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-error')

    rerender(<Button variant="success">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-success')
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-sm')

    rerender(<Button size="lg">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-lg')
  })

  it('applies block class when block prop is true', () => {
    render(<Button block>Full Width</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-block')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when loading prop is true', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button').querySelector('.loading')).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup()
    let clicked = false
    render(<Button onClick={() => { clicked = true }}>Click</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(clicked).toBe(true)
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    let clicked = false
    render(<Button disabled onClick={() => { clicked = true }}>Click</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(clicked).toBe(false)
  })
})
