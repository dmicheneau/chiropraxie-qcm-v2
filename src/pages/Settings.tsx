import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
import { useSettingsStore } from '@/stores'
import { Card, Button } from '@/components/ui'
import type { ThemeName } from '@/types'
import {
  Palette,
  Settings2,
  Bot,
  Download,
  Upload,
  Info,
  Check,
  Shuffle,
  Clock,
  HelpCircle,
} from 'lucide-react'

// Theme configuration with preview colors
const THEMES: { name: ThemeName; label: string; colors: { primary: string; secondary: string; accent: string } }[] = [
  { name: 'toulouse', label: 'Toulouse', colors: { primary: '#e4003a', secondary: '#6b2e8c', accent: '#d4af37' } },
  { name: 'nocturne', label: 'Nocturne', colors: { primary: '#6366f1', secondary: '#a5b4fc', accent: '#c4b5fd' } },
  { name: 'clown', label: 'Clown', colors: { primary: '#f43f5e', secondary: '#fbbf24', accent: '#10b981' } },
  { name: 'azure', label: 'Azure', colors: { primary: '#0078d4', secondary: '#50e6ff', accent: '#00b294' } },
  { name: 'forest', label: 'Forest', colors: { primary: '#22c55e', secondary: '#86efac', accent: '#fbbf24' } },
  { name: 'sunset', label: 'Sunset', colors: { primary: '#f97316', secondary: '#fb923c', accent: '#fbbf24' } },
  { name: 'ocean', label: 'Ocean', colors: { primary: '#0ea5e9', secondary: '#7dd3fc', accent: '#2dd4bf' } },
  { name: 'medical', label: 'Medical', colors: { primary: '#0891b2', secondary: '#67e8f9', accent: '#06b6d4' } },
  { name: 'lavande', label: 'Lavande', colors: { primary: '#a855f7', secondary: '#c4b5fd', accent: '#f0abfc' } },
  { name: 'cupcake', label: 'Cupcake', colors: { primary: '#65c3c8', secondary: '#ef9fbc', accent: '#eeaf3a' } },
]

