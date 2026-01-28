/**
 * OllamaStatus Component
 * Displays Ollama connection status with setup instructions
 */

import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import type { OllamaStatus as OllamaStatusType } from '@/hooks/useOllama'

interface OllamaStatusProps {
  status: OllamaStatusType
  isLoading: boolean
  onRefresh?: () => void
}

export function OllamaStatus({ status, isLoading, onRefresh }: OllamaStatusProps) {
  if (isLoading) {
    return (
      <div className="alert">
        <span className="loading loading-spinner loading-sm" />
        <span>Vérification de la connexion Ollama...</span>
      </div>
    )
  }

  // Success state - compact
  if (status.available && status.modelInstalled) {
    return (
      <div className="alert alert-success">
        <CheckCircle className="h-5 w-5" />
        <div className="flex-1">
          <span className="font-medium">Ollama est prêt</span>
          <span className="text-sm opacity-80 ml-2">
            {status.models.length} modèle(s) disponible(s)
          </span>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} className="btn btn-sm btn-ghost" title="Rafraîchir le statut">
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  // Warning/Error states - compact with collapsible instructions
  const isNotAvailable = !status.available

  return (
    <div className={`alert ${isNotAvailable ? 'alert-info' : 'alert-warning'}`}>
      <AlertCircle className="h-5 w-5" />
      <div className="flex-1">
        <p className="font-medium">
          {isNotAvailable ? 'Ollama non détecté' : 'Modèle non installé'}
        </p>
        <p className="text-sm opacity-90">
          {isNotAvailable
            ? "Ollama est optionnel. Installez-le pour générer des questions avec l'IA."
            : "Le modèle requis n'est pas installé."}
        </p>

        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-medium hover:underline">
            Instructions d'installation
          </summary>
          <div className="mt-2 space-y-2 text-sm">
            {isNotAvailable && (
              <>
                <div className="bg-base-300/50 rounded p-2">
                  <p className="font-medium mb-1">1. Installer Ollama:</p>
                  <code className="block text-xs bg-base-100 p-1.5 rounded">
                    curl -fsSL https://ollama.com/install.sh | sh
                  </code>
                </div>
                <div className="bg-base-300/50 rounded p-2">
                  <p className="font-medium mb-1">2. Démarrer:</p>
                  <code className="block text-xs bg-base-100 p-1.5 rounded">ollama serve</code>
                </div>
              </>
            )}
            <div className="bg-base-300/50 rounded p-2">
              <p className="font-medium mb-1">
                {isNotAvailable ? '3' : '1'}. Télécharger le modèle:
              </p>
              <code className="block text-xs bg-base-100 p-1.5 rounded">
                ollama pull mistral:7b-instruct
              </code>
            </div>
          </div>
        </details>
      </div>
      {onRefresh && (
        <button onClick={onRefresh} className="btn btn-sm btn-outline btn-xs">
          <RefreshCw className="h-3 w-3 mr-1" />
          Vérifier
        </button>
      )}
    </div>
  )
}
