/**
 * Quality Scoring Service
 * Evaluates question quality based on multiple criteria
 */

import type { Question } from '@/types'

export interface QualityScoreDetails {
  clarity: number        // 0-100: Question clarity and readability
  completeness: number   // 0-100: Has all required fields
  choiceQuality: number  // 0-100: Quality of answer choices
  difficulty: number     // 0-100: Appropriate difficulty distribution
  overall: number        // 0-100: Weighted average
}

export interface QualityIssue {
  type: 'error' | 'warning' | 'info'
  code: string
  message: string
  field?: string
}

export interface QualityResult {
  score: QualityScoreDetails
  issues: QualityIssue[]
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

/**
 * Calculate quality score for a question
 */
export function calculateQualityScore(question: Question): QualityResult {
  const issues: QualityIssue[] = []

  // Calculate individual scores
  const clarity = calculateClarityScore(question, issues)
  const completeness = calculateCompletenessScore(question, issues)
  const choiceQuality = calculateChoiceQualityScore(question, issues)
  const difficulty = calculateDifficultyScore(question, issues)

  // Weighted overall score
  const overall = Math.round(
    clarity * 0.3 +
    completeness * 0.25 +
    choiceQuality * 0.35 +
    difficulty * 0.1
  )

  const score: QualityScoreDetails = {
    clarity,
    completeness,
    choiceQuality,
    difficulty,
    overall
  }

  return {
    score,
    issues,
    grade: getGrade(overall)
  }
}

/**
 * Calculate clarity score
 */
function calculateClarityScore(question: Question, issues: QualityIssue[]): number {
  let score = 100
  const text = question.text

  // Check minimum length
  if (text.length < 20) {
    score -= 30
    issues.push({
      type: 'warning',
      code: 'SHORT_QUESTION',
      message: 'La question est très courte',
      field: 'text'
    })
  }

  // Check for question mark
  if (!text.includes('?')) {
    score -= 10
    issues.push({
      type: 'info',
      code: 'NO_QUESTION_MARK',
      message: 'La question ne contient pas de point d\'interrogation',
      field: 'text'
    })
  }

  // Check for very long questions
  if (text.length > 500) {
    score -= 15
    issues.push({
      type: 'warning',
      code: 'LONG_QUESTION',
      message: 'La question est très longue et pourrait être difficile à lire',
      field: 'text'
    })
  }

  // Check for all caps (shouting)
  if (text === text.toUpperCase() && text.length > 10) {
    score -= 20
    issues.push({
      type: 'warning',
      code: 'ALL_CAPS',
      message: 'La question est entièrement en majuscules',
      field: 'text'
    })
  }

  return Math.max(0, score)
}

/**
 * Calculate completeness score
 */
function calculateCompletenessScore(question: Question, issues: QualityIssue[]): number {
  let score = 100

  // Check required fields
  if (!question.text?.trim()) {
    score -= 50
    issues.push({
      type: 'error',
      code: 'MISSING_TEXT',
      message: 'Le texte de la question est manquant',
      field: 'text'
    })
  }

  if (!question.choices || question.choices.length === 0) {
    score -= 50
    issues.push({
      type: 'error',
      code: 'MISSING_CHOICES',
      message: 'Les choix de réponse sont manquants',
      field: 'choices'
    })
  }

  if (!question.correctAnswer) {
    score -= 30
    issues.push({
      type: 'error',
      code: 'MISSING_CORRECT_ANSWER',
      message: 'La bonne réponse n\'est pas définie',
      field: 'correctAnswer'
    })
  }

  if (!question.theme?.trim()) {
    score -= 10
    issues.push({
      type: 'warning',
      code: 'MISSING_THEME',
      message: 'Le thème n\'est pas défini',
      field: 'theme'
    })
  }

  // Optional but valuable fields
  if (!question.explanation?.trim()) {
    score -= 5
    issues.push({
      type: 'info',
      code: 'MISSING_EXPLANATION',
      message: 'Une explication aiderait les étudiants à comprendre',
      field: 'explanation'
    })
  }

  if (!question.tags || question.tags.length === 0) {
    score -= 3
    issues.push({
      type: 'info',
      code: 'MISSING_TAGS',
      message: 'Des tags faciliteraient la recherche',
      field: 'tags'
    })
  }

  return Math.max(0, score)
}

/**
 * Calculate choice quality score
 */
function calculateChoiceQualityScore(question: Question, issues: QualityIssue[]): number {
  let score = 100
  const choices = question.choices || []

  // Check number of choices
  if (choices.length !== 4) {
    score -= 20
    issues.push({
      type: 'warning',
      code: 'WRONG_CHOICE_COUNT',
      message: `La question a ${choices.length} choix au lieu de 4`,
      field: 'choices'
    })
  }

  // Check for empty choices
  const emptyChoices = choices.filter(c => !c.text?.trim())
  if (emptyChoices.length > 0) {
    score -= 25
    issues.push({
      type: 'error',
      code: 'EMPTY_CHOICES',
      message: `${emptyChoices.length} choix vide(s)`,
      field: 'choices'
    })
  }

  // Check for duplicate choices
  const choiceTexts = choices.map(c => c.text?.toLowerCase().trim())
  const uniqueTexts = new Set(choiceTexts)
  if (uniqueTexts.size < choiceTexts.length) {
    score -= 30
    issues.push({
      type: 'error',
      code: 'DUPLICATE_CHOICES',
      message: 'Certains choix sont identiques',
      field: 'choices'
    })
  }

  // Check choice length uniformity
  const lengths = choices.map(c => c.text?.length || 0)
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length

  if (variance > 1000) { // High variance
    score -= 10
    issues.push({
      type: 'info',
      code: 'UNEVEN_CHOICES',
      message: 'Les longueurs des choix sont très inégales',
      field: 'choices'
    })
  }

  // Check if correct answer exists in choices
  if (question.correctAnswer) {
    const correctChoice = choices.find(c => c.id === question.correctAnswer)
    if (!correctChoice) {
      score -= 40
      issues.push({
        type: 'error',
        code: 'INVALID_CORRECT_ANSWER',
        message: 'La bonne réponse ne correspond à aucun choix',
        field: 'correctAnswer'
      })
    }
  }

  // Check for "All of the above" or "None of the above" patterns
  const suspiciousPatterns = ['toutes les réponses', 'aucune des réponses', 'tout ce qui précède']
  const hasSuspiciousChoice = choices.some(c =>
    suspiciousPatterns.some(pattern => c.text?.toLowerCase().includes(pattern))
  )
  if (hasSuspiciousChoice) {
    score -= 10
    issues.push({
      type: 'warning',
      code: 'LAZY_CHOICE',
      message: 'Évitez "Toutes les réponses" ou "Aucune des réponses"',
      field: 'choices'
    })
  }

  return Math.max(0, score)
}

/**
 * Calculate difficulty score
 */
function calculateDifficultyScore(question: Question, issues: QualityIssue[]): number {
  let score = 100

  if (!question.difficulty) {
    score -= 20
    issues.push({
      type: 'info',
      code: 'MISSING_DIFFICULTY',
      message: 'La difficulté n\'est pas définie',
      field: 'difficulty'
    })
  }

  // Additional heuristics could be added here
  return Math.max(0, score)
}

/**
 * Get letter grade from score
 */
function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

/**
 * Calculate quality scores for multiple questions
 */
export function calculateBatchQuality(questions: Question[]): {
  results: Map<string, QualityResult>
  averageScore: number
  distribution: Record<'A' | 'B' | 'C' | 'D' | 'F', number>
} {
  const results = new Map<string, QualityResult>()
  const distribution: Record<'A' | 'B' | 'C' | 'D' | 'F', number> = {
    A: 0, B: 0, C: 0, D: 0, F: 0
  }

  let totalScore = 0

  for (const question of questions) {
    const result = calculateQualityScore(question)
    results.set(question.id, result)
    totalScore += result.score.overall
    distribution[result.grade]++
  }

  return {
    results,
    averageScore: questions.length > 0 ? Math.round(totalScore / questions.length) : 0,
    distribution
  }
}

/**
 * Get color class for quality score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-warning'
  return 'text-error'
}

/**
 * Get badge color for grade
 */
export function getGradeBadgeClass(grade: 'A' | 'B' | 'C' | 'D' | 'F'): string {
  switch (grade) {
    case 'A': return 'badge-success'
    case 'B': return 'badge-info'
    case 'C': return 'badge-warning'
    case 'D': return 'badge-warning'
    case 'F': return 'badge-error'
  }
}
