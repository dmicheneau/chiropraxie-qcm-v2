/**
 * Ollama Configuration
 * Configuration for local AI integration with Ollama
 */

export interface OllamaConfig {
  endpoint: string
  model: string
  options: {
    temperature: number
    num_predict: number
    top_p: number
  }
}

export const defaultOllamaConfig: OllamaConfig = {
  endpoint: 'http://localhost:11434',
  model: 'mistral:7b-instruct',
  options: {
    temperature: 0.7,
    num_predict: 2000,
    top_p: 0.9
  }
}

export interface AlternativeModel {
  name: string
  size: string
  ram: string
  description: string
}

/**
 * Alternative models for limited hardware
 */
export const alternativeModels: AlternativeModel[] = [
  {
    name: 'mistral:7b-instruct',
    size: '4.1 GB',
    ram: '8 GB',
    description: 'Modèle principal recommandé, français natif'
  },
  {
    name: 'llama3.2:3b',
    size: '2 GB',
    ram: '4 GB',
    description: 'Plus rapide, qualité légèrement inférieure'
  },
  {
    name: 'phi3:mini',
    size: '2.3 GB',
    ram: '4 GB',
    description: 'Ultra-léger, bon pour machines modestes'
  },
  {
    name: 'gemma2:2b',
    size: '1.6 GB',
    ram: '4 GB',
    description: 'Le plus léger, performances basiques'
  }
]

/**
 * Timeout constants
 */
export const OLLAMA_TIMEOUTS = {
  health: 5000,      // 5 seconds for health check
  generate: 120000,  // 2 minutes for generation
  stream: 300000     // 5 minutes for streaming
}
