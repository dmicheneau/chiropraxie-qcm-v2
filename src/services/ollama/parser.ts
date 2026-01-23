/**
 * AI Response Parser
 * Extracts structured data from AI-generated responses
 */

import type { Question, Choice, Difficulty } from '@/types'
import { generateUUID } from '@/utils'

export interface AIGeneratedQuestion {
  text: string
  choices: { id: string; text: string }[]
  correctAnswer: string
  explanation?: string
  difficulty?: Difficulty
  tags?: string[]
}

export interface ParsedQuestionsResult {
  questions: AIGeneratedQuestion[]
  parseErrors: string[]
  rawResponse: string
}

/**
 * Extract JSON from AI response that may contain surrounding text
 */
export function extractJSON(text: string): string | null {
  // Try to find JSON object or array in the response
  // First try specific patterns, then generic ones
  const patterns = [
    // Match object starting with {"questions":
    /\{"questions"\s*:\s*\[[\s\S]*?\]\s*\}/,
    // Match object starting with {"tags":
    /\{"tags"\s*:\s*\[[\s\S]*?\]\s*\}/,
    // Match object starting with {"explanation":
    /\{"explanation"\s*:\s*"[\s\S]*?"\s*\}/,
    // Match object starting with {"score":
    /\{"score"\s*:\s*\d+[\s\S]*?\}/,
    // Match any JSON object (greedy - use for fallback)
    /\{[\s\S]*\}/,
    // Match any JSON array (for direct arrays like [{...}])
    /\[[\s\S]*\]/
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      // Try to parse to validate it's proper JSON
      try {
        JSON.parse(match[0])
        return match[0]
      } catch {
        // Continue to next pattern
      }
    }
  }

  return null
}

/**
 * Parse AI-generated questions from response text
 */
export function parseAIQuestions(response: string): ParsedQuestionsResult {
  const parseErrors: string[] = []
  const questions: AIGeneratedQuestion[] = []

  // Extract JSON from response
  const jsonStr = extractJSON(response)
  if (!jsonStr) {
    return {
      questions: [],
      parseErrors: ['Impossible d\'extraire le JSON de la réponse IA'],
      rawResponse: response
    }
  }

  try {
    const data = JSON.parse(jsonStr)

    // Handle both array and object with questions property
    const rawQuestions = Array.isArray(data) ? data : data.questions

    if (!Array.isArray(rawQuestions)) {
      return {
        questions: [],
        parseErrors: ['Format de réponse invalide: pas de tableau de questions'],
        rawResponse: response
      }
    }

    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i]

      // Validate required fields
      if (!q.text || typeof q.text !== 'string') {
        parseErrors.push(`Question ${i + 1}: texte manquant ou invalide`)
        continue
      }

      if (!Array.isArray(q.choices) || q.choices.length !== 4) {
        parseErrors.push(`Question ${i + 1}: doit avoir exactement 4 choix`)
        continue
      }

      if (!q.correctAnswer || !['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
        parseErrors.push(`Question ${i + 1}: réponse correcte invalide`)
        continue
      }

      // Validate choices structure
      const validChoices = q.choices.every(
        (c: unknown) =>
          typeof c === 'object' &&
          c !== null &&
          'id' in c &&
          'text' in c &&
          typeof (c as { text: unknown }).text === 'string'
      )

      if (!validChoices) {
        parseErrors.push(`Question ${i + 1}: structure des choix invalide`)
        continue
      }

      // Build validated question
      questions.push({
        text: q.text.trim(),
        choices: q.choices.map((c: { id: string; text: string }) => ({
          id: c.id,
          text: c.text.trim()
        })),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation?.trim(),
        difficulty: validateDifficulty(q.difficulty),
        tags: Array.isArray(q.tags) ? q.tags.filter((t: unknown) => typeof t === 'string') : []
      })
    }
  } catch (error) {
    return {
      questions: [],
      parseErrors: [`Erreur de parsing JSON: ${error instanceof Error ? error.message : 'inconnue'}`],
      rawResponse: response
    }
  }

  return { questions, parseErrors, rawResponse: response }
}

/**
 * Validate difficulty value
 */
function validateDifficulty(value: unknown): Difficulty {
  if (value === 'easy' || value === 'medium' || value === 'hard') {
    return value
  }
  return 'medium' // Default
}

/**
 * Convert AI-generated questions to full Question objects
 */
export function convertToQuestions(
  aiQuestions: AIGeneratedQuestion[],
  theme: string,
  subtheme?: string
): Question[] {
  const now = new Date().toISOString()

  return aiQuestions.map(q => ({
    id: generateUUID(),
    type: 'single_choice' as const,
    text: q.text,
    choices: q.choices as Choice[],
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    theme,
    subtheme,
    difficulty: q.difficulty || 'medium',
    tags: q.tags || [],
    source: 'ai_generated' as const,
    createdAt: now,
    updatedAt: now,
    metadata: {
      qualityScore: undefined,
      timesUsed: 0,
      successRate: undefined
    }
  }))
}

/**
 * Parse tags from AI response
 */
export function parseTags(response: string): string[] {
  const jsonStr = extractJSON(response)
  if (!jsonStr) return []

  try {
    const data = JSON.parse(jsonStr)
    if (Array.isArray(data.tags)) {
      return data.tags.filter((t: unknown) => typeof t === 'string')
    }
  } catch {
    // Ignore parse errors
  }

  return []
}

/**
 * Parse explanation from AI response
 */
export function parseExplanation(response: string): string | null {
  const jsonStr = extractJSON(response)
  if (!jsonStr) return null

  try {
    const data = JSON.parse(jsonStr)
    if (typeof data.explanation === 'string') {
      return data.explanation.trim()
    }
  } catch {
    // Ignore parse errors
  }

  return null
}

/**
 * Parse quality evaluation from AI response
 */
export interface QualityEvaluation {
  score: number
  details: {
    clarity: number
    coherence: number
    plausibility: number
    relevance: number
  }
  issues: string[]
  suggestions: string[]
}

export function parseQualityEvaluation(response: string): QualityEvaluation | null {
  const jsonStr = extractJSON(response)
  if (!jsonStr) return null

  try {
    const data = JSON.parse(jsonStr)

    if (typeof data.score !== 'number') return null

    return {
      score: Math.max(0, Math.min(100, data.score)),
      details: {
        clarity: data.details?.clarity ?? data.score,
        coherence: data.details?.coherence ?? data.score,
        plausibility: data.details?.plausibility ?? data.score,
        relevance: data.details?.relevance ?? data.score
      },
      issues: Array.isArray(data.issues) ? data.issues : [],
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : []
    }
  } catch {
    return null
  }
}
