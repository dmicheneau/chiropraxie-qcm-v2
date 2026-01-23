/**
 * JSONImportTab Component
 * Tab for importing and exporting question banks as JSON
 */

import { useState, useRef } from 'react'
import { FileJson, Upload, Download, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import {
  readJSONFile,
  validateJSONFile,
  validateImportData,
  processImport,
  exportBanksToJSON,
  downloadExportFile,
  type ConflictStrategy,
  type ExportFormat
} from '@/services/export'
import { useBankStore } from '@/stores'

export function JSONImportTab() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { banks, loadBanks, addQuestionsToBank, createBank } = useBankStore()

  // Import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<ExportFormat | null>(null)
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('merge')
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Export state
  const [isExporting, setIsExporting] = useState(false)

  // Messages
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validation = validateJSONFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Fichier invalide')
      return
    }

    setSelectedFile(file)
    setError(null)
    setSuccess(null)
    setWarnings([])
    setImportData(null)
    setValidationErrors([])

    // Read and validate
    setIsValidating(true)
    try {
      const json = await readJSONFile(file)
      const validationResult = validateImportData(json)

      if (!validationResult.valid) {
        setValidationErrors(validationResult.errors)
        setError('Le fichier ne correspond pas au format attendu')
      } else {
        setImportData(validationResult.data!)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la lecture')
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = async () => {
    if (!importData) return

    setIsImporting(true)
    setError(null)
    setWarnings([])

    try {
      const result = processImport(importData, banks, conflictStrategy)

      if (!result.success) {
        setError(result.errors.join('. '))
        return
      }

      // Save imported banks
      for (const bank of result.banks) {
        const existing = banks.find(b => b.id === bank.id)
        if (existing) {
          // Update existing bank - add new questions
          await addQuestionsToBank(existing.id, bank.questions)
        } else {
          // Add new bank
          const newBank = await createBank(bank.name, bank.description)
          if (newBank && bank.questions.length > 0) {
            await addQuestionsToBank(newBank.id, bank.questions)
          }
        }
      }

      // Reload banks
      await loadBanks()

      setSuccess(
        `Import réussi ! ${result.questionsImported} question(s) importée(s)` +
        (result.questionsSkipped > 0 ? `, ${result.questionsSkipped} ignorée(s)` : '')
      )
      setWarnings(result.warnings)

      // Reset form
      setTimeout(() => {
        setSelectedFile(null)
        setImportData(null)
        setSuccess(null)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import')
    } finally {
      setIsImporting(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)

    try {
      const exportData = exportBanksToJSON(banks)
      downloadExportFile(exportData)
      setSuccess('Export téléchargé avec succès !')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'export')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title text-lg">
            <Download className="h-5 w-5" />
            Exporter vos données
          </h3>

          <p className="text-sm text-base-content/70 mb-4">
            Téléchargez toutes vos banques de questions au format JSON pour les sauvegarder ou les partager.
          </p>

          <div className="flex items-center gap-4">
            <button
              className="btn btn-primary gap-2"
              onClick={handleExport}
              disabled={isExporting || banks.length === 0}
            >
              {isExporting ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Export...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exporter en JSON
                </>
              )}
            </button>

            <span className="text-sm text-base-content/60">
              {banks.length} banque(s), {banks.reduce((acc, b) => acc + b.questions.length, 0)} question(s)
            </span>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title text-lg">
            <Upload className="h-5 w-5" />
            Importer des données
          </h3>

          <p className="text-sm text-base-content/70 mb-4">
            Importez une banque de questions exportée précédemment ou partagée par un camarade.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-wrap gap-4 items-center">
            <button
              className="btn btn-outline gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isValidating || isImporting}
            >
              <FileJson className="h-4 w-4" />
              {selectedFile ? 'Changer le fichier' : 'Choisir un fichier JSON'}
            </button>

            {selectedFile && (
              <span className="text-sm">
                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} Ko)
              </span>
            )}

            {isValidating && (
              <span className="loading loading-spinner loading-sm" />
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="alert alert-error mt-4">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Erreurs de validation:</p>
                <ul className="text-sm mt-1 list-disc list-inside">
                  {validationErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li>... et {validationErrors.length - 5} autres erreurs</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Import Preview */}
          {importData && (
            <div className="mt-4 p-4 bg-base-200 rounded-lg">
              <h4 className="font-medium mb-2">Aperçu de l'import</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-base-content/60">Banques:</span>
                  <span className="ml-2 font-medium">{importData.banks.length}</span>
                </div>
                <div>
                  <span className="text-base-content/60">Questions:</span>
                  <span className="ml-2 font-medium">{importData.metadata.totalQuestions}</span>
                </div>
                <div>
                  <span className="text-base-content/60">Thèmes:</span>
                  <span className="ml-2 font-medium">{importData.metadata.themes.length}</span>
                </div>
                <div>
                  <span className="text-base-content/60">Exporté le:</span>
                  <span className="ml-2 font-medium">
                    {new Date(importData.exportedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              {/* Conflict Strategy */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">En cas de conflit (banque existante):</span>
                </label>
                <select
                  className="select select-bordered"
                  value={conflictStrategy}
                  onChange={e => setConflictStrategy(e.target.value as ConflictStrategy)}
                >
                  <option value="skip">Ignorer (garder l'existant)</option>
                  <option value="merge">Fusionner (ajouter les nouvelles questions)</option>
                  <option value="replace">Remplacer (écraser l'existant)</option>
                </select>
              </div>

              {/* Banks List */}
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Banques à importer:</p>
                <ul className="text-sm space-y-1">
                  {importData.banks.map((bank, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="badge badge-sm badge-primary">{bank.questions.length}</span>
                      <span>{bank.name}</span>
                      {banks.some(b => b.id === bank.id) && (
                        <span className="badge badge-sm badge-warning">Existe déjà</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Import Button */}
          {importData && (
            <div className="mt-4">
              <button
                className="btn btn-primary gap-2"
                onClick={handleImport}
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Importer {importData.metadata.totalQuestions} question(s)
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

      {/* Success */}
      {success && (
        <div className="alert alert-success">
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
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
    </div>
  )
}
