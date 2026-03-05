import { useTranslation } from 'react-i18next'
import type { Question } from '@/types'
import ChoiceButton from './ChoiceButton'
import { Button, Card, ProgressBar } from '@/components/ui'
import { ChevronRight, Info } from 'lucide-react'

interface QuizCardProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  selectedAnswer: string | string[] | null
  showResult: boolean
  onSelectAnswer: (answerId: string) => void
  onSubmit: () => void
  onNext: () => void
}

export default function QuizCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  showResult,
  onSelectAnswer,
  onSubmit,
  onNext,
}: QuizCardProps) {
  const { t } = useTranslation()

  const isMultipleChoice = question.type === 'multiple_choice'
  const correctAnswer = question.correctAnswer

  const isAnswerSelected = (choiceId: string): boolean => {
    if (!selectedAnswer) return false
    if (Array.isArray(selectedAnswer)) {
      return selectedAnswer.includes(choiceId)
    }
    return selectedAnswer === choiceId
  }

  const isCorrectAnswer = (choiceId: string): boolean => {
    if (Array.isArray(correctAnswer)) {
      return correctAnswer.includes(choiceId)
    }
    return correctAnswer === choiceId
  }

  const handleChoiceClick = (choiceId: string) => {
    if (showResult) return

    if (isMultipleChoice) {
      // Toggle for multiple choice
      const currentAnswers = Array.isArray(selectedAnswer) ? selectedAnswer : []
      if (currentAnswers.includes(choiceId)) {
        onSelectAnswer(currentAnswers.filter(a => a !== choiceId).join(','))
      } else {
        onSelectAnswer([...currentAnswers, choiceId].join(','))
      }
    } else {
      onSelectAnswer(choiceId)
    }
  }

  const hasAnswer = selectedAnswer !== null && selectedAnswer !== ''
  const progress = (questionNumber / totalQuestions) * 100

  // Generate choices for true/false questions
  const choices =
    question.type === 'true_false'
      ? [
          { id: 'true', text: t('quiz.true') },
          { id: 'false', text: t('quiz.false') },
        ]
      : question.choices || []

  return (
    <Card className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-start text-sm mb-2 gap-2">
          <span 
            className="text-base-content/70" 
            data-testid="question-indicator"
          >
            {t('quiz.question', { number: questionNumber, total: totalQuestions })}
          </span>
          <span className="badge badge-primary shrink-0">{question.theme}</span>
        </div>
        <ProgressBar value={progress} size="sm" />
      </div>

      {/* Question */}
      <div className="mb-6">
        <h2 
          className="text-xl font-semibold mb-2"
          data-testid="question-text"
        >
          {question.text}
        </h2>
        {isMultipleChoice && (
          <p className="text-sm text-base-content/70">{t('quiz.selectAnswers')}</p>
        )}
      </div>

      {/* Choices */}
      <div className="space-y-3 mb-6">
        {choices.map(choice => (
          <ChoiceButton
            key={choice.id}
            id={choice.id}
            text={choice.text}
            selected={isAnswerSelected(choice.id)}
            disabled={showResult}
            showResult={showResult}
            isCorrect={isCorrectAnswer(choice.id)}
            isUserAnswer={isAnswerSelected(choice.id)}
            onClick={() => handleChoiceClick(choice.id)}
          />
        ))}
      </div>

      {/* Explanation */}
      {showResult && question.explanation && (
        <div className="alert alert-info mb-6">
          <Info size={20} />
          <div>
            <h3 className="font-bold">{t('quiz.explanation')}</h3>
            <p>{question.explanation}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {!showResult ? (
          <Button onClick={onSubmit} disabled={!hasAnswer} data-testid="submit-answer-btn">
            {t('quiz.submit')}
          </Button>
        ) : (
          <Button onClick={onNext} data-testid="next-question-btn">
            {questionNumber === totalQuestions ? t('quiz.finish') : t('quiz.next')}
            <ChevronRight size={18} />
          </Button>
        )}
      </div>
    </Card>
  )
}
