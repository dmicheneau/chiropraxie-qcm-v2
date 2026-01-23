/**
 * Export/Import Service Tests
 */

import { describe, it, expect } from 'vitest'
import {
  exportBanksToJSON,
  validateImportData,
  processImport,
  validateJSONFile,
  type ExportFormat
} from '@/services/export'
import type { QuestionBank, Question } from '@/types'

// Mock question for testing
const createMockQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 'q1',
  type: 'single_choice',
  text: 'Quelle est la capitale de la France?',
  choices: [
    { id: 'A', text: 'Paris' },
    { id: 'B', text: 'Lyon' },
    { id: 'C', text: 'Marseille' },
    { id: 'D', text: 'Toulouse' }
  ],
  correctAnswer: 'A',
  theme: 'Anatomie',
  difficulty: 'medium',
  tags: ['test'],
  source: 'manual',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides
})

// Mock bank for testing
const createMockBank = (overrides: Partial<QuestionBank> = {}): QuestionBank => ({
  id: 'bank1',
  name: 'Banque de test',
  description: 'Description de test',
  questions: [createMockQuestion()],
  isDefault: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  metadata: {
    totalQuestions: 1,
    themes: ['Anatomie'],
    sources: { manual: 1, quizlet: 0, ai_generated: 0, pdf_import: 0, image_import: 0 }
  },
  ...overrides
})

describe('Export Service', () => {
  describe('exportBanksToJSON', () => {
    it('should export banks with correct format', () => {
      const banks = [createMockBank()]
      const result = exportBanksToJSON(banks)

      expect(result.version).toBe('2.0')
      expect(result.banks).toHaveLength(1)
      expect(result.banks[0].name).toBe('Banque de test')
      expect(result.metadata.totalQuestions).toBe(1)
      expect(result.metadata.themes).toContain('Anatomie')
      expect(result.metadata.exportedBy).toBe('Chiropraxie QCM V2')
    })

    it('should include exportedAt timestamp', () => {
      const banks = [createMockBank()]
      const before = new Date().toISOString()
      const result = exportBanksToJSON(banks)
      const after = new Date().toISOString()

      expect(result.exportedAt >= before).toBe(true)
      expect(result.exportedAt <= after).toBe(true)
    })

    it('should handle empty banks array', () => {
      const result = exportBanksToJSON([])

      expect(result.banks).toHaveLength(0)
      expect(result.metadata.totalQuestions).toBe(0)
      expect(result.metadata.themes).toHaveLength(0)
    })

    it('should aggregate themes from all banks', () => {
      const banks = [
        createMockBank({ id: 'b1', questions: [createMockQuestion({ theme: 'Anatomie' })] }),
        createMockBank({ id: 'b2', questions: [createMockQuestion({ id: 'q2', theme: 'Neurologie' })] })
      ]
      const result = exportBanksToJSON(banks)

      expect(result.metadata.themes).toContain('Anatomie')
      expect(result.metadata.themes).toContain('Neurologie')
    })

    it('should calculate total questions from all banks', () => {
      const banks = [
        createMockBank({ 
          id: 'b1', 
          questions: [createMockQuestion(), createMockQuestion({ id: 'q2' })] 
        }),
        createMockBank({ 
          id: 'b2', 
          questions: [createMockQuestion({ id: 'q3' })] 
        })
      ]
      const result = exportBanksToJSON(banks)

      expect(result.metadata.totalQuestions).toBe(3)
    })
  })
})

describe('Import Validation', () => {
  describe('validateImportData', () => {
    it('should validate correct export format', () => {
      const validData: ExportFormat = {
        version: '2.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        banks: [createMockBank()],
        metadata: {
          totalQuestions: 1,
          themes: ['Anatomie'],
          exportedBy: 'Chiropraxie QCM V2'
        }
      }

      const result = validateImportData(validData)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject missing version', () => {
      const invalidData = {
        exportedAt: '2024-01-01T00:00:00.000Z',
        banks: [],
        metadata: { totalQuestions: 0, themes: [], exportedBy: 'Test' }
      }

      const result = validateImportData(invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject wrong version', () => {
      const invalidData = {
        version: '1.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        banks: [],
        metadata: { totalQuestions: 0, themes: [], exportedBy: 'Test' }
      }

      const result = validateImportData(invalidData)
      expect(result.valid).toBe(false)
    })

    it('should reject invalid question type', () => {
      const invalidData: ExportFormat = {
        version: '2.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        banks: [createMockBank({
          questions: [{
            ...createMockQuestion(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: 'invalid_type' as any
          }]
        })],
        metadata: { totalQuestions: 1, themes: ['Anatomie'], exportedBy: 'Test' }
      }

      const result = validateImportData(invalidData)
      expect(result.valid).toBe(false)
    })

    it('should reject invalid difficulty', () => {
      const invalidData: ExportFormat = {
        version: '2.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        banks: [createMockBank({
          questions: [{
            ...createMockQuestion(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            difficulty: 'super_hard' as any
          }]
        })],
        metadata: { totalQuestions: 1, themes: ['Anatomie'], exportedBy: 'Test' }
      }

      const result = validateImportData(invalidData)
      expect(result.valid).toBe(false)
    })

    it('should accept empty banks array', () => {
      const validData: ExportFormat = {
        version: '2.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        banks: [],
        metadata: { totalQuestions: 0, themes: [], exportedBy: 'Test' }
      }

      const result = validateImportData(validData)
      expect(result.valid).toBe(true)
    })
  })

  describe('validateJSONFile', () => {
    it('should accept valid JSON file', () => {
      const file = new File(['{}'], 'test.json', { type: 'application/json' })
      const result = validateJSONFile(file)
      expect(result.valid).toBe(true)
    })

    it('should reject non-JSON files', () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
      const result = validateJSONFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('JSON')
    })

    it('should reject files larger than 10MB', () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024)
      const file = new File([largeContent], 'large.json', { type: 'application/json' })
      const result = validateJSONFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('volumineux')
    })

    it('should reject empty files', () => {
      const file = new File([], 'empty.json', { type: 'application/json' })
      const result = validateJSONFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('vide')
    })

    it('should accept .json extension even without mime type', () => {
      const file = new File(['{}'], 'test.json', { type: '' })
      const result = validateJSONFile(file)
      expect(result.valid).toBe(true)
    })
  })
})

