/**
 * Export/Import Service
 * Handles JSON export and import of question banks
 */

import { z } from 'zod'
import type { QuestionBank, Question } from '@/types'
import { generateUUID } from '@/utils'

// =========================================
// Export Format Schema
// =========================================

export interface ExportFormat {
  version: '2.0'
  exportedAt: string
  banks: QuestionBank[]
  metadata: {
    totalQuestions: number
    themes: string[]
    exportedBy: string
  }
}

// =========================================
// Import Validation Schemas
// =========================================

const ChoiceSchema = z.object({
  id: z.string(),
  text: z.string()
})

const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['single_choice', 'multiple_choice', 'true_false']),
  text: z.string().min(1),
  choices: z.array(ChoiceSchema).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string().optional(),
  theme: z.string(),
  subtheme: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string()),
  source: z.enum(['manual', 'quizlet', 'ai_generated', 'pdf_import', 'image_import']),
  sourceUrl: z.string().optional(),
  aiPrompt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  metadata: z.object({
    qualityScore: z.number().optional(),
    timesUsed: z.number().optional(),
    successRate: z.number().optional()
  }).optional()
})

const QuestionBankSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  questions: z.array(QuestionSchema),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  metadata: z.object({
    totalQuestions: z.number(),
    themes: z.array(z.string()),
    sources: z.record(z.number())
  })
})

const ExportFormatSchema = z.object({
  version: z.literal('2.0'),
  exportedAt: z.string(),
  banks: z.array(QuestionBankSchema),
  metadata: z.object({
    totalQuestions: z.number(),
    themes: z.array(z.string()),
    exportedBy: z.string()
  })
})

// =========================================
// Export Functions
// =========================================

/**
 * Export question banks to JSON format
 */
export function exportBanksToJSON(banks: QuestionBank[]): ExportFormat {
  // Calculate metadata
  const allQuestions = banks.flatMap(b => b.questions)
  const themes = [...new Set(allQuestions.map(q => q.theme))]

  const exportData: ExportFormat = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    banks,
    metadata: {
      totalQuestions: allQuestions.length,
      themes,
      exportedBy: 'Chiropraxie QCM V2'
    }
  }

  return exportData
}

/**
 * Download export as JSON file
 */
export function downloadExportFile(data: ExportFormat, filename?: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename || `chiropraxie-qcm-export-${formatDate(new Date())}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Format date for filename
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// =========================================
// Import Functions
// =========================================

export type ConflictStrategy = 'skip' | 'replace' | 'merge'

export interface ImportResult {
  success: boolean
  banks: QuestionBank[]
  questionsImported: number
  questionsSkipped: number
  errors: string[]
  warnings: string[]
}

/**
 * Read and parse JSON file
 */
export async function readJSONFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        resolve(json)
      } catch {
        reject(new Error('Le fichier n\'est pas un JSON valide'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * Validate import data against schema
 */
export function validateImportData(data: unknown): { 
  valid: boolean
  data?: ExportFormat
  errors: string[] 
} {
  const result = ExportFormatSchema.safeParse(data)
  
  if (!result.success) {
    const errors = result.error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    )
    return { valid: false, errors }
  }

  return { valid: true, data: result.data, errors: [] }
}

/**
 * Import banks from validated data with conflict handling
 */
export function processImport(
  importData: ExportFormat,
  existingBanks: QuestionBank[],
  strategy: ConflictStrategy
): ImportResult {
  const errors: string[] = []
  const warnings: string[] = []
  const resultBanks: QuestionBank[] = []
  let questionsImported = 0
  let questionsSkipped = 0

  // Create map of existing banks by ID
  const existingBanksMap = new Map(existingBanks.map(b => [b.id, b]))

  for (const importBank of importData.banks) {
    const existingBank = existingBanksMap.get(importBank.id)

    if (existingBank) {
      // Bank exists - apply conflict strategy
      switch (strategy) {
        case 'skip':
          warnings.push(`Banque "${importBank.name}" ignorée (existe déjà)`)
          questionsSkipped += importBank.questions.length
          break

        case 'replace':
          // Replace entire bank
          resultBanks.push({
            ...importBank,
            id: existingBank.id, // Keep existing ID
            updatedAt: new Date().toISOString()
          })
          questionsImported += importBank.questions.length
          warnings.push(`Banque "${importBank.name}" remplacée`)
          break

        case 'merge': {
          // Merge questions, avoiding duplicates
          const mergedBank = mergeQuestionBanks(existingBank, importBank)
          resultBanks.push(mergedBank.bank)
          questionsImported += mergedBank.added
          questionsSkipped += mergedBank.skipped
          if (mergedBank.skipped > 0) {
            warnings.push(`${mergedBank.skipped} question(s) doublon(s) ignorée(s) dans "${importBank.name}"`)
          }
          break
        }
      }
    } else {
      // New bank - add with new ID
      const newBank: QuestionBank = {
        ...importBank,
        id: generateUUID(),
        questions: importBank.questions.map(q => ({
          ...q,
          id: generateUUID()
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      resultBanks.push(newBank)
      questionsImported += newBank.questions.length
    }
  }

  return {
    success: errors.length === 0,
    banks: resultBanks,
    questionsImported,
    questionsSkipped,
    errors,
    warnings
  }
}

/**
 * Merge two question banks
 */
function mergeQuestionBanks(
  existing: QuestionBank,
  imported: QuestionBank
): { bank: QuestionBank; added: number; skipped: number } {
  const existingTexts = new Set(existing.questions.map(q => normalizeText(q.text)))
  const newQuestions: Question[] = []
  let skipped = 0

  for (const question of imported.questions) {
    const normalizedText = normalizeText(question.text)
    
    if (existingTexts.has(normalizedText)) {
      skipped++
    } else {
      newQuestions.push({
        ...question,
        id: generateUUID()
      })
      existingTexts.add(normalizedText)
    }
  }

  const mergedBank: QuestionBank = {
    ...existing,
    questions: [...existing.questions, ...newQuestions],
    updatedAt: new Date().toISOString(),
    metadata: {
      ...existing.metadata,
      totalQuestions: existing.questions.length + newQuestions.length,
      themes: [...new Set([
        ...(existing.metadata?.themes || []),
        ...newQuestions.map(q => q.theme)
      ])]
    }
  }

  return { bank: mergedBank, added: newQuestions.length, skipped }
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Validate JSON file before import
 */
export function validateJSONFile(file: File): { valid: boolean; error?: string } {
  // Check MIME type
  if (file.type !== 'application/json' && !file.name.toLowerCase().endsWith('.json')) {
    return { valid: false, error: 'Le fichier doit être au format JSON' }
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: 'Le fichier est trop volumineux (max 10 Mo)' }
  }

  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: 'Le fichier est vide' }
  }

  return { valid: true }
}
