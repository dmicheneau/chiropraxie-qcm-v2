import { create } from 'zustand'
import type { UserProgress, Streak } from '@/types'
import { db } from '@/services/db'

interface ProgressState {
  // Streak
  streak: Streak | null
  
  // Stats
  totalQuestionsAnswered: number
  totalCorrect: number
  progressByQuestion: Map<string, UserProgress>
  
  // Actions
  loadProgress: () => Promise<void>
  recordAnswer: (questionId: string, isCorrect: boolean) => Promise<void>
  updateStreak: () => Promise<void>
  getQuestionProgress: (questionId: string) => UserProgress | undefined
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  // Initial state
  streak: null,
  totalQuestionsAnswered: 0,
  totalCorrect: 0,
  progressByQuestion: new Map(),

  // Actions
  loadProgress: async () => {
    try {
      // Load streak
      const streak = await db.streaks.get('default')
      
      // Load all progress
      const allProgress = await db.progress.toArray()
      const progressMap = new Map<string, UserProgress>()
      let totalAnswered = 0
      let totalCorrect = 0

      allProgress.forEach(p => {
        progressMap.set(p.questionId, p)
        totalAnswered += p.attempts
        totalCorrect += p.correctAttempts
      })

      set({
        streak: streak || null,
        totalQuestionsAnswered: totalAnswered,
        totalCorrect,
        progressByQuestion: progressMap,
      })
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  },

  recordAnswer: async (questionId: string, isCorrect: boolean) => {
    try {
      const existing = await db.progress.get(questionId)
      const now = new Date().toISOString()

      if (existing) {
        // Update existing progress
        const updated: UserProgress = {
          ...existing,
          attempts: existing.attempts + 1,
          correctAttempts: existing.correctAttempts + (isCorrect ? 1 : 0),
          lastAttempted: now,
        }
        await db.progress.put(updated)
        
        set(state => {
          const newMap = new Map(state.progressByQuestion)
          newMap.set(questionId, updated)
          return {
            progressByQuestion: newMap,
            totalQuestionsAnswered: state.totalQuestionsAnswered + 1,
            totalCorrect: state.totalCorrect + (isCorrect ? 1 : 0),
          }
        })
      } else {
        // Create new progress
        const newProgress: UserProgress = {
          questionId,
          attempts: 1,
          correctAttempts: isCorrect ? 1 : 0,
          lastAttempted: now,
          easeFactor: 2.5,
          interval: 1,
        }
        await db.progress.add(newProgress)
        
        set(state => {
          const newMap = new Map(state.progressByQuestion)
          newMap.set(questionId, newProgress)
          return {
            progressByQuestion: newMap,
            totalQuestionsAnswered: state.totalQuestionsAnswered + 1,
            totalCorrect: state.totalCorrect + (isCorrect ? 1 : 0),
          }
        })
      }

      // Update streak
      await get().updateStreak()
    } catch (error) {
      console.error('Error recording answer:', error)
    }
  },

  updateStreak: async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const existing = await db.streaks.get('default')

      if (!existing) {
        // Create new streak
        const newStreak: Streak = {
          id: 'default',
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
          totalDaysActive: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        await db.streaks.add(newStreak)
        set({ streak: newStreak })
        return
      }

      const lastDate = existing.lastActivityDate
      if (lastDate === today) {
        // Already active today, no update needed
        return
      }

      // Check if yesterday
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      let newCurrentStreak = 1
      if (lastDate === yesterdayStr) {
        // Consecutive day
        newCurrentStreak = existing.currentStreak + 1
      }

      const updatedStreak: Streak = {
        ...existing,
        currentStreak: newCurrentStreak,
        longestStreak: Math.max(existing.longestStreak, newCurrentStreak),
        lastActivityDate: today,
        totalDaysActive: existing.totalDaysActive + 1,
        updatedAt: new Date().toISOString(),
      }

      await db.streaks.put(updatedStreak)
      set({ streak: updatedStreak })
    } catch (error) {
      console.error('Error updating streak:', error)
    }
  },

  getQuestionProgress: questionId => {
    return get().progressByQuestion.get(questionId)
  },
}))