describe('Import Processing', () => {
  describe('processImport with skip strategy', () => {
    it('should skip existing banks', () => {
      const importData: ExportFormat = {
        version: '2.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        banks: [createMockBank({ id: 'existing-bank' })],
        metadata: { totalQuestions: 1, themes: ['Anatomie'], exportedBy: 'Test' }
      }

      const existingBanks = [createMockBank({ id: 'existing-bank' })]
      const result = processImport(importData, existingBanks, 'skip')

      expect(result.success).toBe(true)
      expect(result.banks).toHaveLength(0)
      expect(result.questionsSkipped).toBe(1)
      expect(result.warnings.some(w => w.includes('ignorée'))).toBe(true)
    })

    it('should add new banks', () => {
      const importData: ExportFormat = {
        version: '2.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        banks: [createMockBank({ id: 'new-bank', name: 'Nouvelle banque' })],
        metadata: { totalQuestions: 1, themes: ['Anatomie'], exportedBy: 'Test' }
      }

      const existingBanks = [createMockBank({ id: 'other-bank' })]
      const result = processImport(importData, existingBanks, 'skip')

      expect(result.success).toBe(true)
      expect(result.banks).toHaveLength(1)
      expect(result.questionsImported).toBe(1)
    })
  })

  describe('processImport with replace strategy', () => {
    it('should replace existing banks', () => {
      const newQuestion = createMockQuestion({ id: 'new-q', text: 'Nouvelle question' })
      const importData: ExportFormat = {
        version: '2.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        banks: [createMockBank({ id: 'existing-bank', questions: [newQuestion] })],
        metadata: { totalQuestions: 1, themes: ['Anatomie'], exportedBy: 'Test' }
      }

      const existingBanks = [createMockBank({ id: 'existing-bank' })]
      const result = processImport(importData, existingBanks, 'replace')

      expect(result.success).toBe(true)
      expect(result.banks).toHaveLength(1)
      expect(result.questionsImported).toBe(1)
      expect(result.warnings.some(w => w.includes('remplacée'))).toBe(true)
    })
  })

  describe('processImport with merge strategy', () => {
    it('should merge questions avoiding duplicates', () => {
      const existingQuestion = createMockQuestion({ id: 'q1', text: 'Question existante' })
      const newQuestion = createMockQuestion({ id: 'q2', text: 'Nouvelle question' })
      const duplicateQuestion = createMockQuestion({ id: 'q3', text: 'Question existante' }) // Same text

      const importData: ExportFormat = {
        version: '2.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        banks: [createMockBank({ 
          id: 'existing-bank', 
          questions: [newQuestion, duplicateQuestion] 
        })],
        metadata: { totalQuestions: 2, themes: ['Anatomie'], exportedBy: 'Test' }
      }

      const existingBanks = [createMockBank({ 
        id: 'existing-bank', 
        questions: [existingQuestion] 
      })]
      const result = processImport(importData, existingBanks, 'merge')

      expect(result.success).toBe(true)
      expect(result.banks).toHaveLength(1)
      expect(result.questionsImported).toBe(1) // Only the truly new question
      expect(result.questionsSkipped).toBe(1) // The duplicate
    })

    it('should handle case-insensitive duplicate detection', () => {
      const existingQuestion = createMockQuestion({ text: 'Question Test' })
      const duplicateQuestion = createMockQuestion({ id: 'q2', text: 'question test' }) // Different case

      const importData: ExportFormat = {
        version: '2.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        banks: [createMockBank({ 
          id: 'existing-bank', 
          questions: [duplicateQuestion] 
        })],
        metadata: { totalQuestions: 1, themes: ['Anatomie'], exportedBy: 'Test' }
      }

      const existingBanks = [createMockBank({ 
        id: 'existing-bank', 
        questions: [existingQuestion] 
      })]
      const result = processImport(importData, existingBanks, 'merge')

      expect(result.questionsSkipped).toBe(1)
    })
  })

  describe('processImport with new banks', () => {
    it('should generate new IDs for imported banks and questions', () => {
      const importData: ExportFormat = {
        version: '2.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        banks: [createMockBank({ id: 'original-id' })],
        metadata: { totalQuestions: 1, themes: ['Anatomie'], exportedBy: 'Test' }
      }

      const result = processImport(importData, [], 'skip')

      expect(result.banks).toHaveLength(1)
      expect(result.banks[0].id).not.toBe('original-id')
      expect(result.banks[0].questions[0].id).not.toBe('q1')
    })

    it('should update timestamps for new banks', () => {
      const oldDate = '2020-01-01T00:00:00.000Z'
      const importData: ExportFormat = {
        version: '2.0',
        exportedAt: oldDate,
        banks: [createMockBank({ createdAt: oldDate, updatedAt: oldDate })],
        metadata: { totalQuestions: 1, themes: ['Anatomie'], exportedBy: 'Test' }
      }

      const before = new Date().toISOString()
      const result = processImport(importData, [], 'skip')

      expect(result.banks[0].createdAt >= before).toBe(true)
      expect(result.banks[0].updatedAt >= before).toBe(true)
    })
  })
})
