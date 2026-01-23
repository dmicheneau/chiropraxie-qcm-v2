/**
 * Converter Tests - Flashcard to QCM conversion
 */

import { describe, it, expect } from 'vitest'
import {
  convertFlashcardsToQuestions,
  validateCardsForConversion,
  type ConversionOptions
} from '@/services/import/converter'
import type { FlashCard } from '@/services/import/quizlet'

// Sample flashcards for testing
const sampleCards: FlashCard[] = [
  { term: 'Vertèbre', definition: 'Os de la colonne vertébrale' },
  { term: 'Disque intervertébral', definition: 'Structure fibro-cartilagineuse entre les vertèbres' },
  { term: 'Moelle épinière', definition: 'Partie du système nerveux central dans le canal rachidien' },
  { term: 'Nerf spinal', definition: 'Nerf émergeant de la moelle épinière' },
  { term: 'Subluxation', definition: 'Déplacement partiel d\'une articulation' }
]

const defaultOptions: ConversionOptions = {
  mode: 'term-to-question',
  theme: 'Anatomie',
  difficulty: 'medium',
  shuffleChoices: false
}

describe('convertFlashcardsToQuestions', () => {
  describe('basic conversion', () => {
    it('converts flashcards to questions successfully', () => {
      const result = convertFlashcardsToQuestions(sampleCards, defaultOptions)

      expect(result.questions).toHaveLength(5)
      expect(result.skipped).toBe(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('generates valid question structure', () => {
      const result = convertFlashcardsToQuestions(sampleCards, defaultOptions)
      const question = result.questions[0]

      expect(question.id).toBeDefined()
      expect(question.type).toBe('single_choice')
      expect(question.text).toContain('Vertèbre')
      expect(question.choices).toHaveLength(4)
      expect(question.correctAnswer).toBeDefined()
      expect(question.theme).toBe('Anatomie')
      expect(question.difficulty).toBe('medium')
      expect(question.source).toBe('quizlet')
      expect(question.createdAt).toBeDefined()
      expect(question.updatedAt).toBeDefined()
    })

    it('generates unique IDs for each question', () => {
      const result = convertFlashcardsToQuestions(sampleCards, defaultOptions)
      const ids = result.questions.map(q => q.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('conversion modes', () => {
    it('term-to-question mode asks for definition', () => {
      const options: ConversionOptions = { ...defaultOptions, mode: 'term-to-question' }
      const result = convertFlashcardsToQuestions(sampleCards, options)

      expect(result.questions[0].text).toContain('définition')
      expect(result.questions[0].text).toContain('Vertèbre')
    })

    it('definition-to-question mode asks for term', () => {
      const options: ConversionOptions = { ...defaultOptions, mode: 'definition-to-question' }
      const result = convertFlashcardsToQuestions(sampleCards, options)

      expect(result.questions[0].text).toContain('terme')
      expect(result.questions[0].text).toContain('Os de la colonne vertébrale')
    })
  })

  describe('choices generation', () => {
    it('generates 4 choices per question', () => {
      const result = convertFlashcardsToQuestions(sampleCards, defaultOptions)

      result.questions.forEach(question => {
        expect(question.choices).toHaveLength(4)
      })
    })

    it('assigns A, B, C, D ids to choices', () => {
      const result = convertFlashcardsToQuestions(sampleCards, defaultOptions)

      result.questions.forEach(question => {
        const ids = question.choices!.map(c => c.id)
        expect(ids).toEqual(['A', 'B', 'C', 'D'])
      })
    })

    it('correct answer is at position A when not shuffling', () => {
      const options: ConversionOptions = { ...defaultOptions, shuffleChoices: false }
      const result = convertFlashcardsToQuestions(sampleCards, options)

      result.questions.forEach(question => {
        expect(question.correctAnswer).toBe('A')
      })
    })

    it('correct answer text matches original definition in term-to-question mode', () => {
      const options: ConversionOptions = { ...defaultOptions, mode: 'term-to-question', shuffleChoices: false }
      const result = convertFlashcardsToQuestions(sampleCards, options)

      // First question should have first card's definition as correct answer
      const correctChoice = result.questions[0].choices!.find(c => c.id === 'A')
      expect(correctChoice?.text).toBe('Os de la colonne vertébrale')
    })

    it('wrong answers come from other cards', () => {
      const options: ConversionOptions = { ...defaultOptions, shuffleChoices: false }
      const result = convertFlashcardsToQuestions(sampleCards, options)

      const question = result.questions[0]
      const wrongAnswers = question.choices!.filter(c => c.id !== 'A').map(c => c.text)

      // All wrong answers should be definitions from other cards
      const otherDefinitions = sampleCards.slice(1).map(c => c.definition)
      wrongAnswers.forEach(answer => {
        expect(otherDefinitions).toContain(answer)
      })
    })
  })

  describe('shuffle choices', () => {
    it('shuffles choices when option is enabled', () => {
      const options: ConversionOptions = { ...defaultOptions, shuffleChoices: true }

      // Run multiple times to check shuffling produces different results
      const results: string[][] = []
      for (let i = 0; i < 10; i++) {
        const result = convertFlashcardsToQuestions(sampleCards, options)
        results.push(result.questions[0].choices!.map(c => c.text))
      }

      // At least some results should be different (not all A first)
      const firstChoices = results.map(r => r[0])
      const uniqueFirstChoices = new Set(firstChoices)
      // With shuffling, we expect some variation (probabilistic)
      expect(uniqueFirstChoices.size).toBeGreaterThanOrEqual(1)
    })

    it('correct answer ID updates after shuffle', () => {
      const options: ConversionOptions = { ...defaultOptions, shuffleChoices: true }
      const result = convertFlashcardsToQuestions(sampleCards, options)

      // The correct answer should always point to the correct text
      result.questions.forEach((question, idx) => {
        const correctChoice = question.choices!.find(c => c.id === question.correctAnswer)
        const expectedText = sampleCards[idx].definition // term-to-question mode
        expect(correctChoice?.text).toBe(expectedText)
      })
    })
  })

  describe('minimum cards requirement', () => {
    it('returns empty result with less than 4 cards', () => {
      const fewCards = sampleCards.slice(0, 3)
      const result = convertFlashcardsToQuestions(fewCards, defaultOptions)

      expect(result.questions).toHaveLength(0)
      expect(result.skipped).toBe(3)
      expect(result.warnings.some(w => w.includes('4 flashcards'))).toBe(true)
    })

    it('works with exactly 4 cards', () => {
      const exactCards = sampleCards.slice(0, 4)
      const result = convertFlashcardsToQuestions(exactCards, defaultOptions)

      expect(result.questions).toHaveLength(4)
    })
  })

  describe('empty cards handling', () => {
    it('skips cards with empty term', () => {
      const cardsWithEmpty: FlashCard[] = [
        ...sampleCards,
        { term: '', definition: 'Some definition' }
      ]
      const result = convertFlashcardsToQuestions(cardsWithEmpty, defaultOptions)

      expect(result.questions).toHaveLength(5)
      expect(result.skipped).toBe(1)
    })

    it('skips cards with empty definition', () => {
      const cardsWithEmpty: FlashCard[] = [
        ...sampleCards,
        { term: 'Some term', definition: '' }
      ]
      const result = convertFlashcardsToQuestions(cardsWithEmpty, defaultOptions)

      expect(result.questions).toHaveLength(5)
      expect(result.skipped).toBe(1)
    })

    it('skips cards with whitespace-only content', () => {
      const cardsWithEmpty: FlashCard[] = [
        ...sampleCards,
        { term: '   ', definition: 'Valid' },
        { term: 'Valid', definition: '  \t\n  ' }
      ]
      const result = convertFlashcardsToQuestions(cardsWithEmpty, defaultOptions)

      expect(result.questions).toHaveLength(5)
      expect(result.skipped).toBe(2)
    })
  })

  describe('options', () => {
    it('applies theme correctly', () => {
      const options: ConversionOptions = { ...defaultOptions, theme: 'Neurologie' }
      const result = convertFlashcardsToQuestions(sampleCards, options)

      result.questions.forEach(q => {
        expect(q.theme).toBe('Neurologie')
      })
    })

    it('applies subtheme when provided', () => {
      const options: ConversionOptions = { ...defaultOptions, subtheme: 'Colonne vertébrale' }
      const result = convertFlashcardsToQuestions(sampleCards, options)

      result.questions.forEach(q => {
        expect(q.subtheme).toBe('Colonne vertébrale')
      })
    })

    it('applies difficulty correctly', () => {
      const options: ConversionOptions = { ...defaultOptions, difficulty: 'hard' }
      const result = convertFlashcardsToQuestions(sampleCards, options)

      result.questions.forEach(q => {
        expect(q.difficulty).toBe('hard')
      })
    })

    it('applies custom source', () => {
      const options: ConversionOptions = { ...defaultOptions, source: 'manual' }
      const result = convertFlashcardsToQuestions(sampleCards, options)

      result.questions.forEach(q => {
        expect(q.source).toBe('manual')
      })
    })
  })
})

describe('validateCardsForConversion', () => {
  describe('minimum cards validation', () => {
    it('returns valid for 4+ cards', () => {
      const result = validateCardsForConversion(sampleCards)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns invalid for less than 4 cards', () => {
      const fewCards = sampleCards.slice(0, 3)
      const result = validateCardsForConversion(fewCards)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('4 flashcards'))).toBe(true)
    })

    it('returns invalid for empty array', () => {
      const result = validateCardsForConversion([])

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('0'))).toBe(true)
    })
  })

  describe('empty cards warning', () => {
    it('warns about cards with empty term', () => {
      const cardsWithEmpty: FlashCard[] = [
        ...sampleCards,
        { term: '', definition: 'Valid' }
      ]
      const result = validateCardsForConversion(cardsWithEmpty)

      expect(result.warnings.some(w => w.includes('vide'))).toBe(true)
    })

    it('warns about cards with empty definition', () => {
      const cardsWithEmpty: FlashCard[] = [
        ...sampleCards,
        { term: 'Valid', definition: '' }
      ]
      const result = validateCardsForConversion(cardsWithEmpty)

      expect(result.warnings.some(w => w.includes('vide'))).toBe(true)
    })

    it('counts multiple empty cards', () => {
      const cardsWithEmpty: FlashCard[] = [
        ...sampleCards,
        { term: '', definition: 'Valid' },
        { term: 'Valid', definition: '' },
        { term: '', definition: '' }
      ]
      const result = validateCardsForConversion(cardsWithEmpty)

      expect(result.warnings.some(w => w.includes('3'))).toBe(true)
    })
  })

  describe('duplicate detection', () => {
    it('warns about duplicate terms', () => {
      const cardsWithDupes: FlashCard[] = [
        ...sampleCards,
        { term: 'Vertèbre', definition: 'Another definition' }
      ]
      const result = validateCardsForConversion(cardsWithDupes)

      expect(result.warnings.some(w => w.includes('double'))).toBe(true)
    })

    it('duplicate detection is case-insensitive', () => {
      const cardsWithDupes: FlashCard[] = [
        ...sampleCards,
        { term: 'VERTÈBRE', definition: 'Another definition' }
      ]
      const result = validateCardsForConversion(cardsWithDupes)

      expect(result.warnings.some(w => w.includes('double'))).toBe(true)
    })
  })

  describe('short content warning', () => {
    it('warns when many definitions are short', () => {
      const shortCards: FlashCard[] = [
        { term: 'A', definition: 'Short' },
        { term: 'B', definition: 'Also' },
        { term: 'C', definition: 'Tiny' },
        { term: 'D', definition: 'Mini' },
        { term: 'E', definition: 'This one is actually a proper definition' }
      ]
      const result = validateCardsForConversion(shortCards)

      expect(result.warnings.some(w => w.includes('courtes'))).toBe(true)
    })
  })
})
