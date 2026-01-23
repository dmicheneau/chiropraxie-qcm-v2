/**
 * SM-2 Algorithm Tests
 */

import { describe, it, expect } from 'vitest'
import {
  calculateSM2,
  getQualityFromAnswer,
  isDueForReview,
  daysUntilReview,
  getDefaultSM2Values,
  getReviewPriority
} from '@/services/spaced-repetition/sm2'

describe('SM-2 Algorithm', () => {
  describe('calculateSM2', () => {
    describe('Failed recall (quality < 3)', () => {
      it('should reset repetitions on failure', () => {
        const result = calculateSM2({
          quality: 2,
          repetitions: 5,
          easeFactor: 2.5,
          interval: 30
        })

        expect(result.repetitions).toBe(0)
        expect(result.interval).toBe(1)
      })

      it('should decrease ease factor on failure', () => {
        const result = calculateSM2({
          quality: 2,
          repetitions: 3,
          easeFactor: 2.5,
          interval: 10
        })

        expect(result.easeFactor).toBe(2.3)
      })

      it('should not decrease ease factor below 1.3', () => {
        const result = calculateSM2({
          quality: 0,
          repetitions: 3,
          easeFactor: 1.4,
          interval: 10
        })

        expect(result.easeFactor).toBe(1.3)
      })

      it('should set interval to 1 day on complete failure', () => {
        const result = calculateSM2({
          quality: 0,
          repetitions: 10,
          easeFactor: 2.5,
          interval: 60
        })

        expect(result.interval).toBe(1)
      })
    })

    describe('Successful recall (quality >= 3)', () => {
      it('should set interval to 1 for first successful repetition', () => {
        const result = calculateSM2({
          quality: 4,
          repetitions: 0,
          easeFactor: 2.5,
          interval: 0
        })

        expect(result.interval).toBe(1)
        expect(result.repetitions).toBe(1)
      })

      it('should set interval to 6 for second successful repetition', () => {
        const result = calculateSM2({
          quality: 4,
          repetitions: 1,
          easeFactor: 2.5,
          interval: 1
        })

        expect(result.interval).toBe(6)
        expect(result.repetitions).toBe(2)
      })

      it('should multiply interval by ease factor for subsequent repetitions', () => {
        const result = calculateSM2({
          quality: 4,
          repetitions: 2,
          easeFactor: 2.5,
          interval: 6
        })

        expect(result.interval).toBe(15) // 6 * 2.5 = 15
        expect(result.repetitions).toBe(3)
      })

      it('should increase ease factor for perfect recall (quality 5)', () => {
        const result = calculateSM2({
          quality: 5,
          repetitions: 2,
          easeFactor: 2.5,
          interval: 6
        })

        expect(result.easeFactor).toBeGreaterThan(2.5)
      })

      it('should decrease ease factor for difficult recall (quality 3)', () => {
        const result = calculateSM2({
          quality: 3,
          repetitions: 2,
          easeFactor: 2.5,
          interval: 6
        })

        expect(result.easeFactor).toBeLessThan(2.5)
      })
    })

    describe('Edge cases', () => {
      it('should handle first ever attempt', () => {
        const defaults = getDefaultSM2Values()
        const result = calculateSM2({
          quality: 4,
          ...defaults
        })

        expect(result.interval).toBe(1)
        expect(result.repetitions).toBe(1)
        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3)
      })

      it('should never have ease factor below 1.3', () => {
        // Even with many consecutive failures
        let ef = 2.5
        for (let i = 0; i < 20; i++) {
          const result = calculateSM2({
            quality: 0,
            repetitions: 0,
            easeFactor: ef,
            interval: 1
          })
          ef = result.easeFactor
        }
        expect(ef).toBe(1.3)
      })

      it('should return valid nextReviewDate', () => {
        const result = calculateSM2({
          quality: 4,
          repetitions: 2,
          easeFactor: 2.5,
          interval: 6
        })

        expect(result.nextReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        
        const reviewDate = new Date(result.nextReviewDate)
        const today = new Date()
        expect(reviewDate.getTime()).toBeGreaterThan(today.getTime())
      })
    })
  })

  describe('getQualityFromAnswer', () => {
    it('should return 2 for incorrect answer', () => {
      expect(getQualityFromAnswer(false)).toBe(2)
    })

    it('should return 4 for correct answer without timing', () => {
      expect(getQualityFromAnswer(true)).toBe(4)
    })

    it('should return 5 for quick correct answer (< 3s)', () => {
      expect(getQualityFromAnswer(true, 2000)).toBe(5)
    })

    it('should return 4 for medium-speed correct answer (3-10s)', () => {
      expect(getQualityFromAnswer(true, 5000)).toBe(4)
    })

    it('should return 3 for slow correct answer (> 10s)', () => {
      expect(getQualityFromAnswer(true, 15000)).toBe(3)
    })
  })

  describe('isDueForReview', () => {
    it('should return true if nextReviewDate is undefined', () => {
      expect(isDueForReview(undefined)).toBe(true)
    })

    it('should return true if nextReviewDate is today', () => {
      const today = new Date().toISOString().split('T')[0]
      expect(isDueForReview(today)).toBe(true)
    })

    it('should return true if nextReviewDate is in the past', () => {
      const past = new Date()
      past.setDate(past.getDate() - 5)
      expect(isDueForReview(past.toISOString().split('T')[0])).toBe(true)
    })

    it('should return false if nextReviewDate is in the future', () => {
      const future = new Date()
      future.setDate(future.getDate() + 5)
      expect(isDueForReview(future.toISOString().split('T')[0])).toBe(false)
    })
  })

  describe('daysUntilReview', () => {
    it('should return 0 if nextReviewDate is undefined', () => {
      expect(daysUntilReview(undefined)).toBe(0)
    })

    it('should return 0 if nextReviewDate is today', () => {
      const today = new Date().toISOString().split('T')[0]
      expect(daysUntilReview(today)).toBe(0)
    })

    it('should return negative number if overdue', () => {
      const past = new Date()
      past.setDate(past.getDate() - 3)
      expect(daysUntilReview(past.toISOString().split('T')[0])).toBe(-3)
    })

    it('should return positive number if in future', () => {
      const future = new Date()
      future.setDate(future.getDate() + 5)
      expect(daysUntilReview(future.toISOString().split('T')[0])).toBe(5)
    })
  })

  describe('getDefaultSM2Values', () => {
    it('should return default ease factor of 2.5', () => {
      const defaults = getDefaultSM2Values()
      expect(defaults.easeFactor).toBe(2.5)
    })

    it('should return default interval of 0', () => {
      const defaults = getDefaultSM2Values()
      expect(defaults.interval).toBe(0)
    })

    it('should return default repetitions of 0', () => {
      const defaults = getDefaultSM2Values()
      expect(defaults.repetitions).toBe(0)
    })
  })

  describe('getReviewPriority', () => {
    it('should give higher priority (lower score) to overdue questions', () => {
      const past = new Date()
      past.setDate(past.getDate() - 5)
      const pastStr = past.toISOString().split('T')[0]
      
      const future = new Date()
      future.setDate(future.getDate() + 5)
      const futureStr = future.toISOString().split('T')[0]
      
      const overduePriority = getReviewPriority(pastStr, 2.5)
      const futurePriority = getReviewPriority(futureStr, 2.5)
      
      expect(overduePriority).toBeLessThan(futurePriority)
    })

    it('should give higher priority to lower ease factor', () => {
      const date = new Date().toISOString().split('T')[0]
      
      const hardPriority = getReviewPriority(date, 1.5)
      const easyPriority = getReviewPriority(date, 2.5)
      
      expect(hardPriority).toBeLessThan(easyPriority)
    })

    it('should handle undefined nextReviewDate', () => {
      const priority = getReviewPriority(undefined, 2.5)
      expect(typeof priority).toBe('number')
    })
  })
})

