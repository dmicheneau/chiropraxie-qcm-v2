import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChoiceButton from '@/components/quiz/ChoiceButton'

describe('ChoiceButton', () => {
  const defaultProps = {
    id: 'A',
    text: 'Option A',
    selected: false,
    disabled: false,
    showResult: false,
    isCorrect: false,
    isUserAnswer: false,
    onClick: vi.fn(),
  }

  it('renders id and text correctly', () => {
    render(<ChoiceButton {...defaultProps} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('Option A')).toBeInTheDocument()
  })

  it('applies outline style when not selected', () => {
    render(<ChoiceButton {...defaultProps} />)
    expect(screen.getByRole('button')).toHaveClass('btn-outline')
  })

  it('applies primary style when selected', () => {
    render(<ChoiceButton {...defaultProps} selected={true} />)
    expect(screen.getByRole('button')).toHaveClass('btn-primary')
  })

  it('applies success style for correct answer when showing result', () => {
    render(<ChoiceButton {...defaultProps} showResult={true} isCorrect={true} />)
    expect(screen.getByRole('button')).toHaveClass('btn-success')
  })

  it('applies error style for incorrect user answer when showing result', () => {
    render(
      <ChoiceButton
        {...defaultProps}
        showResult={true}
        isCorrect={false}
        isUserAnswer={true}
      />
    )
    expect(screen.getByRole('button')).toHaveClass('btn-error')
  })

  it('shows checkmark for correct answer when showing result', () => {
    render(<ChoiceButton {...defaultProps} showResult={true} isCorrect={true} />)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('shows X for incorrect user answer when showing result', () => {
    render(
      <ChoiceButton
        {...defaultProps}
        showResult={true}
        isCorrect={false}
        isUserAnswer={true}
      />
    )
    expect(screen.getByText('✗')).toBeInTheDocument()
  })

  it('shows id when not showing result', () => {
    render(<ChoiceButton {...defaultProps} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.queryByText('✓')).not.toBeInTheDocument()
    expect(screen.queryByText('✗')).not.toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<ChoiceButton {...defaultProps} onClick={onClick} />)
    
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<ChoiceButton {...defaultProps} disabled={true} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when showResult is true', () => {
    render(<ChoiceButton {...defaultProps} showResult={true} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies ghost style with opacity for non-answer choices when showing result', () => {
    render(
      <ChoiceButton
        {...defaultProps}
        showResult={true}
        isCorrect={false}
        isUserAnswer={false}
      />
    )
    expect(screen.getByRole('button')).toHaveClass('btn-ghost', 'opacity-50')
  })
})
