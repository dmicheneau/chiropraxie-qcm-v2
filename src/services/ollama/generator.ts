/**
 * Question Generation Service
 * High-level service for generating questions using Ollama
 */

import { ollamaService } from './service'
import {
  generateQuestionsPrompt,
  generateTagsPrompt,
  generateExplanationPrompt,
  detectThemePrompt,
} from './prompts'
import {
  parseAIQuestions,
  convertToQuestions,
  parseTags,
  parseExplanation,
  type AIGeneratedQuestion,
} from './parser'
import type { Question } from '@/types'

export interface GenerationOptions {
  theme: string
  subtheme?: string
  count?: number
}

export interface GenerationResult {
  questions: Question[]
  aiQuestions: AIGeneratedQuestion[]
  parseErrors: string[]
  generationTime: number
  rawResponse: string
}

export interface GenerationProgress {
  status: 'starting' | 'generating' | 'parsing' | 'complete' | 'error'
  message: string
  progress?: number
}

/**
 * Generate questions from source text using AI
 */
export async function generateQuestions(
  sourceText: string,
  options: GenerationOptions,
  onProgress?: (progress: GenerationProgress) => void
): Promise<GenerationResult> {
  const startTime = performance.now()
  const count = options.count ?? 10

  try {
    // Notify starting
    onProgress?.({
      status: 'starting',
      message: 'Connexion à Ollama...',
      progress: 0,
    })

    // Check if Ollama is available
    const available = await ollamaService.isAvailable()
    if (!available) {
      throw new Error(
        'Ollama n\'est pas disponible. Vérifiez qu\'il est démarré avec "ollama serve".'
      )
    }

    // Generate prompt
    const prompt = generateQuestionsPrompt(sourceText, count)

    // Notify generating
    onProgress?.({
      status: 'generating',
      message: `Génération de ${count} questions en cours...`,
      progress: 20,
    })

    // Generate response
    console.log('[Ollama] Starting generation with prompt length:', prompt.length)
    const response = await ollamaService.generate(prompt)

    // Debug logging
    console.log('[Ollama] Raw response length:', response?.length || 0)
    console.log('[Ollama] Raw response preview:', response?.slice(0, 800))
    console.log('[Ollama] Raw response end:', response?.slice(-200))

    if (!response || response.length === 0) {
      throw new Error('Ollama a retourné une réponse vide')
    }

    // Notify parsing
    onProgress?.({
      status: 'parsing',
      message: 'Analyse des questions générées...',
      progress: 80,
    })

    // Parse response
    console.log('[Ollama] Starting parse...')
    const parsed = parseAIQuestions(response)

    // Debug logging
    console.log('[Ollama] Parsed questions count:', parsed.questions.length)
    console.log('[Ollama] Parse errors:', parsed.parseErrors)
    if (parsed.questions.length === 0) {
      console.log('[Ollama] Full raw response for debugging:', response)
    }

    // Convert to Question objects
    const questions = convertToQuestions(parsed.questions, options.theme, options.subtheme)

    // Notify complete
    onProgress?.({
      status: 'complete',
      message: `${questions.length} questions générées avec succès`,
      progress: 100,
    })

    return {
      questions,
      aiQuestions: parsed.questions,
      parseErrors: parsed.parseErrors,
      generationTime: performance.now() - startTime,
      rawResponse: response,
    }
  } catch (error) {
    onProgress?.({
      status: 'error',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
    })

    throw error
  }
}

/**
 * Generate tags for a question using AI
 */
export async function generateTagsForQuestion(questionText: string): Promise<string[]> {
  try {
    const prompt = generateTagsPrompt(questionText)
    const response = await ollamaService.generate(prompt, { maxTokens: 200 })
    return parseTags(response)
  } catch {
    return []
  }
}

/**
 * Generate explanation for a question using AI
 */
export async function generateExplanationForQuestion(
  questionText: string,
  correctAnswer: string,
  incorrectAnswers: string[]
): Promise<string | null> {
  try {
    const prompt = generateExplanationPrompt(questionText, correctAnswer, incorrectAnswers)
    const response = await ollamaService.generate(prompt, { maxTokens: 300 })
    return parseExplanation(response)
  } catch {
    return null
  }
}

/**
 * Batch generate explanations for questions without them
 */
export async function generateMissingExplanations(
  questions: Question[],
  onProgress?: (current: number, total: number) => void
): Promise<Question[]> {
  const result: Question[] = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]

    if (q.explanation) {
      result.push(q)
      continue
    }

    onProgress?.(i + 1, questions.length)

    const correctChoice = q.choices?.find(c => c.id === q.correctAnswer)
    const incorrectChoices = q.choices?.filter(c => c.id !== q.correctAnswer) || []

    if (correctChoice) {
      const explanation = await generateExplanationForQuestion(
        q.text,
        correctChoice.text,
        incorrectChoices.map(c => c.text)
      )

      result.push({
        ...q,
        explanation: explanation || undefined,
      })
    } else {
      result.push(q)
    }
  }

  return result
}

/**
 * Batch generate tags for questions without them
 */
export async function generateMissingTags(
  questions: Question[],
  onProgress?: (current: number, total: number) => void
): Promise<Question[]> {
  const result: Question[] = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]

    if (q.tags && q.tags.length > 0) {
      result.push(q)
      continue
    }

    onProgress?.(i + 1, questions.length)

    const tags = await generateTagsForQuestion(q.text)

    result.push({
      ...q,
      tags: tags.length > 0 ? tags : q.tags,
    })
  }

  return result
}

/**
 * Theme detection result
 */
export interface ThemeDetectionResult {
  theme: string
  subtheme?: string
  confidence: number
}

/**
 * Default themes available in the application
 */
export const AVAILABLE_THEMES = [
  'Anatomie',
  'Neurologie',
  'Chiropraxie',
  'Techniques',
  'Pathologie',
  'Sécurité',
  'Biomécanique',
  'Examen clinique',
  'Imagerie',
  'Pharmacologie',
] as const

/**
 * Detect theme from source text using AI
 */
export async function detectTheme(sourceText: string): Promise<ThemeDetectionResult> {
  try {
    const prompt = detectThemePrompt(sourceText)
    const response = await ollamaService.generate(prompt, { maxTokens: 200 })

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { theme: AVAILABLE_THEMES[0], confidence: 0 }
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate theme is in our list
    const validTheme = AVAILABLE_THEMES.find(t => t.toLowerCase() === parsed.theme?.toLowerCase())

    return {
      theme: validTheme || AVAILABLE_THEMES[0],
      subtheme: parsed.subtheme || undefined,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50,
    }
  } catch {
    // Fallback to first theme if detection fails
    return { theme: AVAILABLE_THEMES[0], confidence: 0 }
  }
}
