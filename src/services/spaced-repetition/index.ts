/**
 * Spaced Repetition Service
 * 
 * Manages the review scheduling and question selection for spaced repetition
 */

import { db } from '@/services/db'
import type { UserProgress } from '@/types'
import {
  calculateSM2,
  getQualityFromAnswer,
  getReviewPriority,
  getDefaultSM2Values
} from './sm2'

export interface ReviewStats {
  dueToday: number
  overdue: number
  upcoming: number
  mastered: number
  totalReviewed: number
}

export interface DueQuestion {
  questionId: string
  priority: number
  daysOverdue: number
  easeFactor: number
  interval: number
}

/**
 * Get all questions due for review
 */
export async function getQuestionsForReview(
  limit: number = 20
): Promise<DueQuestion[]> {
  const allProgress = await db.progress.toArray()
  const today = new Date().toISOString().split('T')[0]
  
  const dueQuestions: DueQuestion[] = allProgress
    .filter(p => {
      // Include if no next review date (new) or if due/overdue
      return !p.nextReview || p.nextReview <= today
    })
    .map(p => {
      const daysOverdue = p.nextReview
        ? Math.max(0, Math.floor(
            (new Date().getTime() - new Date(p.nextReview).getTime()) / 
            (1000 * 60 * 60 * 24)
          ))
        : 0
      
      return {
        questionId: p.questionId,
        priority: getReviewPriority(p.nextReview, p.easeFactor),
        daysOverdue,
        easeFactor: p.easeFactor,
        interval: p.interval
      }
    })
    .sort((a, b) => a.priority - b.priority)
  
  return dueQuestions.slice(0, limit)
}

/**
 * Get question IDs that are due for review
 */
export async function getDueQuestionIds(limit: number = 20): Promise<string[]> {
  const dueQuestions = await getQuestionsForReview(limit)
  return dueQuestions.map(q => q.questionId)
}

/**
 * Update progress with SM-2 calculation after answering a question
 */
export async function updateProgressWithSM2(
  questionId: string,
  isCorrect: boolean,
  responseTimeMs?: number
): Promise<UserProgress> {
  const existing = await db.progress.get(questionId)
  const quality = getQualityFromAnswer(isCorrect, responseTimeMs)
  
  if (existing) {
    // Calculate new SM-2 values
    const sm2Result = calculateSM2({
      quality,
      repetitions: isCorrect ? (existing.interval > 0 ? 1 : 0) : 0,
      easeFactor: existing.easeFactor,
      interval: existing.interval
    })
    
    const updated: UserProgress = {
      ...existing,
      attempts: existing.attempts + 1,
      correctAttempts: existing.correctAttempts + (isCorrect ? 1 : 0),
      lastAttempted: new Date().toISOString(),
      nextReview: sm2Result.nextReviewDate,
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval
    }
    
    await db.progress.put(updated)
    return updated
  } else {
    // New progress entry
    const defaults = getDefaultSM2Values()
    const sm2Result = calculateSM2({
      quality,
      ...defaults
    })
    
    const newProgress: UserProgress = {
      questionId,
      attempts: 1,
      correctAttempts: isCorrect ? 1 : 0,
      lastAttempted: new Date().toISOString(),
      nextReview: sm2Result.nextReviewDate,
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval
    }
    
    await db.progress.add(newProgress)
    return newProgress
  }
}

/**
 * Get review statistics
 */
export async function getReviewStats(): Promise<ReviewStats> {
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
  
  return {
    dueToday,
    overdue,
    upcoming,
    mastered,
    totalReviewed: allProgress.length
  }
}

/**
 * Get questions that haven't been reviewed yet (new questions)
 */
export async function getNewQuestions(
  allQuestionIds: string[],
  limit: number = 10
): Promise<string[]> {
  const reviewedIds = new Set(
    (await db.progress.toArray()).map(p => p.questionId)
  )
  
  return allQuestionIds
    .filter(id => !reviewedIds.has(id))
    .slice(0, limit)
}

/**
 * Check if there are questions due for review
 */
export async function hasQuestionsForReview(): Promise<boolean> {
  const dueQuestions = await getQuestionsForReview(1)
  return dueQuestions.length > 0
}

// Re-export SM-2 functions
export {
  calculateSM2,
  getQualityFromAnswer,
  isDueForReview,
  daysUntilReview,
  getReviewPriority,
  getDefaultSM2Values
} from './sm2'
