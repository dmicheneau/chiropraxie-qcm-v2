import type { FlashCard } from '@/services/import'
import { X, Edit2, Check } from 'lucide-react'
import { useState } from 'react'

interface FlashcardPreviewProps {
  cards: FlashCard[]
  onRemove: (index: number) => void
  onEdit: (index: number, card: FlashCard) => void
}

export default function FlashcardPreview({ cards, onRemove, onEdit }: FlashcardPreviewProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editTerm, setEditTerm] = useState('')
  const [editDefinition, setEditDefinition] = useState('')

  const handleStartEdit = (index: number) => {
    setEditingIndex(index)
    setEditTerm(cards[index].term)
    setEditDefinition(cards[index].definition)
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      onEdit(editingIndex, { term: editTerm, definition: editDefinition })
      setEditingIndex(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/60">
        Aucune flashcard détectée
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-base-content/70">
          {cards.length} flashcard{cards.length > 1 ? 's' : ''} détectée{cards.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {cards.map((card, index) => (
          <div
            key={index}
            className="card bg-base-200 shadow-sm"
          >
            <div className="card-body p-4">
              {editingIndex === index ? (
                // Edit mode
                <div className="space-y-3">
                  <div>
                    <label className="label py-1">
                      <span className="label-text text-xs font-medium">Terme</span>
                    </label>
                    <input
                      type="text"
                      className="input input-sm input-bordered w-full"
                      value={editTerm}
                      onChange={e => setEditTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label py-1">
                      <span className="label-text text-xs font-medium">Définition</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered textarea-sm w-full"
                      rows={2}
                      value={editDefinition}
                      onChange={e => setEditDefinition(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={handleCancelEdit}
                    >
                      Annuler
                    </button>
                    <button
                      className="btn btn-primary btn-xs"
                      onClick={handleSaveEdit}
                    >
                      <Check size={14} />
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="badge badge-sm badge-primary shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate" title={card.term}>
                          {card.term}
                        </p>
                        <p className="text-xs text-base-content/70 line-clamp-2" title={card.definition}>
                          {card.definition}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      className="btn btn-ghost btn-xs btn-square"
                      onClick={() => handleStartEdit(index)}
                      title="Modifier"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-xs btn-square text-error"
                      onClick={() => onRemove(index)}
                      title="Supprimer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
