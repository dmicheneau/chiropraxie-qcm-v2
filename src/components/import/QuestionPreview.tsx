import type { Question } from '@/types'
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface QuestionPreviewProps {
  questions: Question[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

export default function QuestionPreview({
  questions,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll
}: QuestionPreviewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/60">
        Aucune question générée
      </div>
    )
  }

  const allSelected = selectedIds.size === questions.length
  const noneSelected = selectedIds.size === 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-base-content/70">
          {selectedIds.size}/{questions.length} question{questions.length > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
        </span>
        <div className="flex gap-2">
          <button
            className="btn btn-xs btn-ghost"
            onClick={onSelectAll}
            disabled={allSelected}
          >
            Tout sélectionner
          </button>
          <button
            className="btn btn-xs btn-ghost"
            onClick={onDeselectAll}
            disabled={noneSelected}
          >
            Tout désélectionner
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {questions.map((question, index) => {
          const isSelected = selectedIds.has(question.id)
          const isExpanded = expandedId === question.id
          const correctChoice = question.choices?.find(
            c => c.id === question.correctAnswer
          )

          return (
            <div
              key={question.id}
              className={`card shadow-sm cursor-pointer transition-colors ${
                isSelected ? 'bg-primary/10 border border-primary' : 'bg-base-200'
              }`}
            >
              <div className="card-body p-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <button
                    className={`btn btn-circle btn-sm ${
                      isSelected ? 'btn-primary' : 'btn-ghost'
                    }`}
                    onClick={() => onToggleSelect(question.id)}
                  >
                    {isSelected ? (
                      <CheckCircle size={16} />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </button>

                  <div
                    className="flex-1 min-w-0"
                    onClick={() => setExpandedId(isExpanded ? null : question.id)}
                  >
                    <p className="text-sm font-medium line-clamp-2">
                      {question.text}
                    </p>
                    
                    {!isExpanded && (
                      <p className="text-xs text-success mt-1">
                        Réponse: {correctChoice?.text?.substring(0, 50)}
                        {(correctChoice?.text?.length || 0) > 50 ? '...' : ''}
                      </p>
                    )}
                  </div>

                  <button
                    className="btn btn-ghost btn-xs btn-square"
                    onClick={() => setExpandedId(isExpanded ? null : question.id)}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-3 space-y-2 pl-11">
                    {question.choices?.map(choice => {
                      const isCorrect = choice.id === question.correctAnswer
                      return (
                        <div
                          key={choice.id}
                          className={`flex items-start gap-2 p-2 rounded text-sm ${
                            isCorrect
                              ? 'bg-success/20 text-success-content'
                              : 'bg-base-300'
                          }`}
                        >
                          <span className="font-bold shrink-0 w-6">
                            {choice.id}.
                          </span>
                          <span className="flex-1">{choice.text}</span>
                          {isCorrect && (
                            <CheckCircle size={16} className="text-success shrink-0" />
                          )}
                        </div>
                      )
                    })}

                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="badge badge-sm">
                        {question.difficulty === 'easy' && 'Facile'}
                        {question.difficulty === 'medium' && 'Moyen'}
                        {question.difficulty === 'hard' && 'Difficile'}
                      </span>
                      <span className="badge badge-sm badge-outline">
                        {question.theme}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
