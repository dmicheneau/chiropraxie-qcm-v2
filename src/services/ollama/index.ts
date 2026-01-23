/**
 * Ollama Services - Barrel Export
 */

export { OllamaService, ollamaService } from './service'
export type { GenerateOptions, OllamaResponse, OllamaModelInfo } from './service'

export {
  generateQuestionsPrompt,
  generateTagsPrompt,
  generateExplanationPrompt,
  evaluateQualityPrompt,
  estimateDifficultyPrompt
} from './prompts'

export {
  parseAIQuestions,
  convertToQuestions,
  parseTags,
  parseExplanation,
  parseQualityEvaluation,
  extractJSON
} from './parser'
export type {
  AIGeneratedQuestion,
  ParsedQuestionsResult,
  QualityEvaluation
} from './parser'

export {
  generateQuestions,
  generateTagsForQuestion,
  generateExplanationForQuestion,
  generateMissingExplanations,
  generateMissingTags
} from './generator'
export type { GenerationOptions, GenerationResult, GenerationProgress } from './generator'
