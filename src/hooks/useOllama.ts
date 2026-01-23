/**
 * useOllama Hook
 * React hook for interacting with Ollama AI service
 */

import { useState, useEffect, useCallback } from 'react'
import { ollamaService } from '@/services/ollama'
import { useSettingsStore } from '@/stores'

export interface OllamaStatus {
  available: boolean
  modelInstalled: boolean
  models: string[]
  error: string | null
}

export interface UseOllamaReturn {
  status: OllamaStatus
  isLoading: boolean
  isGenerating: boolean
  error: string | null
  generate: (prompt: string) => Promise<string>
  generateWithProgress: (
    prompt: string,
    onProgress: (text: string) => void
  ) => Promise<string>
  checkHealth: () => Promise<OllamaStatus>
  clearError: () => void
}

const initialStatus: OllamaStatus = {
  available: false,
  modelInstalled: false,
  models: [],
  error: null
}

export function useOllama(): UseOllamaReturn {
  const [status, setStatus] = useState<OllamaStatus>(initialStatus)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get Ollama settings from store
  const ollamaSettings = useSettingsStore(state => state.ollamaSettings)

  // Update service config when settings change
  useEffect(() => {
    ollamaService.setConfig({
      endpoint: ollamaSettings.apiUrl,
      model: ollamaSettings.model
    })
  }, [ollamaSettings.apiUrl, ollamaSettings.model])

  // Health check function
  const checkHealth = useCallback(async (): Promise<OllamaStatus> => {
    try {
      const health = await ollamaService.healthCheck()

      const newStatus: OllamaStatus = {
        available: health.available,
        modelInstalled: health.modelInstalled,
        models: health.models,
        error: health.error || null
      }

      setStatus(newStatus)
      setError(health.error || null)

      return newStatus
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Erreur inconnue'
      const newStatus: OllamaStatus = {
        available: false,
        modelInstalled: false,
        models: [],
        error: errorMessage
      }

      setStatus(newStatus)
      setError(errorMessage)

      return newStatus
    }
  }, [])

  // Initial health check
  useEffect(() => {
    checkHealth().finally(() => setIsLoading(false))

    // Re-check every 30 seconds
    const interval = setInterval(checkHealth, 30000)

    return () => clearInterval(interval)
  }, [checkHealth])

  // Generate function (non-streaming)
  const generate = useCallback(
    async (prompt: string): Promise<string> => {
      if (!status.available) {
        throw new Error('Ollama non disponible')
      }

      if (!status.modelInstalled) {
        throw new Error(`Modèle "${ollamaSettings.model}" non installé`)
      }

      setIsGenerating(true)
      setError(null)

      try {
        const response = await ollamaService.generate(prompt)
        return response
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Erreur de génération'
        setError(message)
        throw e
      } finally {
        setIsGenerating(false)
      }
    },
    [status.available, status.modelInstalled, ollamaSettings.model]
  )

  // Generate with streaming progress
  const generateWithProgress = useCallback(
    async (prompt: string, onProgress: (text: string) => void): Promise<string> => {
      if (!status.available) {
        throw new Error('Ollama non disponible')
      }

      if (!status.modelInstalled) {
        throw new Error(`Modèle "${ollamaSettings.model}" non installé`)
      }

      setIsGenerating(true)
      setError(null)

      try {
        let fullResponse = ''

        for await (const chunk of ollamaService.generateStream(prompt)) {
          fullResponse += chunk
          onProgress(fullResponse)
        }

        return fullResponse
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Erreur de génération'
        setError(message)
        throw e
      } finally {
        setIsGenerating(false)
      }
    },
    [status.available, status.modelInstalled, ollamaSettings.model]
  )

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    status,
    isLoading,
    isGenerating,
    error,
    generate,
    generateWithProgress,
    checkHealth,
    clearError
  }
}
