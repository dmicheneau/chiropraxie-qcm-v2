/**
 * SM-2 Algorithm Implementation
 * 
 * The SM-2 (SuperMemo 2) algorithm is a spaced repetition algorithm
 * that calculates optimal review intervals based on user performance.
 * 
 * Quality ratings:
 * 0 - Complete failure, no recall
 * 1 - Incorrect, but remembered upon seeing answer
 * 2 - Incorrect, but answer seemed easy to recall
 * 3 - Correct with significant difficulty
 * 4 - Correct with some hesitation
 * 5 - Perfect recall
 */

export interface SM2Input {
  quality: number        // 0-5 rating of recall quality
  repetitions: number    // Number of consecutive correct answers
  easeFactor: number     // Current ease factor (default 2.5, min 1.3)
  interval: number       // Current interval in days
}

export interface SM2Result {
  interval: number       // Days until next review
  easeFactor: number     // Updated ease factor
  repetitions: number    // Updated repetition count
  nextReviewDate: string // ISO date string of next review
}

/**
 * Calculate the next review interval using SM-2 algorithm
 */
export function calculateSM2(input: SM2Input): SM2Result {
  const { quality, repetitions, easeFactor, interval } = input
  
  let newEaseFactor = easeFactor
  let newInterval: number
  let newRepetitions: number
  
  if (quality < 3) {
    // Failed recall - reset to beginning
    newRepetitions = 0
    newInterval = 1
    // Decrease ease factor but not below 1.3
    newEaseFactor = Math.max(1.3, easeFactor - 0.2)
  } else {
    // Successful recall
    newRepetitions = repetitions + 1
    
    // Calculate new ease factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    newEaseFactor = Math.max(1.3, newEaseFactor)
    
    // Calculate new interval
    if (newRepetitions === 1) {
      newInterval = 1
    } else if (newRepetitions === 2) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * newEaseFactor)
    }
  }
  
  // Calculate next review date
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)
  
  return {
    interval: newInterval,
    easeFactor: Math.round(newEaseFactor * 100) / 100, // Round to 2 decimals
    repetitions: newRepetitions,
    nextReviewDate: nextReview.toISOString().split('T')[0]
  }
}

/**
 * Convert a boolean isCorrect to SM-2 quality rating
 * 
 * @param isCorrect - Whether the answer was correct
 * @param responseTimeMs - Optional response time in milliseconds
 * @returns Quality rating 0-5
 */
export function getQualityFromAnswer(
  isCorrect: boolean, 
  responseTimeMs?: number
): number {
  if (!isCorrect) {
    // Incorrect answer
    return 2 // "Incorrect but seemed easy to recall" - middle ground
  }
  
  // Correct answer - adjust based on response time if available
  if (responseTimeMs !== undefined) {
    if (responseTimeMs < 3000) {
      return 5 // Perfect, quick recall
    } else if (responseTimeMs < 10000) {
      return 4 // Good, some hesitation
    } else {
      return 3 // Correct but with difficulty
    }
  }
  
  // Default for correct answer without timing
  return 4
}

/**
 * Check if a question is due for review
 */
export function isDueForReview(nextReviewDate: string | undefined): boolean {
  if (!nextReviewDate) return true // New question, always due
  
  const today = new Date().toISOString().split('T')[0]
  return nextReviewDate <= today
}

/**
 * Get the number of days until next review
 * Returns negative number if overdue
 */
export function daysUntilReview(nextReviewDate: string | undefined): number {
  if (!nextReviewDate) return 0 // Due now
  
  // Parse dates as local dates to avoid timezone issues
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  // Compare as strings for same day
  if (nextReviewDate === todayStr) return 0
  
  // Calculate difference
  const todayMs = new Date(todayStr + 'T00:00:00').getTime()
  const reviewMs = new Date(nextReviewDate + 'T00:00:00').getTime()
  
  const diffDays = Math.round((reviewMs - todayMs) / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Get default SM-2 values for a new question
 */
export function getDefaultSM2Values(): Pick<SM2Input, 'easeFactor' | 'interval' | 'repetitions'> {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0
  }
}

/**
 * Get review priority score (lower = higher priority)
 * Based on how overdue the question is and ease factor
 */
export function getReviewPriority(
  nextReviewDate: string | undefined,
  easeFactor: number
): number {
  const daysUntil = daysUntilReview(nextReviewDate)
  
  // Overdue questions have higher priority (lower score)
  // Questions with lower ease factor also get priority boost (lower score)
  // For overdue (negative daysUntil), the penalty makes score more negative
  const overduePenalty = Math.min(0, daysUntil) * 10
  
  // Lower ease factor should give lower priority score
  // easeFactor 1.3 -> penalty -6, easeFactor 2.5 -> penalty 0
  const easePenalty = (easeFactor - 2.5) * 5
  
  return daysUntil + overduePenalty + easePenalty
}
