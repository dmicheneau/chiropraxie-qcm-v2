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
 * Includes basic repair for common AI mistakes
 */
export function extractJSON(text: string): string | null {
  console.log('[Parser] extractJSON called, input length:', text?.length || 0)

  if (!text || text.length === 0) {
    console.log('[Parser] Empty input text')
    return null
  }

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
    // Match object starting with {"theme":
    /\{"theme"\s*:\s*"[\s\S]*?"\s*\}/,
    // Match any JSON object (greedy - use for fallback)
    /\{[\s\S]*\}/,
    // Match any JSON array (for direct arrays like [{...}])
    /\[[\s\S]*\]/,
  ]

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i]
    const match = text.match(pattern)
    if (match) {
      let jsonStr = match[0]
      console.log(`[Parser] Pattern ${i} matched, length: ${jsonStr.length}`)

      // Try to parse as-is first
      try {
        JSON.parse(jsonStr)
        console.log('[Parser] JSON valid as-is')
        return jsonStr
      } catch (e) {
        console.log(
          '[Parser] JSON invalid, attempting repair...',
          (e as Error).message?.slice(0, 100)
        )
        // Try to repair common issues
        jsonStr = repairJSON(jsonStr)
        try {
          JSON.parse(jsonStr)
          console.log('[Parser] JSON repaired successfully')
          return jsonStr
        } catch (e2) {
          console.log('[Parser] Repair failed:', (e2 as Error).message?.slice(0, 100))
          // Continue to next pattern
        }
      }
    }
  }

  console.log('[Parser] No valid JSON found in response')
  return null
}

/**
 * Attempt to repair common JSON issues from AI responses
 */
function repairJSON(text: string): string {
  let repaired = text

  // Fix missing "text": key in choices (common AI mistake)
  // Pattern: {"id": "D", "Some text"} -> {"id": "D", "text": "Some text"}
  repaired = repaired.replace(
    /\{"id"\s*:\s*"([A-D])"\s*,\s*"([^"]+)"\s*\}/g,
    '{"id": "$1", "text": "$2"}'
  )

  // Fix missing "text": key with lowercase id
  repaired = repaired.replace(
    /\{"id"\s*:\s*"([a-d])"\s*,\s*"([^"]+)"\s*\}/gi,
    '{"id": "$1", "text": "$2"}'
  )

  // Fix trailing commas before closing brackets
  repaired = repaired.replace(/,\s*\]/g, ']')
  repaired = repaired.replace(/,\s*\}/g, '}')

  // Fix escaped quotes that shouldn't be (but be careful not to break valid escapes)
  // Only unescape if it's clearly wrong
  repaired = repaired.replace(/([^\\])\\"/g, '$1"')

  // Fix single quotes used instead of double quotes for strings
  // This is risky, so only do it if there are no double quotes in the vicinity
  // repaired = repaired.replace(/'/g, '"') // Too risky, disabled

  // Fix newlines in strings (replace with space)
  repaired = repaired.replace(/:\s*"([^"]*)\n([^"]*)"/g, ': "$1 $2"')

  // Log repair attempts in debug mode
  if (repaired !== text) {
    console.log('[Parser] JSON repaired, changes made')
  }

  return repaired
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
      parseErrors: [
        "Impossible d'extraire le JSON de la réponse IA. Réponse brute: " + response.slice(0, 200),
      ],
      rawResponse: response,
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
        rawResponse: response,
      }
    }

    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i]

      // Validate required fields
      if (!q.text || typeof q.text !== 'string') {
        parseErrors.push(`Question ${i + 1}: texte manquant ou invalide`)
        continue
      }

      // Be more flexible with choices validation
      if (!Array.isArray(q.choices)) {
        parseErrors.push(`Question ${i + 1}: pas de choix fournis`)
        continue
      }

      if (q.choices.length < 2) {
        parseErrors.push(`Question ${i + 1}: doit avoir au moins 2 choix`)
        continue
      }

      // Normalize correctAnswer - accept both letter and index
      let correctAnswer = q.correctAnswer
      if (typeof correctAnswer === 'number' || /^\d+$/.test(String(correctAnswer))) {
        // Convert index to letter (0 -> A, 1 -> B, etc.)
        const index = Number(correctAnswer)
        correctAnswer = String.fromCharCode(65 + index) // 65 = 'A'
      }

      if (!correctAnswer || !['A', 'B', 'C', 'D'].includes(String(correctAnswer).toUpperCase())) {
        parseErrors.push(`Question ${i + 1}: réponse correcte invalide (${q.correctAnswer})`)
        continue
      }
      correctAnswer = String(correctAnswer).toUpperCase()

      // Validate and normalize choices structure
      const normalizedChoices: { id: string; text: string }[] = []
      let choicesValid = true

      for (let j = 0; j < q.choices.length && j < 4; j++) {
        const c = q.choices[j]
        const expectedId = String.fromCharCode(65 + j) // A, B, C, D

        if (typeof c === 'string') {
          // Simple string choice - convert to object
          normalizedChoices.push({ id: expectedId, text: c })
        } else if (typeof c === 'object' && c !== null) {
          // Object choice
          const text =
            c.text ||
            c.label ||
            c.content ||
            Object.values(c).find(v => typeof v === 'string' && v !== c.id)
          if (text && typeof text === 'string') {
            normalizedChoices.push({ id: c.id || expectedId, text: text.trim() })
          } else {
            parseErrors.push(`Question ${i + 1}: choix ${expectedId} mal formé`)
            choicesValid = false
            break
          }
        } else {
          parseErrors.push(`Question ${i + 1}: choix ${expectedId} invalide`)
          choicesValid = false
          break
        }
      }

      if (!choicesValid || normalizedChoices.length < 2) {
        continue
      }

      // Pad to 4 choices if needed (for consistency)
      while (normalizedChoices.length < 4) {
        const id = String.fromCharCode(65 + normalizedChoices.length)
        normalizedChoices.push({ id, text: `Option ${id}` })
        parseErrors.push(`Question ${i + 1}: choix ${id} ajouté automatiquement (manquant)`)
      }

      // Build validated question
      questions.push({
        text: q.text.trim(),
        choices: normalizedChoices,
        correctAnswer,
        explanation: q.explanation?.trim(),
        difficulty: validateDifficulty(q.difficulty),
        tags: Array.isArray(q.tags) ? q.tags.filter((t: unknown) => typeof t === 'string') : [],
      })
    }
  } catch (error) {
    return {
      questions: [],
      parseErrors: [
        `Erreur de parsing JSON: ${error instanceof Error ? error.message : 'inconnue'}`,
      ],
      rawResponse: response,
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
      successRate: undefined,
    },
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
        relevance: data.details?.relevance ?? data.score,
      },
      issues: Array.isArray(data.issues) ? data.issues : [],
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    }
  } catch {
    return null
  }
}
