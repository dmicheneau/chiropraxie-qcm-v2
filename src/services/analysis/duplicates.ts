/**
 * Duplicate Detection Service
 * Detects similar questions using Jaccard and Levenshtein algorithms
 */

import type { Question } from '@/types'

export interface DuplicateMatch {
  questionId: string
  questionText: string
  similarity: number
  matchType: 'exact' | 'high' | 'medium'
}

export interface DuplicateCheckResult {
  isDuplicate: boolean
  matches: DuplicateMatch[]
  bestMatch: DuplicateMatch | null
}

/**
 * Tokenize text for comparison (French-aware)
 */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      // Normalize French accents for comparison
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Remove punctuation
      .replace(/[^\w\s]/g, ' ')
      // Split into words
      .split(/\s+/)
      // Remove short words and stopwords
      .filter(word => word.length > 2)
      .filter(word => !FRENCH_STOPWORDS.has(word))
  )
}

/**
 * French stopwords to ignore in comparison
 */
const FRENCH_STOPWORDS = new Set([
  'les', 'des', 'une', 'est', 'que', 'qui', 'dans', 'pour', 'sur',
  'par', 'pas', 'son', 'sont', 'mais', 'avec', 'sans', 'cette',
  'aux', 'leurs', 'quel', 'quelle', 'quels', 'quelles', 'peut',
  'entre', 'tous', 'tout', 'plus', 'moins', 'comme', 'etre', 'avoir',
  'fait', 'faire', 'elle', 'lui', 'nous', 'vous', 'ils', 'elles'
])

/**
 * Calculate Jaccard similarity between two sets
 * Returns value between 0 and 1
 */
export function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 1

  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])

  return intersection.size / union.size
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length

  // Create matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // Deletion
        dp[i][j - 1] + 1,      // Insertion
        dp[i - 1][j - 1] + cost // Substitution
      )
    }
  }

  return dp[m][n]
}

/**
 * Calculate Levenshtein similarity (normalized to 0-1)
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1

  const distance = levenshteinDistance(str1, str2)
  return 1 - distance / maxLen
}

/**
 * Calculate combined similarity score
 */
export function calculateSimilarity(text1: string, text2: string): number {
  // Normalize texts
  const normalized1 = text1.toLowerCase().trim()
  const normalized2 = text2.toLowerCase().trim()

  // Exact match
  if (normalized1 === normalized2) return 1

  // Tokenize for Jaccard
  const tokens1 = tokenize(text1)
  const tokens2 = tokenize(text2)

  // Calculate both similarities
  const jaccard = jaccardSimilarity(tokens1, tokens2)

  // Only calculate Levenshtein for shorter texts (performance)
  let levenshtein = 0
  if (text1.length < 500 && text2.length < 500) {
    levenshtein = levenshteinSimilarity(normalized1, normalized2)
  }

  // Weighted average (Jaccard is better for longer texts)
  const weight = Math.min(text1.length, text2.length) > 100 ? 0.7 : 0.5
  return weight * jaccard + (1 - weight) * levenshtein
}

/**
 * Determine match type based on similarity score
 */
function getMatchType(similarity: number): 'exact' | 'high' | 'medium' {
  if (similarity >= 0.95) return 'exact'
  if (similarity >= 0.8) return 'high'
  return 'medium'
}

/**
 * Check if a question is a duplicate of any existing questions
 */
export function checkDuplicate(
  newQuestion: string,
  existingQuestions: Question[],
  threshold: number = 0.7
): DuplicateCheckResult {
  const matches: DuplicateMatch[] = []

  for (const existing of existingQuestions) {
    const similarity = calculateSimilarity(newQuestion, existing.text)

    if (similarity >= threshold) {
      matches.push({
        questionId: existing.id,
        questionText: existing.text,
        similarity,
        matchType: getMatchType(similarity)
      })
    }
  }

  // Sort by similarity (highest first)
  matches.sort((a, b) => b.similarity - a.similarity)

  return {
    isDuplicate: matches.length > 0 && matches[0].similarity >= 0.8,
    matches,
    bestMatch: matches[0] || null
  }
}

/**
 * Check multiple questions for duplicates
 */
export function checkDuplicates(
  newQuestions: { text: string; id?: string }[],
  existingQuestions: Question[],
  threshold: number = 0.7
): Map<number, DuplicateCheckResult> {
  const results = new Map<number, DuplicateCheckResult>()

  for (let i = 0; i < newQuestions.length; i++) {
    const result = checkDuplicate(newQuestions[i].text, existingQuestions, threshold)
    results.set(i, result)
  }

  return results
}

/**
 * Find duplicates within a list of questions
 */
export function findInternalDuplicates(
  questions: { text: string; id?: string }[],
  threshold: number = 0.8
): Array<{ index1: number; index2: number; similarity: number }> {
  const duplicates: Array<{ index1: number; index2: number; similarity: number }> = []

  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const similarity = calculateSimilarity(questions[i].text, questions[j].text)

      if (similarity >= threshold) {
        duplicates.push({ index1: i, index2: j, similarity })
      }
    }
  }

  return duplicates.sort((a, b) => b.similarity - a.similarity)
}
