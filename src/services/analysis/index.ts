/**
 * Analysis Services - Barrel Export
 */

export {
  checkDuplicate,
  checkDuplicates,
  findInternalDuplicates,
  calculateSimilarity,
  jaccardSimilarity,
  levenshteinSimilarity,
  levenshteinDistance
} from './duplicates'
export type { DuplicateMatch, DuplicateCheckResult } from './duplicates'

export {
  calculateQualityScore,
  calculateBatchQuality,
  getScoreColor,
  getGradeBadgeClass
} from './quality'
export type { QualityScoreDetails, QualityIssue, QualityResult } from './quality'
