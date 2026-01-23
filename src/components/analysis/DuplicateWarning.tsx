/**
 * DuplicateWarning Component
 * Displays warning when potential duplicates are found
 */

import { AlertTriangle } from 'lucide-react'
import type { DuplicateCheckResult } from '@/services/analysis'

interface DuplicateWarningProps {
  result: DuplicateCheckResult
  onIgnore?: () => void
  onViewMatch?: (questionId: string) => void
}

export function DuplicateWarning({ result, onIgnore, onViewMatch }: DuplicateWarningProps) {
  if (!result.isDuplicate || !result.bestMatch) {
    return null
  }

  const { bestMatch, matches } = result
  const similarityPercent = Math.round(bestMatch.similarity * 100)

  return (
    <div className={`alert ${bestMatch.matchType === 'exact' ? 'alert-error' : 'alert-warning'}`}>
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <div className="flex-1">
        <h4 className="font-medium">
          {bestMatch.matchType === 'exact'
            ? 'Question identique détectée'
            : `Question similaire détectée (${similarityPercent}%)`}
        </h4>
        <p className="text-sm mt-1 line-clamp-2">{bestMatch.questionText}</p>
        {matches.length > 1 && (
          <p className="text-xs mt-1 opacity-70">
            +{matches.length - 1} autre(s) correspondance(s)
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {onViewMatch && (
          <button
            onClick={() => onViewMatch(bestMatch.questionId)}
            className="btn btn-sm btn-ghost"
          >
            Voir
          </button>
        )}
        {onIgnore && (
          <button onClick={onIgnore} className="btn btn-sm btn-outline">
            Ignorer
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Compact badge version for list views
 */
interface DuplicateBadgeProps {
  result: DuplicateCheckResult
}

export function DuplicateBadge({ result }: DuplicateBadgeProps) {
  if (!result.isDuplicate || !result.bestMatch) {
    return null
  }

  const similarityPercent = Math.round(result.bestMatch.similarity * 100)

  return (
    <span
      className={`badge badge-sm ${
        result.bestMatch.matchType === 'exact' ? 'badge-error' : 'badge-warning'
      }`}
      title={`Similaire à ${similarityPercent}%: ${result.bestMatch.questionText.substring(0, 50)}...`}
    >
      {result.bestMatch.matchType === 'exact' ? 'Doublon' : `~${similarityPercent}%`}
    </span>
  )
}
