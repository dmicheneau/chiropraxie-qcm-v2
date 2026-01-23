import { create } from 'zustand'
import type { Question, Difficulty, QuizSession } from '@/types'
import { db } from '@/services/db'

type QuizStatus = 'idle' | 'configuring' | 'playing' | 'reviewing' | 'completed'

interface QuizState {
  // Status
  status: QuizStatus
  
  // Configuration
  selectedTheme: string | null
  selectedDifficulty: Difficulty | null
  questionCount: number
  shuffleQuestions: boolean
  
  // Quiz data
  questions: Question[]
  currentQuestionIndex: number
  answers: Record<string, string | string[]>
  showResult: boolean
  
  // Session
  session: QuizSession | null
  
  // Computed
  score: number
  
  // Actions
  setConfig: (config: {
    theme?: string | null
    difficulty?: Difficulty | null
    count?: number
    shuffle?: boolean
  }) => void
  startQuiz: (questions: Question[]) => void
  selectAnswer: (questionId: string, answer: string | string[]) => void
  submitAnswer: () => void
  nextQuestion: () => void
  previousQuestion: () => void
  goToQuestion: (index: number) => void
  finishQuiz: () => Promise<void>
  resetQuiz: () => void
  reviewQuestion: (index: number) => void
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const calculateScore = (questions: Question[], answers: Record<string, string | string[]>): number => {
  return questions.reduce((score, question) => {
    const answer = answers[question.id]
    if (!answer) return score

    const correctAnswer = question.correctAnswer

    if (Array.isArray(correctAnswer)) {
      const userAnswers = Array.isArray(answer) ? answer : answer.split(',').filter(Boolean)
      const isCorrect =
        correctAnswer.length === userAnswers.length &&
        correctAnswer.every(a => userAnswers.includes(a))
      return score + (isCorrect ? 1 : 0)
    }

    return score + (answer === correctAnswer ? 1 : 0)
  }, 0)
}

export const useQuizStore = create<QuizState>((set, get) => ({
  // Initial state
  status: 'idle',
  selectedTheme: null,
  selectedDifficulty: null,
  questionCount: 20,
  shuffleQuestions: true,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  showResult: false,
  session: null,
  score: 0,

  // Actions
  setConfig: config => {
    set(state => ({
      selectedTheme: config.theme !== undefined ? config.theme : state.selectedTheme,
      selectedDifficulty: config.difficulty !== undefined ? config.difficulty : state.selectedDifficulty,
      questionCount: config.count !== undefined ? config.count : state.questionCount,
      shuffleQuestions: config.shuffle !== undefined ? config.shuffle : state.shuffleQuestions,
    }))
  },

  startQuiz: questions => {
    const { shuffleQuestions, questionCount } = get()
    
    let finalQuestions = [...questions]
    if (shuffleQuestions) {
      finalQuestions = shuffleArray(finalQuestions)
    }
    finalQuestions = finalQuestions.slice(0, questionCount)

    // Shuffle choices within each question
    finalQuestions = finalQuestions.map(q => ({
      ...q,
      choices: q.choices ? shuffleArray(q.choices) : q.choices,
    }))

    const session: QuizSession = {
      id: crypto.randomUUID(),
      bankId: 'default',
      theme: get().selectedTheme || undefined,
      questionsIds: finalQuestions.map(q => q.id),
      answers: {},
      startedAt: new Date().toISOString(),
    }

    set({
      status: 'playing',
      questions: finalQuestions,
      currentQuestionIndex: 0,
      answers: {},
      showResult: false,
      session,
      score: 0,
    })
  },

  selectAnswer: (questionId, answer) => {
    set(state => ({
      answers: {
        ...state.answers,
        [questionId]: answer,
      },
    }))
  },

  submitAnswer: () => {
    set({ showResult: true })
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions, status } = get()
    
    if (currentQuestionIndex < questions.length - 1) {
      set({
        currentQuestionIndex: currentQuestionIndex + 1,
        showResult: false,
      })
    } else if (status === 'playing') {
      // Last question - go to results
      get().finishQuiz()
    }
  },

  previousQuestion: () => {
    const { currentQuestionIndex } = get()
    if (currentQuestionIndex > 0) {
      set({
        currentQuestionIndex: currentQuestionIndex - 1,
        showResult: true, // Show result when going back
      })
    }
  },

  goToQuestion: index => {
    const { questions } = get()
    if (index >= 0 && index < questions.length) {
      set({
        currentQuestionIndex: index,
        showResult: true,
        status: 'reviewing',
      })
    }
  },

  finishQuiz: async () => {
    const { questions, answers, session } = get()
    const score = calculateScore(questions, answers)

    // Update session
    const completedSession: QuizSession = {
      ...session!,
      answers,
      completedAt: new Date().toISOString(),
      score,
    }

    // Save to database
    try {
      await db.sessions.add(completedSession)
    } catch (error) {
      console.error('Error saving quiz session:', error)
    }

    set({
      status: 'completed',
      score,
      session: completedSession,
    })
  },

  resetQuiz: () => {
    set({
      status: 'configuring',
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      showResult: false,
      session: null,
      score: 0,
    })
  },

  reviewQuestion: index => {
    set({
      currentQuestionIndex: index,
      showResult: true,
      status: 'reviewing',
    })
  },
}))
