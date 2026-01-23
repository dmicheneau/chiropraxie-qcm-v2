/**
 * Converter - Transform flashcards to QCM questions
 */

import type { FlashCard } from './quizlet'
import type { Question, Choice, Difficulty, QuestionSource } from '@/types'
import { generateUUID, shuffleArray } from '@/utils'

export type ConversionMode = 'term-to-question' | 'definition-to-question'

export interface ConversionOptions {
  mode: ConversionMode
  theme: string
  subtheme?: string
  difficulty: Difficulty
  shuffleChoices: boolean
  source?: QuestionSource
}

export interface ConversionResult {
  questions: Question[]
  skipped: number
  warnings: string[]
}

/**
 * Convert flashcards to QCM questions
 * Requires minimum 4 flashcards to generate proper wrong answers
 */
export function convertFlashcardsToQuestions(
  cards: FlashCard[],
  options: ConversionOptions
): ConversionResult {
  const warnings: string[] = []
  
  if (cards.length < 4) {
    return {
      questions: [],
      skipped: cards.length,
      warnings: ['Minimum 4 flashcards requis pour générer des QCM (besoin de 3 mauvaises réponses)']
    }
  }

  const questions: Question[] = []
  let skipped = 0

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    
    // Skip cards with empty term or definition
    if (!card.term.trim() || !card.definition.trim()) {
      skipped++
      continue
    }

    try {
      const question = convertSingleCard(card, i, cards, options)
      questions.push(question)
    } catch (error) {
      skipped++
      warnings.push(`Carte ${i + 1} ignorée: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  return { questions, skipped, warnings }
}

/**
 * Convert a single flashcard to a question
 */
function convertSingleCard(
  card: FlashCard,
  index: number,
  allCards: FlashCard[],
  options: ConversionOptions
): Question {
  const { mode, theme, subtheme, difficulty, shuffleChoices, source = 'quizlet' } = options

  // Determine question text and correct answer based on mode
  const questionText = mode === 'term-to-question'
    ? `Quelle est la définition de « ${card.term} » ?`
    : `Quel terme correspond à cette définition ?\n\n« ${card.definition} »`

  const correctAnswerText = mode === 'term-to-question'
    ? card.definition
    : card.term

  // Generate 3 wrong answers from other cards
  const wrongAnswers = generateWrongAnswers(allCards, index, mode)

  // Create choices with correct answer at position A
  let choices: Choice[] = [
    { id: 'A', text: correctAnswerText },
    { id: 'B', text: wrongAnswers[0] },
    { id: 'C', text: wrongAnswers[1] },
    { id: 'D', text: wrongAnswers[2] }
  ]

  // Track correct answer ID before shuffling
  let correctAnswerId = 'A'

  // Shuffle choices if requested
  if (shuffleChoices) {
    const shuffledChoices = shuffleArray(choices)
    // Find new position of correct answer and reassign IDs
    choices = shuffledChoices.map((choice, idx) => {
      const newId = String.fromCharCode(65 + idx) // A, B, C, D
      if (choice.text === correctAnswerText) {
        correctAnswerId = newId
      }
      return { id: newId, text: choice.text }
    })
  }

  const now = new Date().toISOString()

  return {
    id: generateUUID(),
    type: 'single_choice',
    text: questionText,
    choices,
    correctAnswer: correctAnswerId,
    theme,
    subtheme,
    difficulty,
    tags: [],
    source,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * Generate 3 wrong answers by picking from other flashcards
 */
function generateWrongAnswers(
  cards: FlashCard[],
  currentIndex: number,
  mode: ConversionMode
): [string, string, string] {
  // Get all other cards
  const otherCards = cards.filter((_, i) => i !== currentIndex)

  // Shuffle and pick 3
  const shuffled = shuffleArray(otherCards)
  const selected = shuffled.slice(0, 3)

  // Return the appropriate field based on mode
  const answers = selected.map(card =>
    mode === 'term-to-question' ? card.definition : card.term
  )

  // Ensure we have exactly 3 (pad with placeholders if needed)
  while (answers.length < 3) {
    answers.push(`Option ${answers.length + 2}`)
  }

  return answers.slice(0, 3) as [string, string, string]
}

/**
 * Validate that cards are suitable for conversion
 */
export function validateCardsForConversion(cards: FlashCard[]): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (cards.length < 4) {
    errors.push(`Minimum 4 flashcards requis. Actuellement: ${cards.length}`)
  }

  // Check for empty cards
  const emptyCards = cards.filter(c => !c.term.trim() || !c.definition.trim())
  if (emptyCards.length > 0) {
    warnings.push(`${emptyCards.length} carte(s) vide(s) seront ignorées`)
  }

  // Check for duplicates
  const terms = cards.map(c => c.term.toLowerCase().trim())
  const uniqueTerms = new Set(terms)
  if (uniqueTerms.size < terms.length) {
    warnings.push(`${terms.length - uniqueTerms.size} terme(s) en double détecté(s)`)
  }

  // Check for very short answers (might generate confusing questions)
  const shortAnswers = cards.filter(c => 
    c.term.length < 3 || c.definition.length < 10
  )
  if (shortAnswers.length > cards.length * 0.3) {
    warnings.push('Beaucoup de définitions courtes. Les questions pourraient être ambiguës.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
