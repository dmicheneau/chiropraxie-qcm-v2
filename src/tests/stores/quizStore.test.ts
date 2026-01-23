import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useQuizStore } from '@/stores/quizStore'
import type { Question } from '@/types'

// Mock the database
vi.mock('@/services/db', () => ({
  db: {
    sessions: {
      add: vi.fn().mockResolvedValue(undefined),
    },
  },
}))

describe('quizStore', () => {
  const mockQuestions: Question[] = [
    {
      id: 'q1',
      type: 'single_choice',
      text: 'Question 1',
      choices: [
        { id: 'A', text: 'Choice A' },
        { id: 'B', text: 'Choice B' },
      ],
      correctAnswer: 'A',
      theme: 'Anatomie',
      difficulty: 'easy',
      tags: [],
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'q2',
      type: 'single_choice',
      text: 'Question 2',
      choices: [
        { id: 'A', text: 'Choice A' },
        { id: 'B', text: 'Choice B' },
      ],
      correctAnswer: 'B',
      theme: 'Neurologie',
      difficulty: 'medium',
      tags: [],
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'q3',
      type: 'multiple_choice',
      text: 'Question 3',
      choices: [
        { id: 'A', text: 'Choice A' },
        { id: 'B', text: 'Choice B' },
        { id: 'C', text: 'Choice C' },
      ],
      correctAnswer: ['A', 'B'],
      theme: 'Chiropraxie',
      difficulty: 'hard',
      tags: [],
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    // Reset store to initial state
    useQuizStore.setState({
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
    })
  })

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useQuizStore.getState()
      expect(state.status).toBe('idle')
      expect(state.selectedTheme).toBeNull()
      expect(state.selectedDifficulty).toBeNull()
      expect(state.questionCount).toBe(20)
      expect(state.shuffleQuestions).toBe(true)
      expect(state.questions).toEqual([])
      expect(state.currentQuestionIndex).toBe(0)
      expect(state.answers).toEqual({})
      expect(state.showResult).toBe(false)
      expect(state.score).toBe(0)
    })
  })

  describe('setConfig', () => {
    it('updates theme', () => {
      useQuizStore.getState().setConfig({ theme: 'Anatomie' })
      expect(useQuizStore.getState().selectedTheme).toBe('Anatomie')
    })

    it('updates difficulty', () => {
      useQuizStore.getState().setConfig({ difficulty: 'hard' })
      expect(useQuizStore.getState().selectedDifficulty).toBe('hard')
    })

    it('updates question count', () => {
      useQuizStore.getState().setConfig({ count: 10 })
      expect(useQuizStore.getState().questionCount).toBe(10)
    })

    it('updates shuffle setting', () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      expect(useQuizStore.getState().shuffleQuestions).toBe(false)
    })

    it('updates multiple settings at once', () => {
      useQuizStore.getState().setConfig({
        theme: 'Neurologie',
        difficulty: 'medium',
        count: 15,
        shuffle: false,
      })
      const state = useQuizStore.getState()
      expect(state.selectedTheme).toBe('Neurologie')
      expect(state.selectedDifficulty).toBe('medium')
      expect(state.questionCount).toBe(15)
      expect(state.shuffleQuestions).toBe(false)
    })
  })

  describe('startQuiz', () => {
    it('sets status to playing', () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      expect(useQuizStore.getState().status).toBe('playing')
    })

    it('limits questions to questionCount', () => {
      useQuizStore.getState().setConfig({ count: 2, shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      expect(useQuizStore.getState().questions).toHaveLength(2)
    })

    it('resets answers and current index', () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      expect(useQuizStore.getState().currentQuestionIndex).toBe(0)
      expect(useQuizStore.getState().answers).toEqual({})
    })

    it('creates a session', () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      const session = useQuizStore.getState().session
      expect(session).not.toBeNull()
      expect(session?.questionsIds).toBeDefined()
      expect(session?.startedAt).toBeDefined()
    })
  })

  describe('selectAnswer', () => {
    it('stores answer for question', () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      useQuizStore.getState().selectAnswer('q1', 'A')
      expect(useQuizStore.getState().answers['q1']).toBe('A')
    })

    it('overwrites previous answer', () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      useQuizStore.getState().selectAnswer('q1', 'A')
      useQuizStore.getState().selectAnswer('q1', 'B')
      expect(useQuizStore.getState().answers['q1']).toBe('B')
    })
  })

  describe('submitAnswer', () => {
    it('sets showResult to true', () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      useQuizStore.getState().submitAnswer()
      expect(useQuizStore.getState().showResult).toBe(true)
    })
  })

  describe('nextQuestion', () => {
    it('increments currentQuestionIndex', () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      useQuizStore.getState().nextQuestion()
      expect(useQuizStore.getState().currentQuestionIndex).toBe(1)
    })

    it('resets showResult', () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      useQuizStore.getState().submitAnswer()
      useQuizStore.getState().nextQuestion()
      expect(useQuizStore.getState().showResult).toBe(false)
    })
  })

  describe('previousQuestion', () => {
    it('decrements currentQuestionIndex', () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      useQuizStore.getState().nextQuestion()
      useQuizStore.getState().previousQuestion()
      expect(useQuizStore.getState().currentQuestionIndex).toBe(0)
    })

    it('does not go below 0', () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      useQuizStore.getState().previousQuestion()
      expect(useQuizStore.getState().currentQuestionIndex).toBe(0)
    })
  })

  describe('goToQuestion', () => {
    it('sets currentQuestionIndex to specified index', () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      useQuizStore.getState().goToQuestion(2)
      expect(useQuizStore.getState().currentQuestionIndex).toBe(2)
    })

    it('sets status to reviewing', () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      useQuizStore.getState().goToQuestion(1)
      expect(useQuizStore.getState().status).toBe('reviewing')
    })

    it('ignores invalid indices', () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      useQuizStore.getState().goToQuestion(10)
      expect(useQuizStore.getState().currentQuestionIndex).toBe(0)
    })
  })

  describe('finishQuiz', () => {
    it('sets status to completed', async () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      await useQuizStore.getState().finishQuiz()
      expect(useQuizStore.getState().status).toBe('completed')
    })

    it('calculates score for single choice correctly', async () => {
      useQuizStore.getState().setConfig({ shuffle: false, count: 2 })
      useQuizStore.getState().startQuiz(mockQuestions)
      useQuizStore.getState().selectAnswer('q1', 'A') // correct
      useQuizStore.getState().selectAnswer('q2', 'A') // incorrect
      await useQuizStore.getState().finishQuiz()
      expect(useQuizStore.getState().score).toBe(1)
    })

    it('calculates score for multiple choice correctly', async () => {
      useQuizStore.getState().setConfig({ shuffle: false, count: 3 })
      useQuizStore.getState().startQuiz(mockQuestions)
      useQuizStore.getState().selectAnswer('q1', 'A')
      useQuizStore.getState().selectAnswer('q2', 'B')
      useQuizStore.getState().selectAnswer('q3', 'A,B') // correct (both answers)
      await useQuizStore.getState().finishQuiz()
      expect(useQuizStore.getState().score).toBe(3)
    })
  })

  describe('resetQuiz', () => {
    it('resets to configuring state', () => {
      useQuizStore.getState().setConfig({ shuffle: false })
      useQuizStore.getState().startQuiz(mockQuestions)
      useQuizStore.getState().resetQuiz()
      expect(useQuizStore.getState().status).toBe('configuring')
      expect(useQuizStore.getState().questions).toEqual([])
      expect(useQuizStore.getState().answers).toEqual({})
      expect(useQuizStore.getState().score).toBe(0)
    })
  })
})
