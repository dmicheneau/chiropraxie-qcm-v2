/**
 * PDFImportTab Component
 * Tab for importing questions from PDF files
 * Automated flow: Select file → Extract → Detect theme → Generate questions
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { FileText, Upload, AlertCircle, CheckCircle, Sparkles, Edit3 } from 'lucide-react'
import { extractTextFromPDF, validatePDFFile, type PDFExtractionProgress } from '@/services/import'
import {
  generateQuestions,
  detectTheme,
  AVAILABLE_THEMES,
  type GenerationProgress,
} from '@/services/ollama'
import { useOllama } from '@/hooks'
import { OllamaStatus } from '@/components/analysis'
import { QuestionPreview } from '@/components/import'
import { useBankStore } from '@/stores'
import type { Question } from '@/types'

type WorkflowStep = 'idle' | 'extracting' | 'detecting_theme' | 'generating' | 'review' | 'saving'

export function PDFImportTab() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { status: ollamaStatus, isLoading: ollamaLoading, checkHealth } = useOllama()

  // Check Ollama health when component mounts
  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [extractionProgress, setExtractionProgress] = useState<PDFExtractionProgress | null>(null)
  const [pdfInfo, setPdfInfo] = useState<{ pageCount: number; wordCount: number } | null>(null)

  // Theme state
  const [theme, setTheme] = useState<string>(AVAILABLE_THEMES[0])
  const [subtheme, setSubtheme] = useState('')
  const [themeConfidence, setThemeConfidence] = useState<number | null>(null)
  const [isEditingTheme, setIsEditingTheme] = useState(false)

  // Generation state
  const [questionCount, setQuestionCount] = useState(10)
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('idle')
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null)
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())

  // Messages
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  // Save state
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { banks, addQuestionsToBank } = useBankStore()

  // Automated flow: Extract → Detect theme → Generate
  const runAutomatedFlow = useCallback(
    async (text: string) => {
      // Only run if Ollama is available
      if (!ollamaStatus.available || !ollamaStatus.modelInstalled) {
        return
      }

      // Step 1: Detect theme
      setWorkflowStep('detecting_theme')
      let detectedTheme: string = AVAILABLE_THEMES[0]
      let detectedSubtheme = ''

      try {
        const themeResult = await detectTheme(text)
        detectedTheme = themeResult.theme
        detectedSubtheme = themeResult.subtheme || ''
        setTheme(detectedTheme)
        setSubtheme(detectedSubtheme)
        setThemeConfidence(themeResult.confidence)
      } catch {
        // Use default theme if detection fails
        setTheme(AVAILABLE_THEMES[0])
        setThemeConfidence(null)
      }

      // Step 2: Generate questions (use local variable, not state)
      setWorkflowStep('generating')
      try {
        const result = await generateQuestions(
          text,
          { theme: detectedTheme, subtheme: detectedSubtheme || undefined, count: questionCount },
          setGenerationProgress
        )

        setGeneratedQuestions(result.questions)
        setSelectedQuestions(new Set(result.questions.map(q => q.id)))
        setWorkflowStep('review')

        if (result.questions.length === 0) {
          setError("Aucune question n'a pu être générée")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la génération')
        setWorkflowStep('idle')
      } finally {
        setGenerationProgress(null)
      }
    },
    [ollamaStatus.available, ollamaStatus.modelInstalled, theme, questionCount]
  )

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validatePDFFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Fichier invalide')
      return
    }

    // Reset state
    setSelectedFile(file)
    setError(null)
    setWarnings([])
    setExtractedText('')
    setPdfInfo(null)
    setGeneratedQuestions([])
    setSelectedQuestions(new Set())
    setThemeConfidence(null)
    setSaveSuccess(false)

    // Start automated extraction
    setWorkflowStep('extracting')

    try {
      const result = await extractTextFromPDF(file, setExtractionProgress)
      setExtractedText(result.text)
      setPdfInfo({ pageCount: result.pageCount, wordCount: result.wordCount })
      setWarnings(result.warnings)

      // Continue with automated flow
      await runAutomatedFlow(result.text)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'extraction")
      setWorkflowStep('idle')
    } finally {
      setExtractionProgress(null)
    }
  }

  const handleRegenerate = async () => {
    if (!extractedText || extractedText.length < 100) {
      setError('Le texte extrait est trop court pour générer des questions')
      return
    }

    setWorkflowStep('generating')
    setError(null)
    setGeneratedQuestions([])

    try {
      const result = await generateQuestions(
        extractedText,
        { theme, subtheme: subtheme || undefined, count: questionCount },
        setGenerationProgress
      )

      setGeneratedQuestions(result.questions)
      setSelectedQuestions(new Set(result.questions.map(q => q.id)))
      setWorkflowStep('review')

      if (result.questions.length === 0) {
        setError("Aucune question n'a pu être générée")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération')
      setWorkflowStep('idle')
    } finally {
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

    setWorkflowStep('saving')
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
          setWorkflowStep('idle')
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
      setWorkflowStep('review')
    }
  }

  const getStepMessage = (): string => {
    switch (workflowStep) {
      case 'extracting':
        return extractionProgress?.message || 'Extraction du texte...'
      case 'detecting_theme':
        return 'Détection automatique du thème...'
      case 'generating':
        return generationProgress?.message || 'Génération des questions...'
      case 'saving':
        return 'Sauvegarde en cours...'
      default:
        return ''
    }
  }

  const isProcessing = ['extracting', 'detecting_theme', 'generating', 'saving'].includes(
    workflowStep
  )

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
            Sélectionnez un fichier PDF. L'extraction, la détection du thème et la génération de
            questions se feront automatiquement.
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
              className="btn btn-primary gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
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

          {/* Progress indicator */}
          {isProcessing && (
            <div className="mt-4 p-4 bg-base-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="loading loading-spinner loading-md text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{getStepMessage()}</p>
                  {workflowStep === 'generating' && generationProgress?.progress !== undefined && (
                    <progress
                      className="progress progress-primary w-full mt-2"
                      value={generationProgress.progress}
                      max="100"
                    />
                  )}
                </div>
              </div>
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
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted Text & Theme Settings */}
      {extractedText && !isProcessing && (
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

            <details className="collapse collapse-arrow bg-base-200">
              <summary className="collapse-title text-sm font-medium">
                Voir/modifier le texte extrait
              </summary>
              <div className="collapse-content">
                <textarea
                  className="textarea textarea-bordered w-full h-48 font-mono text-sm mt-2"
                  value={extractedText}
                  onChange={e => setExtractedText(e.target.value)}
                />
              </div>
            </details>

            {/* Theme Settings */}
            <div className="mt-4 p-4 bg-base-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Thème détecté :</span>
                  {themeConfidence !== null && (
                    <span
                      className={`badge badge-sm ${themeConfidence >= 70 ? 'badge-success' : themeConfidence >= 40 ? 'badge-warning' : 'badge-error'}`}
                    >
                      {themeConfidence}% confiance
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-ghost btn-sm gap-1"
                  onClick={() => setIsEditingTheme(!isEditingTheme)}
                >
                  <Edit3 className="h-4 w-4" />
                  {isEditingTheme ? 'Fermer' : 'Modifier'}
                </button>
              </div>

              {isEditingTheme ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Thème</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={theme}
                      onChange={e => setTheme(e.target.value)}
                    >
                      {AVAILABLE_THEMES.map(t => (
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
                      placeholder="Ex: Colonne vertébrale"
                      value={subtheme}
                      onChange={e => setSubtheme(e.target.value)}
                    />
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
                        <option key={n} value={n}>
                          {n} questions
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <span className="badge badge-lg badge-primary">{theme}</span>
                  {subtheme && <span className="badge badge-lg badge-outline">{subtheme}</span>}
                </div>
              )}
            </div>

            {/* Regenerate button */}
            {generatedQuestions.length > 0 && (
              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-outline btn-primary gap-2"
                  onClick={handleRegenerate}
                  disabled={
                    !ollamaStatus.available ||
                    !ollamaStatus.modelInstalled ||
                    extractedText.length < 100
                  }
                >
                  <Sparkles className="h-4 w-4" />
                  Régénérer les questions
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Questions */}
      {generatedQuestions.length > 0 &&
        (workflowStep === 'review' || workflowStep === 'saving') && (
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
                  disabled={selectedQuestions.size === 0 || workflowStep === 'saving'}
                >
                  {workflowStep === 'saving' ? (
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
