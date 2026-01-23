/**
 * OllamaStatus Component
 * Displays Ollama connection status with setup instructions
 */

import { CheckCircle, XCircle, AlertCircle, RefreshCw, Terminal } from 'lucide-react'
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
          <button
            onClick={onRefresh}
            className="btn btn-sm btn-ghost"
            title="Rafraîchir le statut"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  if (status.available && !status.modelInstalled) {
    return (
      <div className="alert alert-warning">
        <AlertCircle className="h-5 w-5" />
        <div className="flex-1">
          <p className="font-medium">Modèle non installé</p>
          <p className="text-sm mt-1">
            {status.error || 'Le modèle requis n\'est pas installé.'}
          </p>
          <div className="mt-3 bg-base-300 rounded-lg p-3">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Exécutez cette commande:
            </p>
            <code className="block text-sm bg-base-100 p-2 rounded">
              ollama pull mistral:7b-instruct
            </code>
          </div>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} className="btn btn-sm btn-outline">
            <RefreshCw className="h-4 w-4 mr-1" />
            Réessayer
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="alert alert-error">
      <XCircle className="h-5 w-5" />
      <div className="flex-1">
        <p className="font-medium">Ollama non disponible</p>
        <p className="text-sm mt-1">
          L'IA locale nécessite Ollama pour fonctionner.
        </p>
        <div className="mt-3 space-y-3">
          <div className="bg-base-300 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">1. Installer Ollama:</p>
            <code className="block text-sm bg-base-100 p-2 rounded">
              curl -fsSL https://ollama.com/install.sh | sh
            </code>
          </div>
          <div className="bg-base-300 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">2. Démarrer le serveur:</p>
            <code className="block text-sm bg-base-100 p-2 rounded">ollama serve</code>
          </div>
          <div className="bg-base-300 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">3. Télécharger le modèle:</p>
            <code className="block text-sm bg-base-100 p-2 rounded">
              ollama pull mistral:7b-instruct
            </code>
          </div>
        </div>
      </div>
      {onRefresh && (
        <button onClick={onRefresh} className="btn btn-sm btn-outline">
          <RefreshCw className="h-4 w-4 mr-1" />
          Réessayer
        </button>
      )}
    </div>
  )
}
