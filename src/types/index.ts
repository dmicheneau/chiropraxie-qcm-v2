// Types de questions supportés
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false'

// Difficulté
export type Difficulty = 'easy' | 'medium' | 'hard'

// Source de la question
export type QuestionSource = 
  | 'manual' 
  | 'quizlet' 
  | 'ai_generated' 
  | 'pdf_import' 
  | 'image_import'

// Choix de réponse
export interface Choice {
  id: string // 'A', 'B', 'C', 'D'
  text: string
}

// Question enrichie V2
export interface Question {
  id: string // UUID
  type: QuestionType
  text: string // Texte de la question
  choices?: Choice[] // Options (QCM)
  correctAnswer: string | string[] // ID(s) de la/les bonne(s) réponse(s)
  explanation?: string // Explication de la réponse
  theme: string // Ex: "Anatomie"
  subtheme?: string // Ex: "Système nerveux"
  difficulty: Difficulty
  tags: string[] // Recherche avancée
  source: QuestionSource
  sourceUrl?: string // Traçabilité
  aiPrompt?: string // Si généré par IA
  createdAt: string // ISO date
  updatedAt: string
  metadata?: {
    qualityScore?: number // 0-100
    timesUsed?: number
    successRate?: number // 0-1
  }
}

// Banque de questions
export interface QuestionBank {
  id: string
  name: string
  description: string
  questions: Question[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
  metadata: {
    totalQuestions: number
    themes: string[]
    sources: Record<QuestionSource, number>
  }
}

// Progression utilisateur (anonyme, locale)
export interface UserProgress {
  questionId: string
  attempts: number
  correctAttempts: number
  lastAttempted: string
  nextReview?: string // Spaced repetition
  easeFactor: number // Algorithme SM-2 (défaut: 2.5)
  interval: number // Jours jusqu'à prochaine révision
}

// Session de quiz
export interface QuizSession {
  id: string
  bankId: string
  theme?: string
  questionsIds: string[]
  answers: Record<string, string | string[]>
  startedAt: string
  completedAt?: string
  score?: number
}

// Noms des thèmes disponibles
export type ThemeName = 
  | 'toulouse' 
  | 'nocturne' 
  | 'clown' 
  | 'azure' 
  | 'forest' 
  | 'sunset' 
  | 'ocean' 
  | 'medical' 
  | 'lavande' 
  | 'cupcake'

// Paramètres utilisateur
export interface UserSettings {
  id: string // Toujours 'default'
  theme: ThemeName
  language: 'fr' // Pour l'instant, uniquement français
  hasSeenOnboarding: boolean // A vu l'écran d'introduction
  quizSettings: {
    defaultQuestionCount: number
    showTimer: boolean
    timerDuration: number // secondes
    shuffleQuestions: boolean
    shuffleChoices: boolean
    showExplanations: boolean
  }
  ollamaSettings: {
    enabled: boolean
    apiUrl: string // 'http://localhost:11434'
    model: string // 'mistral:7b-instruct'
    timeout: number // millisecondes
  }
  createdAt: string
  updatedAt: string
}

// Streak (série quotidienne)
export interface Streak {
  id: string // Toujours 'default'
  currentStreak: number // Jours consécutifs actuels
  longestStreak: number // Record
  lastActivityDate: string // ISO date (YYYY-MM-DD)
  totalDaysActive: number
  createdAt: string
  updatedAt: string
}
