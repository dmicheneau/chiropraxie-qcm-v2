import { useTranslation } from 'react-i18next'
import { Button, Card, ProgressBar } from '@/components/ui'
import { Trophy, RotateCcw, Home, CheckCircle, XCircle, Eye } from 'lucide-react'
import type { Question } from '@/types'
import { Link } from 'react-router-dom'

interface QuizResultsProps {
  questions: Question[]
  answers: Record<string, string | string[]>
  score: number
  totalQuestions: number
  onRetry: () => void
  onReviewQuestion: (index: number) => void
}

export default function QuizResults({
  questions,
  answers,
  score,
  totalQuestions,
  onRetry,
  onReviewQuestion,
}: QuizResultsProps) {
  const { t } = useTranslation()

  const percentage = Math.round((score / totalQuestions) * 100)
  const correctCount = score
  const incorrectCount = totalQuestions - score

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-success'
    if (percentage >= 60) return 'text-warning'
    return 'text-error'
  }

  const getScoreMessage = () => {
    if (percentage >= 90) return 'Excellent!'
    if (percentage >= 80) return 'Très bien!'
    if (percentage >= 70) return 'Bien!'
    if (percentage >= 60) return 'Correct'
    if (percentage >= 50) return 'Peut mieux faire'
    return 'Continuez vos révisions'
  }

  const isCorrect = (question: Question, answer: string | string[] | undefined) => {
    if (!answer) return false
    const correctAnswer = question.correctAnswer

    if (Array.isArray(correctAnswer)) {
      const userAnswers = Array.isArray(answer) ? answer : answer.split(',')
      return (
        correctAnswer.length === userAnswers.length &&
        correctAnswer.every(a => userAnswers.includes(a))
      )
    }
    return answer === correctAnswer
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Score Card */}
      <Card className="text-center">
        <div className="py-6">
          <Trophy size={64} className={`mx-auto mb-4 ${getScoreColor()}`} />
          <h1 className="text-3xl font-bold mb-2">{t('quiz.results.title')}</h1>
          <p className="text-xl text-base-content/70 mb-6">{getScoreMessage()}</p>

          {/* Score Display */}
          <div className={`text-6xl font-bold ${getScoreColor()} mb-4`}>{percentage}%</div>

          <ProgressBar
            value={percentage}
            className="max-w-xs mx-auto mb-4"
            variant={percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'error'}
            size="lg"
          />

          {/* Stats */}
          <div className="flex justify-center gap-8 text-lg">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle size={24} />
              <span>
                {correctCount} {t('quiz.results.correct')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-error">
              <XCircle size={24} />
              <span>
                {incorrectCount} {t('quiz.results.incorrect')}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Question Review */}
      <Card title="Récapitulatif des questions">
        <div className="space-y-2">
          {questions.map((question, index) => {
            const answer = answers[question.id]
            const correct = isCorrect(question, answer)

            return (
              <div
                key={question.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  correct ? 'bg-success/10' : 'bg-error/10'
                }`}
              >
                {correct ? (
                  <CheckCircle size={20} className="text-success flex-shrink-0" />
                ) : (
                  <XCircle size={20} className="text-error flex-shrink-0" />
                )}
                <span className="flex-1 truncate">{question.text}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onReviewQuestion(index)}
                  title="Voir la question"
                >
                  <Eye size={16} />
                </button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw size={18} />
          {t('quiz.results.retry')}
        </Button>
        <Link to="/">
          <Button>
            <Home size={18} />
            {t('quiz.results.home')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
