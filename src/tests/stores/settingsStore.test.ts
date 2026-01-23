import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import type { ThemeName } from '@/types'

// Create a proper localStorage mock
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
}

const localStorageMock = createLocalStorageMock()
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true })

// Mock document.documentElement.setAttribute
const mockSetAttribute = vi.fn()
const originalDocumentElement = document.documentElement
Object.defineProperty(document, 'documentElement', {
  value: {
    ...originalDocumentElement,
    setAttribute: mockSetAttribute,
    getAttribute: vi.fn(),
  },
  writable: true,
  configurable: true,
})

// Mock the database
vi.mock('@/services/db', () => ({
  db: {
    settings: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    },
  },
}))

describe('settingsStore', () => {
  // Reset modules before each test to get fresh store
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorageMock.clear()
    
    // Reset the store module to get a fresh instance
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has toulouse as default theme', async () => {
      const { useSettingsStore } = await import('@/stores/settingsStore')
      expect(useSettingsStore.getState().theme).toBe('toulouse')
    })

    it('has correct default quiz settings', async () => {
      const { useSettingsStore } = await import('@/stores/settingsStore')
      const quizSettings = useSettingsStore.getState().quizSettings
      expect(quizSettings.defaultQuestionCount).toBe(20)
      expect(quizSettings.showTimer).toBe(true)
      expect(quizSettings.timerDuration).toBe(1200)
      expect(quizSettings.shuffleQuestions).toBe(true)
      expect(quizSettings.shuffleChoices).toBe(true)
      expect(quizSettings.showExplanations).toBe(true)
    })

    it('has Ollama disabled by default', async () => {
      const { useSettingsStore } = await import('@/stores/settingsStore')
      const ollamaSettings = useSettingsStore.getState().ollamaSettings
      expect(ollamaSettings.enabled).toBe(false)
      expect(ollamaSettings.apiUrl).toBe('http://localhost:11434')
      expect(ollamaSettings.model).toBe('mistral:7b-instruct')
    })
  })

  describe('setTheme', () => {
    it('updates theme', async () => {
      const { useSettingsStore } = await import('@/stores/settingsStore')
      act(() => {
        useSettingsStore.getState().setTheme('nocturne')
      })
      expect(useSettingsStore.getState().theme).toBe('nocturne')
    })

    it('applies theme to document', async () => {
      const { useSettingsStore } = await import('@/stores/settingsStore')
      act(() => {
        useSettingsStore.getState().setTheme('ocean')
      })
      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'ocean')
    })

    it('accepts all valid themes', async () => {
      const { useSettingsStore } = await import('@/stores/settingsStore')
      const themes: ThemeName[] = [
        'toulouse', 'nocturne', 'clown', 'azure', 'forest',
        'sunset', 'ocean', 'medical', 'lavande', 'cupcake'
      ]
      
      for (const theme of themes) {
        act(() => {
          useSettingsStore.getState().setTheme(theme)
        })
        expect(useSettingsStore.getState().theme).toBe(theme)
      }
    })
  })

  describe('setQuizSettings', () => {
    it('updates individual settings', async () => {
      const { useSettingsStore } = await import('@/stores/settingsStore')
      act(() => {
        useSettingsStore.getState().setQuizSettings({ defaultQuestionCount: 30 })
      })
      expect(useSettingsStore.getState().quizSettings.defaultQuestionCount).toBe(30)
    })

    it('preserves other settings when updating one', async () => {
      const { useSettingsStore } = await import('@/stores/settingsStore')
      act(() => {
        useSettingsStore.getState().setQuizSettings({ showTimer: false })
      })
      const settings = useSettingsStore.getState().quizSettings
      expect(settings.showTimer).toBe(false)
      expect(settings.defaultQuestionCount).toBe(20) // preserved
      expect(settings.shuffleQuestions).toBe(true) // preserved
    })

    it('updates multiple settings at once', async () => {
      const { useSettingsStore } = await import('@/stores/settingsStore')
      act(() => {
        useSettingsStore.getState().setQuizSettings({
          defaultQuestionCount: 10,
          showTimer: false,
          shuffleQuestions: false,
        })
      })
      const settings = useSettingsStore.getState().quizSettings
      expect(settings.defaultQuestionCount).toBe(10)
      expect(settings.showTimer).toBe(false)
      expect(settings.shuffleQuestions).toBe(false)
    })
  })

  describe('setOllamaSettings', () => {
    it('enables Ollama', async () => {
      const { useSettingsStore } = await import('@/stores/settingsStore')
      act(() => {
        useSettingsStore.getState().setOllamaSettings({ enabled: true })
      })
      expect(useSettingsStore.getState().ollamaSettings.enabled).toBe(true)
    })

    it('updates API URL', async () => {
      const { useSettingsStore } = await import('@/stores/settingsStore')
      act(() => {
        useSettingsStore.getState().setOllamaSettings({ apiUrl: 'http://192.168.1.100:11434' })
      })
      expect(useSettingsStore.getState().ollamaSettings.apiUrl).toBe('http://192.168.1.100:11434')
    })

    it('updates model', async () => {
      const { useSettingsStore } = await import('@/stores/settingsStore')
      act(() => {
        useSettingsStore.getState().setOllamaSettings({ model: 'llama3.2:3b' })
      })
      expect(useSettingsStore.getState().ollamaSettings.model).toBe('llama3.2:3b')
    })

    it('updates timeout', async () => {
      const { useSettingsStore } = await import('@/stores/settingsStore')
      act(() => {
        useSettingsStore.getState().setOllamaSettings({ timeout: 60000 })
      })
      expect(useSettingsStore.getState().ollamaSettings.timeout).toBe(60000)
    })

    it('preserves other settings when updating one', async () => {
      const { useSettingsStore } = await import('@/stores/settingsStore')
      act(() => {
        useSettingsStore.getState().setOllamaSettings({ enabled: true })
      })
      const settings = useSettingsStore.getState().ollamaSettings
      expect(settings.enabled).toBe(true)
      expect(settings.apiUrl).toBe('http://localhost:11434') // preserved
      expect(settings.model).toBe('mistral:7b-instruct') // preserved
    })
  })

  describe('loadSettings', () => {
    it('loads settings from database', async () => {
      const { db } = await import('@/services/db')
      const { useSettingsStore } = await import('@/stores/settingsStore')
      
      const mockSettings = {
        id: 'default',
        theme: 'nocturne' as ThemeName,
        quizSettings: {
          defaultQuestionCount: 15,
          showTimer: false,
          timerDuration: 600,
          shuffleQuestions: false,
          shuffleChoices: false,
          showExplanations: false,
        },
        ollamaSettings: {
          enabled: true,
          apiUrl: 'http://localhost:11434',
          model: 'llama3.2:3b',
          timeout: 45000,
        },
      }
      
      vi.mocked(db.settings.get).mockResolvedValueOnce(mockSettings)
      
      await act(async () => {
        await useSettingsStore.getState().loadSettings()
      })
      
      expect(useSettingsStore.getState().theme).toBe('nocturne')
      expect(useSettingsStore.getState().quizSettings.defaultQuestionCount).toBe(15)
      expect(useSettingsStore.getState().ollamaSettings.enabled).toBe(true)
    })

    it('applies theme from database', async () => {
      const { db } = await import('@/services/db')
      const { useSettingsStore } = await import('@/stores/settingsStore')
      
      const mockSettings = {
        id: 'default',
        theme: 'azure' as ThemeName,
        quizSettings: useSettingsStore.getState().quizSettings,
        ollamaSettings: useSettingsStore.getState().ollamaSettings,
      }
      
      vi.mocked(db.settings.get).mockResolvedValueOnce(mockSettings)
      mockSetAttribute.mockClear()
      
      await act(async () => {
        await useSettingsStore.getState().loadSettings()
      })
      
      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'azure')
    })
  })

  describe('saveSettings', () => {
    it('saves settings to database', async () => {
      const { db } = await import('@/services/db')
      const { useSettingsStore } = await import('@/stores/settingsStore')
      
      vi.mocked(db.settings.put).mockClear()
      
      act(() => {
        useSettingsStore.getState().setTheme('forest')
      })
      
      // saveSettings is called automatically by setTheme
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(db.settings.put).toHaveBeenCalled()
    })
  })
})
