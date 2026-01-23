import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  Image,
  FileJson,
  ClipboardPaste,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Plus,
  Sparkles
} from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { FlashcardPreview, QuestionPreview, AIGenerateTab, PDFImportTab, ImageImportTab, JSONImportTab } from '@/components/import'
import {
  parseQuizletExport,
  convertFlashcardsToQuestions,
  validateCardsForConversion,
  type FlashCard,
  type ConversionMode
} from '@/services/import'
import { useBankStore } from '@/stores'
import type { Question, Difficulty } from '@/types'

type ImportTab = 'quizlet' | 'ai' | 'pdf' | 'image' | 'json'
type ImportStep = 'input' | 'preview' | 'convert' | 'save'

// Available themes for questions
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
  'Pédiatrie',
  'Ergonomie',
  'Autre'
]

export default function Import() {
  const { t } = useTranslation()
  const { banks, loadBanks, createBank, addQuestionsToBank } = useBankStore()

  // Tab state
  const [activeTab, setActiveTab] = useState<ImportTab>('quizlet')

  // Quizlet import state
  const [inputText, setInputText] = useState('')
  const [step, setStep] = useState<ImportStep>('input')
  const [flashcards, setFlashcards] = useState<FlashCard[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [parseWarnings, setParseWarnings] = useState<string[]>([])
  const [parseConfidence, setParseConfidence] = useState(0)
  const [parseFormat, setParseFormat] = useState('')

  // Conversion options
  const [conversionMode, setConversionMode] = useState<ConversionMode>('term-to-question')
  const [selectedTheme, setSelectedTheme] = useState('Anatomie')
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium')
  const [shuffleChoices, setShuffleChoices] = useState(true)

  // Save options
  const [selectedBankId, setSelectedBankId] = useState<string>('')
  const [newBankName, setNewBankName] = useState('')
  const [newBankDescription, setNewBankDescription] = useState('')
  const [isCreatingBank, setIsCreatingBank] = useState(false)

  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Messages
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load banks on mount
  useEffect(() => {
    loadBanks()
  }, [loadBanks])

  // Set default bank when banks are loaded
  useEffect(() => {
    if (banks.length > 0 && !selectedBankId) {
      setSelectedBankId(banks[0].id)
    }
  }, [banks, selectedBankId])

  // Reset state when changing tabs
  const handleTabChange = (tab: ImportTab) => {
    setActiveTab(tab)
    resetState()
  }

  const resetState = () => {
    setInputText('')
    setStep('input')
    setFlashcards([])
    setQuestions([])
    setSelectedQuestionIds(new Set())
    setParseWarnings([])
    setError(null)
    setSuccess(null)
  }

  // Analyze pasted content
  const handleAnalyze = () => {
    if (!inputText.trim()) {
      setError(t('import.validation.emptyContent'))
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const result = parseQuizletExport(inputText)

      if (result.cards.length === 0) {
        setError(t('import.validation.invalidFormat'))
        setIsAnalyzing(false)
        return
      }

      setFlashcards(result.cards)
      setParseWarnings(result.warnings)
      setParseConfidence(result.confidence)
      setParseFormat(result.format)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Edit a flashcard
  const handleEditFlashcard = (index: number, card: FlashCard) => {
    const updated = [...flashcards]
    updated[index] = card
    setFlashcards(updated)
  }

  // Remove a flashcard
  const handleRemoveFlashcard = (index: number) => {
    setFlashcards(flashcards.filter((_, i) => i !== index))
  }

  // Convert flashcards to questions
  const handleConvert = () => {
    const validation = validateCardsForConversion(flashcards)

    if (!validation.valid) {
      setError(validation.errors.join('. '))
      return
    }

    setIsConverting(true)
    setError(null)

    try {
      const result = convertFlashcardsToQuestions(flashcards, {
        mode: conversionMode,
        theme: selectedTheme,
        difficulty: selectedDifficulty,
        shuffleChoices
      })

      if (result.warnings.length > 0) {
        setParseWarnings(prev => [...prev, ...result.warnings])
      }

      setQuestions(result.questions)
      // Select all questions by default
      setSelectedQuestionIds(new Set(result.questions.map(q => q.id)))
      setStep('convert')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la conversion')
    } finally {
      setIsConverting(false)
    }
  }

  // Toggle question selection
  const handleToggleSelect = (id: string) => {
    const updated = new Set(selectedQuestionIds)
    if (updated.has(id)) {
      updated.delete(id)
    } else {
      updated.add(id)
    }
    setSelectedQuestionIds(updated)
  }

  // Select/deselect all questions
  const handleSelectAll = () => {
    setSelectedQuestionIds(new Set(questions.map(q => q.id)))
  }

  const handleDeselectAll = () => {
    setSelectedQuestionIds(new Set())
  }

  // Create new bank
  const handleCreateBank = async () => {
    if (!newBankName.trim()) {
      setError('Veuillez entrer un nom pour la banque')
      return
    }

    try {
      const bank = await createBank(newBankName, newBankDescription)
      setSelectedBankId(bank.id)
      setIsCreatingBank(false)
      setNewBankName('')
      setNewBankDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    }
  }

  // Save questions to bank
  const handleSave = async () => {
    if (selectedQuestionIds.size === 0) {
      setError('Veuillez sélectionner au moins une question')
      return
    }

    if (!selectedBankId) {
      setError('Veuillez sélectionner une banque')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const selectedQuestions = questions.filter(q => selectedQuestionIds.has(q.id))
      await addQuestionsToBank(selectedBankId, selectedQuestions)

      setSuccess(t('import.save.success', { count: selectedQuestions.length }))
      
      // Reset after short delay
      setTimeout(() => {
        resetState()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('import.save.error'))
    } finally {
      setIsSaving(false)
    }
  }

  // Go back to previous step
  const handleBack = () => {
    if (step === 'preview') setStep('input')
    else if (step === 'convert') setStep('preview')
    else if (step === 'save') setStep('convert')
  }

  // Go to save step
  const handleGoToSave = () => {
    if (selectedQuestionIds.size === 0) {
      setError('Veuillez sélectionner au moins une question')
      return
    }
    setStep('save')
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('import.title')}</h1>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6">
        <button
          className={`tab gap-2 ${activeTab === 'quizlet' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('quizlet')}
        >
          <ClipboardPaste size={16} />
          {t('import.tabs.quizlet')}
        </button>
        <button
          className={`tab gap-2 ${activeTab === 'ai' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('ai')}
        >
          <Sparkles size={16} />
          {t('import.tabs.ai', 'IA')}
        </button>
        <button
          className={`tab gap-2 ${activeTab === 'pdf' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('pdf')}
        >
          <FileText size={16} />
          {t('import.tabs.pdf')}
        </button>
        <button
          className={`tab gap-2 ${activeTab === 'image' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('image')}
        >
          <Image size={16} />
          {t('import.tabs.image')}
        </button>
        <button
          className={`tab gap-2 ${activeTab === 'json' ? 'tab-active' : ''}`}
          onClick={() => handleTabChange('json')}
        >
          <FileJson size={16} />
          {t('import.tabs.json')}
        </button>
      </div>

      {/* Progress steps */}
      {activeTab === 'quizlet' && (
        <ul className="steps steps-horizontal w-full mb-6">
          <li className={`step ${step !== 'input' ? 'step-primary' : 'step-primary'}`}>
            Coller
          </li>
          <li className={`step ${['preview', 'convert', 'save'].includes(step) ? 'step-primary' : ''}`}>
            Prévisualiser
          </li>
          <li className={`step ${['convert', 'save'].includes(step) ? 'step-primary' : ''}`}>
            Convertir
          </li>
          <li className={`step ${step === 'save' ? 'step-primary' : ''}`}>
            Enregistrer
          </li>
        </ul>
      )}

      {/* Error/Success messages */}
      {error && (
        <div className="alert alert-error mb-4">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button className="btn btn-ghost btn-xs" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Quizlet Import */}
      {activeTab === 'quizlet' && (
        <div className="space-y-4">
          {/* Step 1: Input */}
          {step === 'input' && (
            <Card title={t('import.quizlet.title')}>
              <p className="text-sm text-base-content/70 mb-4">
                {t('import.quizlet.description')}
              </p>

              <div className="bg-base-200 p-3 rounded-lg mb-4 text-sm">
                <p className="font-medium mb-2">Comment copier depuis Quizlet:</p>
                <ol className="list-decimal list-inside space-y-1 text-base-content/70">
                  <li>Ouvrez votre set Quizlet</li>
                  <li>Cliquez sur "..." → "Exporter"</li>
                  <li>Copiez tout le contenu (Ctrl+A, Ctrl+C)</li>
                  <li>Collez ici</li>
                </ol>
              </div>

              <textarea
                className="textarea textarea-bordered w-full h-48 font-mono text-sm"
                placeholder={t('import.quizlet.placeholder')}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
              />

              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleAnalyze}
                  disabled={!inputText.trim() || isAnalyzing}
                  loading={isAnalyzing}
                >
                  {isAnalyzing ? t('import.quizlet.analyzing') : t('import.quizlet.analyze')}
                  {!isAnalyzing && <ArrowRight size={16} className="ml-2" />}
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Preview flashcards */}
          {step === 'preview' && (
            <Card title={t('import.preview.flashcards')}>
              {/* Parse info */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="badge badge-primary">
                  {t('import.quizlet.formatDetected')}: {parseFormat}
                </span>
                <span className="badge badge-secondary">
                  {t('import.quizlet.confidence')}: {Math.round(parseConfidence * 100)}%
                </span>
              </div>

              {/* Warnings */}
              {parseWarnings.length > 0 && (
                <div className="alert alert-warning mb-4">
                  <AlertCircle size={16} />
                  <ul className="text-sm">
                    {parseWarnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Flashcard preview */}
              <FlashcardPreview
                cards={flashcards}
                onRemove={handleRemoveFlashcard}
                onEdit={handleEditFlashcard}
              />

              {/* Conversion options */}
              <div className="divider">{t('import.conversion.title')}</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t('import.conversion.mode')}</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={conversionMode}
                    onChange={e => setConversionMode(e.target.value as ConversionMode)}
                  >
                    <option value="term-to-question">
                      {t('import.conversion.termToQuestion')}
                    </option>
                    <option value="definition-to-question">
                      {t('import.conversion.definitionToQuestion')}
                    </option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t('import.conversion.theme')}</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={selectedTheme}
                    onChange={e => setSelectedTheme(e.target.value)}
                  >
                    {THEMES.map(theme => (
                      <option key={theme} value={theme}>{theme}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t('import.conversion.difficulty')}</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={selectedDifficulty}
                    onChange={e => setSelectedDifficulty(e.target.value as Difficulty)}
                  >
                    <option value="easy">Facile</option>
                    <option value="medium">Moyen</option>
                    <option value="hard">Difficile</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">{t('import.conversion.shuffleChoices')}</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={shuffleChoices}
                      onChange={e => setShuffleChoices(e.target.checked)}
                    />
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={handleBack}>
                  Retour
                </Button>
                <Button
                  onClick={handleConvert}
                  disabled={flashcards.length < 4 || isConverting}
                  loading={isConverting}
                >
                  {isConverting ? t('import.conversion.converting') : t('import.conversion.convert')}
                  {!isConverting && <ArrowRight size={16} className="ml-2" />}
                </Button>
              </div>
            </Card>
          )}

          {/* Step 3: Preview questions */}
          {step === 'convert' && (
            <Card title={t('import.preview.questions')}>
              <QuestionPreview
                questions={questions}
                selectedIds={selectedQuestionIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
              />

              {/* Actions */}
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={handleBack}>
                  Retour
                </Button>
                <Button
                  onClick={handleGoToSave}
                  disabled={selectedQuestionIds.size === 0}
                >
                  Continuer
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 4: Save to bank */}
          {step === 'save' && (
            <Card title={t('import.save.title')}>
              <p className="text-sm text-base-content/70 mb-4">
                {selectedQuestionIds.size} question(s) prête(s) à être ajoutée(s)
              </p>

              {/* Bank selection */}
              {!isCreatingBank ? (
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">{t('import.save.selectBank')}</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={selectedBankId}
                      onChange={e => setSelectedBankId(e.target.value)}
                    >
                      {banks.map(bank => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name} ({bank.questions.length} questions)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="btn btn-outline btn-sm gap-2"
                    onClick={() => setIsCreatingBank(true)}
                  >
                    <Plus size={16} />
                    {t('import.save.createBank')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-base-200 rounded-lg">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">{t('import.save.bankName')}</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={newBankName}
                      onChange={e => setNewBankName(e.target.value)}
                      placeholder="Ma nouvelle banque"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">{t('import.save.bankDescription')}</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered w-full"
                      value={newBankDescription}
                      onChange={e => setNewBankDescription(e.target.value)}
                      placeholder="Description de la banque (optionnel)"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setIsCreatingBank(false)}
                    >
                      Annuler
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleCreateBank}
                      disabled={!newBankName.trim()}
                    >
                      Créer
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={handleBack}>
                  Retour
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!selectedBankId || isSaving}
                  loading={isSaving}
                >
                  {isSaving ? t('import.save.adding') : t('import.save.addToBank')}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* AI Generation Tab */}
      {activeTab === 'ai' && <AIGenerateTab />}

      {/* PDF Import Tab */}
      {activeTab === 'pdf' && <PDFImportTab />}

      {/* Image Import Tab */}
      {activeTab === 'image' && <ImageImportTab />}

      {/* JSON Import Tab */}
      {activeTab === 'json' && <JSONImportTab />}
    </div>
  )
}
