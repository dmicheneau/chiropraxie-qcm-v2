/**
 * AIGenerateTab Component
 * Tab for generating questions using AI (Ollama)
 */

import { useState, useEffect } from 'react'
import { Sparkles, AlertCircle, CheckCircle } from 'lucide-react'
import { useOllama } from '@/hooks'
import { OllamaStatus } from '@/components/analysis'
import { QuestionPreview } from '@/components/import'
import { generateQuestions, type GenerationProgress } from '@/services/ollama'
import { useBankStore } from '@/stores'
import type { Question } from '@/types'

const QUESTION_COUNTS = [5, 10, 15, 20]
const THEMES = [
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
]

export function AIGenerateTab() {
  const { status, isLoading: ollamaLoading, checkHealth } = useOllama()

  // Check Ollama health when component mounts (only when user navigates to AI tab)
  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  // Form state
  const [sourceText, setSourceText] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [theme, setTheme] = useState(THEMES[0])
  const [subtheme, setSubtheme] = useState('')

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<GenerationProgress | null>(null)
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [parseErrors, setParseErrors] = useState<string[]>([])

  // Save state
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Bank store
  const { banks, addQuestionsToBank } = useBankStore()

  const canGenerate = status.available && status.modelInstalled && sourceText.trim().length >= 50

  const handleGenerate = async () => {
    if (!canGenerate) return

    setIsGenerating(true)
    setError(null)
    setParseErrors([])
    setGeneratedQuestions([])
    setSelectedQuestions(new Set())
    setSaveSuccess(false)

    try {
      const result = await generateQuestions(
        sourceText,
        { theme, subtheme: subtheme || undefined, count: questionCount },
        setProgress
      )

      setGeneratedQuestions(result.questions)
      setParseErrors(result.parseErrors)

      // Select all by default
      setSelectedQuestions(new Set(result.questions.map(q => q.id)))

      if (result.questions.length === 0 && result.parseErrors.length > 0) {
        setError("Aucune question n'a pu être générée. Vérifiez le texte source.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      setIsGenerating(false)
      setProgress(null)
    }
  }

  const handleToggleQuestion = (id: string) => {
    setSelectedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedQuestions(new Set(generatedQuestions.map(q => q.id)))
  }

  const handleDeselectAll = () => {
    setSelectedQuestions(new Set())
  }

  const handleSave = async () => {
    const questionsToSave = generatedQuestions.filter(q => selectedQuestions.has(q.id))
    if (questionsToSave.length === 0) return

    setIsSaving(true)

    try {
      // Add to default bank (or first available)
      const targetBank = banks.find(b => b.isDefault) || banks[0]
      if (targetBank) {
        await addQuestionsToBank(targetBank.id, questionsToSave)
        setSaveSuccess(true)

        // Reset after success
        setTimeout(() => {
          setGeneratedQuestions([])
          setSelectedQuestions(new Set())
          setSourceText('')
          setSaveSuccess(false)
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Ollama Status */}
      <OllamaStatus status={status} isLoading={ollamaLoading} onRefresh={checkHealth} />

      {/* Input Form */}
      {status.available && status.modelInstalled && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-lg">
              <Sparkles className="h-5 w-5" />
              Générer des questions avec l'IA
            </h3>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Texte source (notes de cours, paragraphes...)</span>
                <span className="label-text-alt">{sourceText.length} caractères</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-48"
                placeholder="Collez ici votre texte source (minimum 50 caractères)...&#10;&#10;L'IA analysera ce contenu pour générer des questions QCM pertinentes."
                value={sourceText}
                onChange={e => setSourceText(e.target.value)}
                disabled={isGenerating}
              />
              {sourceText.length > 0 && sourceText.length < 50 && (
                <label className="label">
                  <span className="label-text-alt text-warning">Minimum 50 caractères requis</span>
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Nombre de questions</span>
                </label>
                <select
                  className="select select-bordered"
                  value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  disabled={isGenerating}
                >
                  {QUESTION_COUNTS.map(count => (
                    <option key={count} value={count}>
                      {count} questions
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Thème</span>
                </label>
                <select
                  className="select select-bordered"
                  value={theme}
                  onChange={e => setTheme(e.target.value)}
                  disabled={isGenerating}
                >
                  {THEMES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Sous-thème (optionnel)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Ex: Système nerveux"
                  value={subtheme}
                  onChange={e => setSubtheme(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-error">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Progress */}
            {isGenerating && progress && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="loading loading-spinner loading-sm" />
                  <span>{progress.message}</span>
                </div>
                {progress.progress !== undefined && (
                  <progress
                    className="progress progress-primary w-full"
                    value={progress.progress}
                    max="100"
                  />
                )}
              </div>
            )}

            <div className="card-actions justify-end">
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Générer {questionCount} questions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parse Errors */}
      {parseErrors.length > 0 && (
        <div className="alert alert-warning">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Avertissements lors du parsing:</p>
            <ul className="text-sm mt-1 list-disc list-inside">
              {parseErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Questions générées ({generatedQuestions.length})
          </h3>

          <QuestionPreview
            questions={generatedQuestions}
            selectedIds={selectedQuestions}
            onToggleSelect={handleToggleQuestion}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />

          {/* Save */}
          {saveSuccess ? (
            <div className="alert alert-success">
              <CheckCircle className="h-5 w-5" />
              <span>{selectedQuestions.size} question(s) ajoutée(s) à la banque avec succès !</span>
            </div>
          ) : (
            <div className="flex justify-end gap-3">
              <span className="self-center text-sm text-base-content/60">
                {selectedQuestions.size} question(s) sélectionnée(s)
              </span>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={selectedQuestions.size === 0 || isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Ajouter à la banque
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
