import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuizCard from '@/components/quiz/QuizCard'
import type { Question } from '@/types'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'quiz.question': `Question ${params?.number} sur ${params?.total}`,
        'quiz.selectAnswers': 'Sélectionnez plusieurs réponses',
        'quiz.submit': 'Valider',
        'quiz.next': 'Suivant',
        'quiz.finish': 'Terminer',
        'quiz.explanation': 'Explication',
        'quiz.true': 'Vrai',
        'quiz.false': 'Faux',
      }
      return translations[key] || key
    },
  }),
}))

describe('QuizCard', () => {
  const singleChoiceQuestion: Question = {
    id: 'q1',
    type: 'single_choice',
    text: 'Combien de vertèbres cervicales?',
    choices: [
      { id: 'A', text: '5 vertèbres' },
      { id: 'B', text: '7 vertèbres' },
      { id: 'C', text: '12 vertèbres' },
    ],
    correctAnswer: 'B',
    explanation: 'Il y a 7 vertèbres cervicales.',
    theme: 'Anatomie',
    difficulty: 'easy',
    tags: [],
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const multipleChoiceQuestion: Question = {
    ...singleChoiceQuestion,
    id: 'q2',
    type: 'multiple_choice',
    text: 'Quels sont les signes de subluxation?',
    choices: [
      { id: 'A', text: 'Douleur' },
      { id: 'B', text: 'Restriction' },
      { id: 'C', text: 'Spasme' },
    ],
    correctAnswer: ['A', 'B', 'C'],
  }

  const trueFalseQuestion: Question = {
    ...singleChoiceQuestion,
    id: 'q3',
    type: 'true_false',
    text: 'Les disques sont vascularisés.',
    choices: undefined,
    correctAnswer: 'false',
  }

  const defaultProps = {
    question: singleChoiceQuestion,
    questionNumber: 1,
    totalQuestions: 10,
    selectedAnswer: null,
    showResult: false,
    onSelectAnswer: vi.fn(),
    onSubmit: vi.fn(),
    onNext: vi.fn(),
  }

  it('renders question text', () => {
    render(<QuizCard {...defaultProps} />)
    expect(screen.getByText('Combien de vertèbres cervicales?')).toBeInTheDocument()
  })

  it('renders question progress', () => {
    render(<QuizCard {...defaultProps} />)
    expect(screen.getByText('Question 1 sur 10')).toBeInTheDocument()
  })

  it('renders theme badge', () => {
    render(<QuizCard {...defaultProps} />)
    expect(screen.getByText('Anatomie')).toBeInTheDocument()
  })

  it('renders all choices', () => {
    render(<QuizCard {...defaultProps} />)
    expect(screen.getByText('5 vertèbres')).toBeInTheDocument()
    expect(screen.getByText('7 vertèbres')).toBeInTheDocument()
    expect(screen.getByText('12 vertèbres')).toBeInTheDocument()
  })

  it('renders true/false options for true_false questions', () => {
    render(<QuizCard {...defaultProps} question={trueFalseQuestion} />)
    expect(screen.getByText('Vrai')).toBeInTheDocument()
    expect(screen.getByText('Faux')).toBeInTheDocument()
  })

  it('shows multiple choice instruction for multiple_choice questions', () => {
    render(<QuizCard {...defaultProps} question={multipleChoiceQuestion} />)
    expect(screen.getByText('Sélectionnez plusieurs réponses')).toBeInTheDocument()
  })

  it('calls onSelectAnswer when a choice is clicked', async () => {
    const user = userEvent.setup()
    const onSelectAnswer = vi.fn()
    render(<QuizCard {...defaultProps} onSelectAnswer={onSelectAnswer} />)
    
    await user.click(screen.getByText('7 vertèbres'))
    expect(onSelectAnswer).toHaveBeenCalledWith('B')
  })

  it('shows submit button when not showing result', () => {
    render(<QuizCard {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument()
  })

  it('submit button is disabled when no answer selected', () => {
    render(<QuizCard {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled()
  })

  it('submit button is enabled when answer is selected', () => {
    render(<QuizCard {...defaultProps} selectedAnswer="B" />)
    expect(screen.getByRole('button', { name: 'Valider' })).not.toBeDisabled()
  })

  it('calls onSubmit when submit button is clicked', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<QuizCard {...defaultProps} selectedAnswer="B" onSubmit={onSubmit} />)
    
    await user.click(screen.getByRole('button', { name: 'Valider' }))
    expect(onSubmit).toHaveBeenCalled()
  })

  it('shows next button when showing result', () => {
    render(<QuizCard {...defaultProps} showResult={true} selectedAnswer="B" />)
    expect(screen.getByRole('button', { name: /Suivant/i })).toBeInTheDocument()
  })

  it('shows finish button on last question when showing result', () => {
    render(
      <QuizCard
        {...defaultProps}
        questionNumber={10}
        showResult={true}
        selectedAnswer="B"
      />
    )
    expect(screen.getByRole('button', { name: /Terminer/i })).toBeInTheDocument()
  })

  it('calls onNext when next button is clicked', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(<QuizCard {...defaultProps} showResult={true} selectedAnswer="B" onNext={onNext} />)
    
    await user.click(screen.getByRole('button', { name: /Suivant/i }))
    expect(onNext).toHaveBeenCalled()
  })

  it('shows explanation when showing result and explanation exists', () => {
    render(<QuizCard {...defaultProps} showResult={true} selectedAnswer="B" />)
    expect(screen.getByText('Explication')).toBeInTheDocument()
    expect(screen.getByText('Il y a 7 vertèbres cervicales.')).toBeInTheDocument()
  })

  it('does not show explanation when not showing result', () => {
    render(<QuizCard {...defaultProps} selectedAnswer="B" />)
    expect(screen.queryByText('Explication')).not.toBeInTheDocument()
  })

  it('toggles multiple choice answers correctly', async () => {
    const user = userEvent.setup()
    const onSelectAnswer = vi.fn()
    
    // Start with one answer selected
    const { rerender } = render(
      <QuizCard
        {...defaultProps}
        question={multipleChoiceQuestion}
        selectedAnswer={['A']}
        onSelectAnswer={onSelectAnswer}
      />
    )
    
    // Click to add another answer
    await user.click(screen.getByText('Restriction'))
    expect(onSelectAnswer).toHaveBeenCalledWith('A,B')
    
    // Rerender with both selected
    rerender(
      <QuizCard
        {...defaultProps}
        question={multipleChoiceQuestion}
        selectedAnswer={['A', 'B']}
        onSelectAnswer={onSelectAnswer}
      />
    )
    
    // Click to remove an answer
    await user.click(screen.getByText('Douleur'))
    expect(onSelectAnswer).toHaveBeenCalledWith('B')
  })
})
