import { Button, Card } from '@/components/ui'
import { Play, Shuffle, Filter } from 'lucide-react'
import type { Difficulty } from '@/types'

interface QuizConfigProps {
  themes: string[]
  selectedTheme: string | null
  questionCount: number
  difficulty: Difficulty | null
  shuffleQuestions: boolean
  onThemeChange: (theme: string | null) => void
  onQuestionCountChange: (count: number) => void
  onDifficultyChange: (difficulty: Difficulty | null) => void
  onShuffleChange: (shuffle: boolean) => void
  onStart: () => void
  maxQuestions: number
}

export default function QuizConfig({
  themes,
  selectedTheme,
  questionCount,
  difficulty,
  shuffleQuestions,
  onThemeChange,
  onQuestionCountChange,
  onDifficultyChange,
  onShuffleChange,
  onStart,
  maxQuestions,
}: QuizConfigProps) {

  const questionCounts = [10, 20, 30, 50].filter(c => c <= maxQuestions)
  if (maxQuestions < 10) {
    questionCounts.unshift(maxQuestions)
  }

  const difficulties: { value: Difficulty | null; label: string }[] = [
    { value: null, label: 'Toutes' },
    { value: 'easy', label: 'Facile' },
    { value: 'medium', label: 'Moyen' },
    { value: 'hard', label: 'Difficile' },
  ]

  return (
    <Card className="max-w-lg mx-auto" title="Configurer le quiz">
      {/* Theme Selection */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text flex items-center gap-2">
            <Filter size={16} />
            Thème
          </span>
        </label>
        <select
          className="select select-bordered w-full"
          value={selectedTheme || ''}
          onChange={e => onThemeChange(e.target.value || null)}
        >
          <option value="">Tous les thèmes</option>
          {themes.map(theme => (
            <option key={theme} value={theme}>
              {theme}
            </option>
          ))}
        </select>
      </div>

      {/* Question Count */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Nombre de questions</span>
        </label>
        <div className="join w-full">
          {questionCounts.map(count => (
            <button
              key={count}
              className={`join-item btn flex-1 ${
                questionCount === count ? 'btn-primary' : 'btn-outline'
              }`}
              onClick={() => onQuestionCountChange(count)}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Difficulté</span>
        </label>
        <div className="join w-full">
          {difficulties.map(d => (
            <button
              key={d.value || 'all'}
              className={`join-item btn flex-1 ${
                difficulty === d.value ? 'btn-primary' : 'btn-outline'
              }`}
              onClick={() => onDifficultyChange(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="form-control mb-6">
        <label className="label cursor-pointer">
          <span className="label-text flex items-center gap-2">
            <Shuffle size={16} />
            Mélanger les questions
          </span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={shuffleQuestions}
            onChange={e => onShuffleChange(e.target.checked)}
          />
        </label>
      </div>

      {/* Start Button */}
      <Button onClick={onStart} block size="lg">
        <Play size={20} />
        Démarrer le quiz
      </Button>
    </Card>
  )
}
