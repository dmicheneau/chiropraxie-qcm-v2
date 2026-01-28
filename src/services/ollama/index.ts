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
  estimateDifficultyPrompt,
  detectThemePrompt,
} from './prompts'

export {
  parseAIQuestions,
  convertToQuestions,
  parseTags,
  parseExplanation,
  parseQualityEvaluation,
  extractJSON,
} from './parser'
export type { AIGeneratedQuestion, ParsedQuestionsResult, QualityEvaluation } from './parser'

export {
  generateQuestions,
  generateTagsForQuestion,
  generateExplanationForQuestion,
  generateMissingExplanations,
  generateMissingTags,
  detectTheme,
  AVAILABLE_THEMES,
} from './generator'
export type {
  GenerationOptions,
  GenerationResult,
  GenerationProgress,
  ThemeDetectionResult,
} from './generator'