export default function SettingsPage() {
  const { t } = useTranslation()
  const {
    theme,
    setTheme,
    quizSettings,
    setQuizSettings,
    ollamaSettings,
    setOllamaSettings,
  } = useSettingsStore()

  // Load data for export
  const banks = useLiveQuery(() => db.banks.toArray(), [])
  const questions = useLiveQuery(() => db.questions.toArray(), [])
  const progress = useLiveQuery(() => db.progress.toArray(), [])

  // Export data as JSON
  const handleExport = () => {
    const exportData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      banks,
      questions,
      progress,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chiropraxie-qcm-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Import data from JSON
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (data.version !== '2.0') {
        alert('Version de fichier non supportée. Utilisez un export v2.0.')
        return
      }

      // Import questions
      if (data.questions?.length) {
        await db.questions.bulkPut(data.questions)
      }

      // Import banks
      if (data.banks?.length) {
        await db.banks.bulkPut(data.banks)
      }

      // Import progress
      if (data.progress?.length) {
        await db.progress.bulkPut(data.progress)
      }

      alert(`Import réussi: ${data.questions?.length || 0} questions importées.`)
    } catch (error) {
      console.error('Import error:', error)
      alert('Erreur lors de l\'import. Vérifiez le format du fichier.')
    }

    // Reset input
    event.target.value = ''
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t('settings.title')}</h1>

      {/* Theme Selection */}
      <section>
        <Card
          title={
            <span className="flex items-center gap-2">
              <Palette size={20} />
              {t('settings.themes.title')}
            </span>
          }
        >
          <p className="text-base-content/70 mb-4">{t('settings.themes.description')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {THEMES.map(themeOption => (
              <button
                key={themeOption.name}
                onClick={() => setTheme(themeOption.name)}
                className={`relative p-3 rounded-lg border-2 transition-all ${
                  theme === themeOption.name
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-base-300 hover:border-primary/50'
                }`}
              >
                {/* Color preview */}
                <div className="flex gap-1 mb-2">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: themeOption.colors.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: themeOption.colors.secondary }}
                  />
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: themeOption.colors.accent }}
                  />
                </div>
                <span className="text-sm font-medium">{themeOption.label}</span>
                {theme === themeOption.name && (
                  <div className="absolute top-1 right-1 text-primary">
                    <Check size={16} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>
      </section>

      {/* Quiz Settings */}
      <section>
        <Card
          title={
            <span className="flex items-center gap-2">
              <Settings2 size={20} />
              {t('settings.quiz.title')}
            </span>
          }
        >
          <div className="space-y-6">
            {/* Default question count */}
            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <HelpCircle size={16} />
                  {t('settings.quiz.defaultCount')}
                </span>
                <span className="label-text-alt">{quizSettings.defaultQuestionCount}</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={quizSettings.defaultQuestionCount}
                onChange={e => setQuizSettings({ defaultQuestionCount: parseInt(e.target.value) })}
                className="range range-primary"
              />
              <div className="flex justify-between text-xs px-2 mt-1">
                <span>5</span>
                <span>15</span>
                <span>25</span>
                <span>35</span>
                <span>50</span>
              </div>
            </div>

            {/* Timer settings */}
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text flex items-center gap-2">
                  <Clock size={16} />
                  {t('settings.quiz.showTimer')}
                </span>
                <input
                  type="checkbox"
                  checked={quizSettings.showTimer}
                  onChange={e => setQuizSettings({ showTimer: e.target.checked })}
                  className="toggle toggle-primary"
                />
              </label>
            </div>

            {quizSettings.showTimer && (
              <div className="form-control ml-6">
                <label className="label">
                  <span className="label-text">{t('settings.quiz.timerDuration')}</span>
                  <span className="label-text-alt">
                    {Math.floor(quizSettings.timerDuration / 60)} min
                  </span>
                </label>
                <input
                  type="range"
                  min="300"
                  max="3600"
                  step="300"
                  value={quizSettings.timerDuration}
                  onChange={e => setQuizSettings({ timerDuration: parseInt(e.target.value) })}
                  className="range range-secondary range-sm"
                />
              </div>
            )}

            {/* Shuffle questions */}
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text flex items-center gap-2">
                  <Shuffle size={16} />
                  {t('settings.quiz.shuffleQuestions')}
                </span>
                <input
                  type="checkbox"
                  checked={quizSettings.shuffleQuestions}
                  onChange={e => setQuizSettings({ shuffleQuestions: e.target.checked })}
                  className="toggle toggle-primary"
                />
              </label>
            </div>

            {/* Shuffle choices */}
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text flex items-center gap-2">
                  <Shuffle size={16} />
                  {t('settings.quiz.shuffleChoices')}
                </span>
                <input
                  type="checkbox"
                  checked={quizSettings.shuffleChoices}
                  onChange={e => setQuizSettings({ shuffleChoices: e.target.checked })}
                  className="toggle toggle-primary"
                />
              </label>
            </div>

            {/* Show explanations */}
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text flex items-center gap-2">
                  <Info size={16} />
                  {t('settings.quiz.showExplanations')}
                </span>
                <input
                  type="checkbox"
                  checked={quizSettings.showExplanations}
                  onChange={e => setQuizSettings({ showExplanations: e.target.checked })}
                  className="toggle toggle-primary"
                />
              </label>
            </div>
          </div>
        </Card>
      </section>

      {/* Ollama Settings */}
      <section>
        <Card
          title={
            <span className="flex items-center gap-2">
              <Bot size={20} />
              {t('settings.ollama.title')}
            </span>
          }
        >
          <div className="alert alert-info mb-4">
            <Info size={20} />
            <span>{t('settings.ollama.info')}</span>
          </div>

          <div className="space-y-4">
            {/* Enable Ollama */}
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">{t('settings.ollama.enable')}</span>
                <input
                  type="checkbox"
                  checked={ollamaSettings.enabled}
                  onChange={e => setOllamaSettings({ enabled: e.target.checked })}
                  className="toggle toggle-primary"
                />
              </label>
            </div>

            {ollamaSettings.enabled && (
              <>
                {/* API URL */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t('settings.ollama.apiUrl')}</span>
                  </label>
                  <input
                    type="text"
                    value={ollamaSettings.apiUrl}
                    onChange={e => setOllamaSettings({ apiUrl: e.target.value })}
                    className="input input-bordered"
                    placeholder="http://localhost:11434"
                  />
                </div>

                {/* Model */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t('settings.ollama.model')}</span>
                  </label>
                  <select
                    value={ollamaSettings.model}
                    onChange={e => setOllamaSettings({ model: e.target.value })}
                    className="select select-bordered"
                  >
                    <option value="mistral:7b-instruct">Mistral 7B (Recommandé)</option>
                    <option value="llama3.2:3b">Llama 3.2 3B (Rapide)</option>
                    <option value="phi3:mini">Phi-3 Mini (Léger)</option>
                    <option value="gemma2:2b">Gemma 2B (Ultra-léger)</option>
                  </select>
                </div>

                {/* Timeout */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t('settings.ollama.timeout')}</span>
                    <span className="label-text-alt">{ollamaSettings.timeout / 1000}s</span>
                  </label>
                  <input
                    type="range"
                    min="10000"
                    max="120000"
                    step="5000"
                    value={ollamaSettings.timeout}
                    onChange={e => setOllamaSettings({ timeout: parseInt(e.target.value) })}
                    className="range range-secondary"
                  />
                </div>
              </>
            )}
          </div>
        </Card>
      </section>

      {/* Data Management */}
      <section>
        <Card
          title={
            <span className="flex items-center gap-2">
              <Download size={20} />
              {t('settings.data.title')}
            </span>
          }
        >
          <p className="text-base-content/70 mb-4">{t('settings.data.description')}</p>

          <div className="flex flex-wrap gap-4">
            <Button onClick={handleExport} variant="primary">
              <Download size={18} />
              {t('settings.data.export')}
            </Button>

            <label className="btn btn-outline">
              <Upload size={18} />
              {t('settings.data.import')}
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          {/* Stats */}
          <div className="mt-6 stats stats-vertical lg:stats-horizontal shadow bg-base-200">
            <div className="stat">
              <div className="stat-title">Questions</div>
              <div className="stat-value text-primary">{questions?.length || 0}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Banques</div>
              <div className="stat-value text-secondary">{banks?.length || 0}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Progression</div>
              <div className="stat-value text-accent">{progress?.length || 0}</div>
            </div>
          </div>
        </Card>
      </section>

      {/* About */}
      <section>
        <Card>
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold text-primary mb-2">Chiropraxie QCM v2</h2>
            <p className="text-base-content/70">
              Application offline-first pour la révision en chiropraxie
            </p>
            <p className="text-sm text-base-content/50 mt-2">
              Version 2.0.0 • PWA • Données locales uniquement
            </p>
          </div>
        </Card>
      </section>
    </div>
  )
}
