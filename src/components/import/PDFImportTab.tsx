/**
 * PDFImportTab Component
 * Tab for importing questions from PDF files
 */

import { useState, useRef } from 'react'
import { FileText, Upload, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import { extractTextFromPDF, validatePDFFile, type PDFExtractionProgress } from '@/services/import'
import { generateQuestions, type GenerationProgress } from '@/services/ollama'
import { useOllama } from '@/hooks'
import { OllamaStatus } from '@/components/analysis'
import { QuestionPreview } from '@/components/import'
import { useBankStore } from '@/stores'
import type { Question } from '@/types'

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
  'Pharmacologie'
]

export function PDFImportTab() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { status: ollamaStatus, isLoading: ollamaLoading, checkHealth } = useOllama()

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [extractionProgress, setExtractionProgress] = useState<PDFExtractionProgress | null>(null)
  const [pdfInfo, setPdfInfo] = useState<{ pageCount: number; wordCount: number } | null>(null)

  // Generation state
  const [theme, setTheme] = useState(THEMES[0])
  const [questionCount, setQuestionCount] = useState(10)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null)
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())

  // Messages
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  // Save state
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { banks, addQuestionsToBank } = useBankStore()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validatePDFFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Fichier invalide')
      return
    }

    setSelectedFile(file)
    setError(null)
    setWarnings([])
    setExtractedText('')
    setPdfInfo(null)
    setGeneratedQuestions([])
  }

  const handleExtract = async () => {
    if (!selectedFile) return

    setIsExtracting(true)
    setError(null)
    setWarnings([])

    try {
      const result = await extractTextFromPDF(selectedFile, setExtractionProgress)
      setExtractedText(result.text)
      setPdfInfo({ pageCount: result.pageCount, wordCount: result.wordCount })
      setWarnings(result.warnings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'extraction')
    } finally {
      setIsExtracting(false)
      setExtractionProgress(null)
    }
  }

  const handleGenerate = async () => {
    if (!extractedText || extractedText.length < 100) {
      setError('Le texte extrait est trop court pour générer des questions')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedQuestions([])

    try {
      const result = await generateQuestions(
        extractedText,
        { theme, count: questionCount },
        setGenerationProgress
      )

      setGeneratedQuestions(result.questions)
      setSelectedQuestions(new Set(result.questions.map(q => q.id)))

      if (result.questions.length === 0) {
        setError('Aucune question n\'a pu être générée')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      setIsGenerating(false)
      setGenerationProgress(null)
    }
  }

  const handleToggleQuestion = (id: string) => {
    setSelectedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = () => setSelectedQuestions(new Set(generatedQuestions.map(q => q.id)))
  const handleDeselectAll = () => setSelectedQuestions(new Set())

  const handleSave = async () => {
    const questionsToSave = generatedQuestions.filter(q => selectedQuestions.has(q.id))
    if (questionsToSave.length === 0) return

    setIsSaving(true)
    try {
      const targetBank = banks.find(b => b.isDefault) || banks[0]
      if (targetBank) {
        await addQuestionsToBank(targetBank.id, questionsToSave)
        setSaveSuccess(true)
        setTimeout(() => {
          setGeneratedQuestions([])
          setSelectedQuestions(new Set())
          setExtractedText('')
          setSelectedFile(null)
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
      <OllamaStatus status={ollamaStatus} isLoading={ollamaLoading} onRefresh={checkHealth} />

      {/* File Upload */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title text-lg">
            <FileText className="h-5 w-5" />
            Importer un PDF
          </h3>

          <p className="text-sm text-base-content/70 mb-4">
            Sélectionnez un fichier PDF (cours, notes) pour en extraire le texte et générer des questions.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-wrap gap-4 items-center">
            <button
              className="btn btn-outline gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExtracting}
            >
              <Upload className="h-4 w-4" />
              {selectedFile ? 'Changer le fichier' : 'Choisir un PDF'}
            </button>

            {selectedFile && (
              <span className="text-sm">
                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} Ko)
              </span>
            )}
          </div>

          {/* Extract Button */}
          {selectedFile && !extractedText && (
            <div className="mt-4">
              <button
                className="btn btn-primary gap-2"
                onClick={handleExtract}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    {extractionProgress?.message || 'Extraction...'}
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Extraire le texte
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="alert alert-warning">
          <AlertCircle className="h-5 w-5" />
          <ul className="text-sm">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Extracted Text Preview */}
      {extractedText && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title text-lg">Texte extrait</h3>
              {pdfInfo && (
                <div className="flex gap-2">
                  <span className="badge badge-primary">{pdfInfo.pageCount} page(s)</span>
                  <span className="badge badge-secondary">{pdfInfo.wordCount} mots</span>
                </div>
              )}
            </div>

            <textarea
              className="textarea textarea-bordered h-48 font-mono text-sm"
              value={extractedText}
              onChange={e => setExtractedText(e.target.value)}
            />

            {/* Generation Options */}
            {ollamaStatus.available && ollamaStatus.modelInstalled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Thème</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={theme}
                    onChange={e => setTheme(e.target.value)}
                  >
                    {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Nombre de questions</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={questionCount}
                    onChange={e => setQuestionCount(Number(e.target.value))}
                  >
                    {[5, 10, 15, 20].map(n => (
                      <option key={n} value={n}>{n} questions</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Progress */}
            {isGenerating && generationProgress && (
              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <span className="loading loading-spinner loading-sm" />
                  <span>{generationProgress.message}</span>
                </div>
                {generationProgress.progress !== undefined && (
                  <progress className="progress progress-primary w-full mt-2" value={generationProgress.progress} max="100" />
                )}
              </div>
            )}

            <div className="card-actions justify-end mt-4">
              <button
                className="btn btn-primary gap-2"
                onClick={handleGenerate}
                disabled={!ollamaStatus.available || !ollamaStatus.modelInstalled || isGenerating || extractedText.length < 100}
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

          {saveSuccess ? (
            <div className="alert alert-success">
              <CheckCircle className="h-5 w-5" />
              <span>{selectedQuestions.size} question(s) ajoutée(s) avec succès !</span>
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