describe('SM-2 Learning Progression', () => {
  it('should show realistic learning curve with consistent correct answers', () => {
    let interval = 0
    let easeFactor = 2.5
    let repetitions = 0
    
    const intervals: number[] = []
    
    // Simulate 10 consecutive correct answers
    for (let i = 0; i < 10; i++) {
      const result = calculateSM2({
        quality: 4, // Correct with some hesitation
        repetitions,
        easeFactor,
        interval
      })
      
      intervals.push(result.interval)
      interval = result.interval
      easeFactor = result.easeFactor
      repetitions = result.repetitions
    }
    
    // Intervals should grow: 1, 6, 15, 38, ...
    expect(intervals[0]).toBe(1)
    expect(intervals[1]).toBe(6)
    expect(intervals[2]).toBeGreaterThan(10)
    expect(intervals[9]).toBeGreaterThan(100) // After 10 correct, interval > 100 days
  })

  it('should reset progress on failure', () => {
    // Start with good progress
    let result = calculateSM2({
      quality: 4,
      repetitions: 5,
      easeFactor: 2.5,
      interval: 60
    })
    
    expect(result.interval).toBeGreaterThan(100)
    
    // Then fail
    result = calculateSM2({
      quality: 2,
      repetitions: result.repetitions,
      easeFactor: result.easeFactor,
      interval: result.interval
    })
    
    // Should reset to 1 day
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
  })
})
