/**
 * Ollama Service
 * Core service for interacting with local Ollama AI
 */

import { OllamaConfig, defaultOllamaConfig, OLLAMA_TIMEOUTS } from '@/config/ollama'

export interface GenerateOptions {
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface OllamaResponse {
  model: string
  response: string
  done: boolean
  total_duration?: number
  eval_count?: number
}

export interface OllamaModelInfo {
  name: string
  size: number
  digest: string
  modified_at: string
}

export class OllamaService {
  private config: OllamaConfig

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = { ...defaultOllamaConfig, ...config }
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<OllamaConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): OllamaConfig {
    return { ...this.config }
  }

  /**
   * Check if Ollama server is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUTS.health)

      const response = await fetch(`${this.config.endpoint}/api/tags`, {
        method: 'GET',
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * List installed models
   */
  async listModels(): Promise<OllamaModelInfo[]> {
    const response = await fetch(`${this.config.endpoint}/api/tags`, {
      signal: AbortSignal.timeout(OLLAMA_TIMEOUTS.health)
    })

    if (!response.ok) {
      throw new Error('Ollama non disponible')
    }

    const data = await response.json()
    return data.models || []
  }

  /**
   * Check if a specific model is installed
   */
  async hasModel(model: string): Promise<boolean> {
    try {
      const models = await this.listModels()
      return models.some(m => m.name.startsWith(model.split(':')[0]))
    } catch {
      return false
    }
  }

  /**
   * Generate a response (non-streaming)
   */
  async generate(prompt: string, options: GenerateOptions = {}): Promise<string> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUTS.generate)

    try {
      const response = await fetch(`${this.config.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          prompt,
          stream: false,
          options: {
            temperature: options.temperature ?? this.config.options.temperature,
            num_predict: options.maxTokens ?? this.config.options.num_predict,
            top_p: this.config.options.top_p
          }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Erreur Ollama (${response.status}): ${error}`)
      }

      const data: OllamaResponse = await response.json()
      return data.response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Génération annulée: délai d\'attente dépassé')
      }
      throw error
    }
  }

  /**
   * Generate with streaming (for progressive display)
   */
  async *generateStream(prompt: string): AsyncGenerator<string> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUTS.stream)

    try {
      const response = await fetch(`${this.config.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          prompt,
          stream: true,
          options: {
            temperature: this.config.options.temperature,
            num_predict: this.config.options.num_predict
          }
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Erreur Ollama: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Stream non supporté')

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(Boolean)

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.response) {
              yield data.response
            }
            if (data.done) {
              clearTimeout(timeoutId)
              return
            }
          } catch {
            // Ignore non-JSON lines
          }
        }
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Check server health and return detailed status
   */
  async healthCheck(): Promise<{
    available: boolean
    modelInstalled: boolean
    models: string[]
    error?: string
  }> {
    try {
      const available = await this.isAvailable()
      if (!available) {
        return {
          available: false,
          modelInstalled: false,
          models: [],
          error: 'Ollama n\'est pas démarré. Exécutez "ollama serve" dans un terminal.'
        }
      }

      const modelsList = await this.listModels()
      const models = modelsList.map(m => m.name)
      const modelInstalled = await this.hasModel(this.config.model)

      return {
        available: true,
        modelInstalled,
        models,
        error: modelInstalled
          ? undefined
          : `Modèle "${this.config.model}" non installé. Exécutez "ollama pull ${this.config.model}"`
      }
    } catch (error) {
      return {
        available: false,
        modelInstalled: false,
        models: [],
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }
}

// Singleton instance
export const ollamaService = new OllamaService()
