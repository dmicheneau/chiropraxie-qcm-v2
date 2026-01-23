import Dexie, { Table } from 'dexie'
import type {
  Question,
  QuestionBank,
  UserProgress,
  QuizSession,
  UserSettings,
  Streak,
} from '@/types'

class AppDatabase extends Dexie {
  questions!: Table<Question>
  banks!: Table<QuestionBank>
  progress!: Table<UserProgress>
  sessions!: Table<QuizSession>
  settings!: Table<UserSettings>
  streaks!: Table<Streak>

  constructor() {
    super('chiropraxie-qcm-v2')
    
    this.version(1).stores({
      questions: 'id, theme, subtheme, difficulty, source, createdAt',
      banks: 'id, name, isDefault, createdAt',
      progress: 'questionId, nextReview',
      sessions: 'id, bankId, startedAt',
      settings: 'id',
      streaks: 'id',
    })
  }
}

export const db = new AppDatabase()

// Fonction d'initialisation par défaut
export async function initializeDatabase() {
  try {
    // Vérifier si les paramètres par défaut existent
    const existingSettings = await db.settings.get('default')
    
    if (!existingSettings) {
      // Créer les paramètres par défaut
      const defaultSettings: UserSettings = {
        id: 'default',
        theme: 'toulouse',
        language: 'fr',
        quizSettings: {
          defaultQuestionCount: 20,
          showTimer: true,
          timerDuration: 1200, // 20 minutes
          shuffleQuestions: true,
          shuffleChoices: true,
          showExplanations: true,
        },
        ollamaSettings: {
          enabled: false,
          apiUrl: 'http://localhost:11434',
          model: 'mistral:7b-instruct',
          timeout: 30000,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      await db.settings.add(defaultSettings)
    }
    
    // Vérifier si le streak existe
    const existingStreak = await db.streaks.get('default')
    
    if (!existingStreak) {
      // Créer le streak par défaut
      const defaultStreak: Streak = {
        id: 'default',
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date().toISOString().split('T')[0],
        totalDaysActive: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      await db.streaks.add(defaultStreak)
    }
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}
