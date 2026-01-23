import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
import { useQuizStore, useProgressStore } from '@/stores'
import { QuizCard, QuizConfig, QuizResults } from '@/components/quiz'
import { getDueQuestionIds } from '@/services/spaced-repetition'
import { Card } from '@/components/ui'
import { RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react'
import type { Question } from '@/types'

export default function QuizPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const isReviewMode = searchParams.get('mode') === 'review'
  
  // Track response time for SM-2 quality
  const questionStartTime = useRef<number>(Date.now())
  const [reviewLoading, setReviewLoading] = useState(isReviewMode)
  const [reviewQuestionIds, setReviewQuestionIds] = useState<string[]>([])
  
  // Store state
  const {
    status,
    selectedTheme,
    selectedDifficulty,
    questionCount,
    shuffleQuestions,
    questions,
    currentQuestionIndex,
    answers,
    showResult,
    score,
    setConfig,
    startQuiz,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    resetQuiz,
    reviewQuestion,
  } = useQuizStore()

  const { recordAnswer } = useProgressStore()

  // Load questions from database
  const allQuestions = useLiveQuery(async () => {
    return await db.questions.toArray()
  }, [])

  // Load due questions for review mode
  useEffect(() => {
    if (isReviewMode) {
      setReviewLoading(true)
      getDueQuestionIds(50).then(ids => {
        setReviewQuestionIds(ids)
        setReviewLoading(false)
      })
    }
  }, [isReviewMode])

  // Auto-start review mode when questions are loaded
  useEffect(() => {
    if (isReviewMode && !reviewLoading && allQuestions && reviewQuestionIds.length > 0 && status === 'idle') {
      const reviewQuestions = allQuestions.filter(q => reviewQuestionIds.includes(q.id))
      if (reviewQuestions.length > 0) {
        startQuiz(reviewQuestions)
      }
    }
  }, [isReviewMode, reviewLoading, allQuestions, reviewQuestionIds, status, startQuiz])

  // Reset question timer when moving to next question
  useEffect(() => {
    questionStartTime.current = Date.now()
  }, [currentQuestionIndex])

  // Get available themes
  const themes = allQuestions
    ? [...new Set(allQuestions.map(q => q.theme))]
    : []

  // Filter questions based on config
  const getFilteredQuestions = (): Question[] => {
    if (!allQuestions) return []

    let filtered = [...allQuestions]

    if (selectedTheme) {
      filtered = filtered.filter(q => q.theme === selectedTheme)
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty)
    }

    return filtered
  }

  const filteredQuestions = getFilteredQuestions()
  const maxQuestions = filteredQuestions.length

  // Initialize quiz state on mount
  useEffect(() => {
    if (status === 'idle' && !isReviewMode) {
      resetQuiz()
    }
  }, [status, resetQuiz, isReviewMode])

  // Handle quiz start
  const handleStart = () => {
    if (filteredQuestions.length === 0) return
    startQuiz(filteredQuestions)
  }

  // Handle answer submission with progress tracking
  const handleSubmit = async () => {
    const currentQuestion = questions[currentQuestionIndex]
    const answer = answers[currentQuestion.id]
    
    if (!answer) return

    // Calculate response time for SM-2 quality
    const responseTimeMs = Date.now() - questionStartTime.current

    // Check if correct
    const correctAnswer = currentQuestion.correctAnswer
    let isCorrect = false

    if (Array.isArray(correctAnswer)) {
      const userAnswers = Array.isArray(answer) ? answer : answer.split(',').filter(Boolean)
      isCorrect =
        correctAnswer.length === userAnswers.length &&
        correctAnswer.every(a => userAnswers.includes(a))
    } else {
      isCorrect = answer === correctAnswer
    }

    // Record progress with response time for better SM-2 quality scoring
    await recordAnswer(currentQuestion.id, isCorrect, responseTimeMs)

    // Show result
    submitAnswer()
  }

  // Current question
  const currentQuestion = questions[currentQuestionIndex]

  // Review mode loading state
  if (isReviewMode && reviewLoading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center gap-4">
        <div className="loading loading-spinner loading-lg text-primary" />
        <p className="text-lg">Chargement des questions à réviser...</p>
      </div>
    )
  }

  // Review mode - no questions due
  if (isReviewMode && !reviewLoading && reviewQuestionIds.length === 0 && status === 'idle') {
    return (
      <div className="py-8">
        <Card className="max-w-lg mx-auto text-center">
          <div className="flex flex-col items-center gap-4">
            <CheckCircle size={64} className="text-success" />
            <h2 className="text-2xl font-bold">Aucune révision requise!</h2>
            <p className="text-base-content/70">
              Toutes vos questions sont à jour. Revenez plus tard ou répondez à de nouvelles questions pour alimenter votre file de révision.
            </p>
            <div className="flex gap-4 mt-4">
              <Link to="/" className="btn btn-outline">
                <ArrowLeft size={20} />
                Accueil
              </Link>
              <Link to="/quiz" className="btn btn-primary">
                <RefreshCw size={20} />
                Quiz classique
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Render based on status
  if (status === 'idle' || status === 'configuring') {
    return (
      <div className="py-8">
        <h1 className="text-3xl font-bold text-center mb-8">{t('quiz.title')}</h1>
        
        {maxQuestions === 0 && allQuestions !== undefined ? (
          <div className="alert alert-warning max-w-lg mx-auto">
            <span>Aucune question disponible avec ces critères. Modifiez les filtres.</span>
          </div>
        ) : (
          <QuizConfig
            themes={themes}
            selectedTheme={selectedTheme}
            questionCount={Math.min(questionCount, maxQuestions)}
            difficulty={selectedDifficulty}
            shuffleQuestions={shuffleQuestions}
            onThemeChange={theme => setConfig({ theme })}
            onQuestionCountChange={count => setConfig({ count })}
            onDifficultyChange={difficulty => setConfig({ difficulty })}
            onShuffleChange={shuffle => setConfig({ shuffle })}
            onStart={handleStart}
            maxQuestions={maxQuestions}
          />
        )}

        {/* Info about available questions */}
        <div className="text-center mt-6 text-base-content/70">
          <p>{maxQuestions} questions disponibles</p>
        </div>
      </div>
    )
  }

  if (status === 'playing' || status === 'reviewing') {
    if (!currentQuestion) {
      return <div className="loading loading-spinner loading-lg mx-auto" />
    }

    return (
      <div className="py-8">
        {/* Review mode indicator */}
        {isReviewMode && (
          <div className="mb-4 flex justify-center">
            <span className="badge badge-secondary badge-lg gap-2">
              <RefreshCw size={16} />
              Mode révision
            </span>
          </div>
        )}
        
        <QuizCard
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          selectedAnswer={answers[currentQuestion.id] || null}
          showResult={showResult}
          onSelectAnswer={answer => selectAnswer(currentQuestion.id, answer)}
          onSubmit={handleSubmit}
          onNext={nextQuestion}
        />
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <div className="py-8">
        {/* Review mode completion message */}
        {isReviewMode && (
          <div className="mb-6 text-center">
            <div className="badge badge-success badge-lg gap-2 mb-2">
              <CheckCircle size={16} />
              Révision terminée!
            </div>
            <p className="text-base-content/70">
              Les intervalles de révision ont été mis à jour selon vos performances.
            </p>
          </div>
        )}
        
        <QuizResults
          questions={questions}
          answers={answers}
          score={score}
          totalQuestions={questions.length}
          onRetry={resetQuiz}
          onReviewQuestion={reviewQuestion}
        />
      </div>
    )
  }

  return null
}
