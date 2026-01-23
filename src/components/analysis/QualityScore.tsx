/**
 * QualityScore Component
 * Displays quality score with visual indicators
 */

import { type QualityResult, getScoreColor, getGradeBadgeClass } from '@/services/analysis'

interface QualityScoreProps {
  result: QualityResult
  compact?: boolean
  showDetails?: boolean
}

export function QualityScore({ result, compact = false, showDetails = false }: QualityScoreProps) {
  const { score, grade, issues } = result

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`badge ${getGradeBadgeClass(grade)}`}>{grade}</span>
        <span className={`text-sm font-medium ${getScoreColor(score.overall)}`}>
          {score.overall}%
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Overall score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`badge badge-lg ${getGradeBadgeClass(grade)}`}>{grade}</span>
          <span className={`text-2xl font-bold ${getScoreColor(score.overall)}`}>
            {score.overall}%
          </span>
        </div>
        <span className="text-sm text-base-content/60">Score qualité</span>
      </div>

      {/* Progress bar */}
      <progress
        className={`progress w-full ${score.overall >= 80 ? 'progress-success' : score.overall >= 60 ? 'progress-warning' : 'progress-error'}`}
        value={score.overall}
        max="100"
      />

      {showDetails && (
        <>
          {/* Detail scores */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-base-content/70">Clarté</span>
              <span className={getScoreColor(score.clarity)}>{score.clarity}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/70">Complétude</span>
              <span className={getScoreColor(score.completeness)}>{score.completeness}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/70">Choix</span>
              <span className={getScoreColor(score.choiceQuality)}>{score.choiceQuality}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/70">Difficulté</span>
              <span className={getScoreColor(score.difficulty)}>{score.difficulty}%</span>
            </div>
          </div>

          {/* Issues */}
          {issues.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-base-content/70">Problèmes détectés:</p>
              <ul className="text-sm space-y-1">
                {issues.slice(0, 5).map((issue, idx) => (
                  <li
                    key={idx}
                    className={`flex items-start gap-2 ${
                      issue.type === 'error'
                        ? 'text-error'
                        : issue.type === 'warning'
                        ? 'text-warning'
                        : 'text-info'
                    }`}
                  >
                    <span>
                      {issue.type === 'error' ? '✗' : issue.type === 'warning' ? '⚠' : 'ℹ'}
                    </span>
                    <span>{issue.message}</span>
                  </li>
                ))}
                {issues.length > 5 && (
                  <li className="text-base-content/50">+{issues.length - 5} autres problèmes</li>
                )}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
