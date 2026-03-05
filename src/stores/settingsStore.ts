import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeName, UserSettings } from '@/types'
import { db } from '@/services/db'

interface SettingsState {
  theme: ThemeName
  hasSeenOnboarding: boolean
  quizSettings: {
    defaultQuestionCount: number
    showTimer: boolean
    timerDuration: number
    shuffleQuestions: boolean
    shuffleChoices: boolean
    showExplanations: boolean
  }
  ollamaSettings: {
    enabled: boolean
    apiUrl: string
    model: string
    timeout: number
  }

  // Actions
  setTheme: (theme: ThemeName) => void
  setQuizSettings: (settings: Partial<SettingsState['quizSettings']>) => void
  setOllamaSettings: (settings: Partial<SettingsState['ollamaSettings']>) => void
  markOnboardingComplete: () => void
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'toulouse',
      hasSeenOnboarding: false,
      quizSettings: {
        defaultQuestionCount: 20,
        showTimer: true,
        timerDuration: 1200,
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

      // Actions
      setTheme: theme => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
        get().saveSettings()
      },

      setQuizSettings: settings => {
        set(state => ({
          quizSettings: { ...state.quizSettings, ...settings },
        }))
        get().saveSettings()
      },

      setOllamaSettings: settings => {
        set(state => ({
          ollamaSettings: { ...state.ollamaSettings, ...settings },
        }))
        get().saveSettings()
      },

      markOnboardingComplete: () => {
        set({ hasSeenOnboarding: true })
        get().saveSettings()
      },

      loadSettings: async () => {
        try {
          const settings = await db.settings.get('default')
          if (settings) {
            set({
              theme: settings.theme,
              hasSeenOnboarding: settings.hasSeenOnboarding ?? false,
              quizSettings: settings.quizSettings,
              ollamaSettings: settings.ollamaSettings,
            })
            document.documentElement.setAttribute('data-theme', settings.theme)
          }
        } catch (error) {
          console.error('Error loading settings:', error)
        }
      },

      saveSettings: async () => {
        const state = get()
        try {
          const settings: UserSettings = {
            id: 'default',
            theme: state.theme,
            language: 'fr',
            hasSeenOnboarding: state.hasSeenOnboarding,
            quizSettings: state.quizSettings,
            ollamaSettings: state.ollamaSettings,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          await db.settings.put(settings)
        } catch (error) {
          console.error('Error saving settings:', error)
        }
      },
    }),
    {
      name: 'chiropraxie-qcm-settings',
      partialize: state => ({
        theme: state.theme,
        hasSeenOnboarding: state.hasSeenOnboarding,
        quizSettings: state.quizSettings,
        ollamaSettings: state.ollamaSettings,
      }),
    }
  )
)
