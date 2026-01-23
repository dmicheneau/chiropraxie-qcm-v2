import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
import { useQuizStore, useProgressStore } from '@/stores'
import { QuizCard, QuizConfig, QuizResults } from '@/components/quiz'
import type { Question } from '@/types'

export default function QuizPage() {
  const { t } = useTranslation()
  
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
    if (status === 'idle') {
      resetQuiz()
    }
  }, [status, resetQuiz])

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

    // Record progress
    await recordAnswer(currentQuestion.id, isCorrect)

    // Show result
    submitAnswer()
  }

  // Current question
  const currentQuestion = questions[currentQuestionIndex]

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
