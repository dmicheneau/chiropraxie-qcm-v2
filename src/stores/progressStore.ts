import { create } from 'zustand'
import type { UserProgress, Streak } from '@/types'
import { db } from '@/services/db'
import { 
  calculateSM2, 
  getQualityFromAnswer, 
  getDefaultSM2Values,
  type ReviewStats 
} from '@/services/spaced-repetition'

interface ProgressState {
  // Streak
  streak: Streak | null
  previousStreak: number // For detecting new streak increases
  
  // Stats
  totalQuestionsAnswered: number
  totalCorrect: number
  progressByQuestion: Map<string, UserProgress>
  
  // Review stats
  reviewStats: ReviewStats | null
  
  // Actions
  loadProgress: () => Promise<void>
  recordAnswer: (questionId: string, isCorrect: boolean, responseTimeMs?: number) => Promise<void>
  updateStreak: () => Promise<{ isNewStreak: boolean; isNewRecord: boolean }>
  getQuestionProgress: (questionId: string) => UserProgress | undefined
  loadReviewStats: () => Promise<ReviewStats>
  getDueQuestionIds: (limit?: number) => Promise<string[]>
  checkStreakStatus: () => { isAtRisk: boolean; hoursUntilMidnight: number }
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  // Initial state
  streak: null,
  previousStreak: 0,
  totalQuestionsAnswered: 0,
  totalCorrect: 0,
  progressByQuestion: new Map(),
  reviewStats: null,

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
        previousStreak: streak?.currentStreak || 0,
        totalQuestionsAnswered: totalAnswered,
        totalCorrect,
        progressByQuestion: progressMap,
      })
      
      // Also load review stats
      await get().loadReviewStats()
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  },

  recordAnswer: async (questionId: string, isCorrect: boolean, responseTimeMs?: number) => {
    try {
      const existing = await db.progress.get(questionId)
      const now = new Date().toISOString()
      
      // Calculate quality score for SM-2
      const quality = getQualityFromAnswer(isCorrect, responseTimeMs)

      if (existing) {
        // Calculate SM-2 values
        const sm2Result = calculateSM2({
          quality,
          repetitions: existing.interval > 0 ? Math.floor(Math.log2(existing.interval)) : 0,
          easeFactor: existing.easeFactor,
          interval: existing.interval
        })
        
        // Update existing progress with SM-2 values
        const updated: UserProgress = {
          ...existing,
          attempts: existing.attempts + 1,
          correctAttempts: existing.correctAttempts + (isCorrect ? 1 : 0),
          lastAttempted: now,
          nextReview: sm2Result.nextReviewDate,
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval
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
        // Create new progress with SM-2 values
        const defaults = getDefaultSM2Values()
        const sm2Result = calculateSM2({
          quality,
          ...defaults
        })
        
        const newProgress: UserProgress = {
          questionId,
          attempts: 1,
          correctAttempts: isCorrect ? 1 : 0,
          lastAttempted: now,
          nextReview: sm2Result.nextReviewDate,
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval
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
      
      // Refresh review stats
      await get().loadReviewStats()
    } catch (error) {
      console.error('Error recording answer:', error)
    }
  },

  updateStreak: async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const existing = await db.streaks.get('default')
      const previousStreak = get().previousStreak

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
        set({ streak: newStreak, previousStreak: 1 })
        return { isNewStreak: true, isNewRecord: true }
      }

      const lastDate = existing.lastActivityDate
      if (lastDate === today) {
        // Already active today, no update needed
        return { isNewStreak: false, isNewRecord: false }
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

      const isNewRecord = newCurrentStreak > existing.longestStreak

      const updatedStreak: Streak = {
        ...existing,
        currentStreak: newCurrentStreak,
        longestStreak: Math.max(existing.longestStreak, newCurrentStreak),
        lastActivityDate: today,
        totalDaysActive: existing.totalDaysActive + 1,
        updatedAt: new Date().toISOString(),
      }

      await db.streaks.put(updatedStreak)
      set({ streak: updatedStreak, previousStreak: newCurrentStreak })
      
      return { 
        isNewStreak: newCurrentStreak > previousStreak, 
        isNewRecord 
      }
    } catch (error) {
      console.error('Error updating streak:', error)
      return { isNewStreak: false, isNewRecord: false }
    }
  },

  getQuestionProgress: questionId => {
    return get().progressByQuestion.get(questionId)
  },
  
  loadReviewStats: async () => {
    try {
      const allProgress = await db.progress.toArray()
      const today = new Date().toISOString().split('T')[0]
      
      let dueToday = 0
      let overdue = 0
      let upcoming = 0
      let mastered = 0
      
      for (const p of allProgress) {
        if (!p.nextReview) {
          dueToday++
        } else if (p.nextReview === today) {
          dueToday++
        } else if (p.nextReview < today) {
          overdue++
        } else {
          upcoming++
        }
        
        // Consider mastered if interval >= 21 days (3 weeks)
        if (p.interval >= 21) {
          mastered++
        }
      }
      
      const stats: ReviewStats = {
        dueToday,
        overdue,
        upcoming,
        mastered,
        totalReviewed: allProgress.length
      }
      
      set({ reviewStats: stats })
      return stats
    } catch (error) {
      console.error('Error loading review stats:', error)
      return { dueToday: 0, overdue: 0, upcoming: 0, mastered: 0, totalReviewed: 0 }
    }
  },
  
  getDueQuestionIds: async (limit = 20) => {
    try {
      const allProgress = await db.progress.toArray()
      const today = new Date().toISOString().split('T')[0]
      
      const dueQuestions = allProgress
        .filter(p => !p.nextReview || p.nextReview <= today)
        .sort((a, b) => {
          // Sort by overdue first, then by ease factor (harder questions first)
          const aOverdue = a.nextReview ? (a.nextReview < today ? 1 : 0) : 0
          const bOverdue = b.nextReview ? (b.nextReview < today ? 1 : 0) : 0
          if (aOverdue !== bOverdue) return bOverdue - aOverdue
          return a.easeFactor - b.easeFactor
        })
        .slice(0, limit)
        .map(p => p.questionId)
      
      return dueQuestions
    } catch (error) {
      console.error('Error getting due question IDs:', error)
      return []
    }
  },
  
  checkStreakStatus: () => {
    const streak = get().streak
    if (!streak || streak.currentStreak === 0) {
      return { isAtRisk: false, hoursUntilMidnight: 0 }
    }
    
    const today = new Date().toISOString().split('T')[0]
    const isAtRisk = streak.lastActivityDate !== today
    
    // Calculate hours until midnight
    const now = new Date()
    const midnight = new Date(now)
    midnight.setDate(midnight.getDate() + 1)
    midnight.setHours(0, 0, 0, 0)
    const hoursUntilMidnight = Math.floor((midnight.getTime() - now.getTime()) / (1000 * 60 * 60))
    
    return { isAtRisk, hoursUntilMidnight }
  }
}))
