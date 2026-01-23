import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { db } from '@/services/db'
import { createDefaultQuestionBank } from '@/data/defaultBank'
import type { QuestionBank } from '@/types'

export default function HomePage() {
  const { t } = useTranslation()
  const [bank, setBank] = useState<QuestionBank | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrCreateBank() {
      try {
        // Vérifier si la banque par défaut existe
        let existingBank = await db.banks.get('default')

        if (!existingBank) {
          // Créer et sauvegarder la banque par défaut
          const defaultBank = createDefaultQuestionBank()
          await db.banks.add(defaultBank)

          // Ajouter les questions à la table questions
          for (const question of defaultBank.questions) {
            await db.questions.add(question)
          }

          existingBank = defaultBank
        }

        setBank(existingBank)
      } catch (error) {
        console.error('Error loading question bank:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrCreateBank()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold text-primary mb-4">{t('app.title')}</h1>
        <p className="text-xl text-base-content opacity-70">{t('app.subtitle')}</p>
      </header>

      {/* Welcome Card */}
      <div className="card bg-base-200 shadow-xl max-w-2xl mx-auto">
        <div className="card-body">
          <h2 className="card-title text-3xl mb-4">{t('home.welcome')}</h2>
          <p className="text-lg mb-6">{t('home.description')}</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="stat bg-base-100 rounded-lg">
              <div className="stat-title">{t('home.stats.totalQuestions')}</div>
              <div className="stat-value text-primary">{bank?.metadata.totalQuestions || 0}</div>
            </div>
            <div className="stat bg-base-100 rounded-lg">
              <div className="stat-title">{t('home.stats.questionsAnswered')}</div>
              <div className="stat-value text-secondary">0</div>
            </div>
          </div>

          {/* Actions */}
          <div className="card-actions justify-center mt-6">
            <button className="btn btn-primary btn-lg">{t('home.startQuiz')}</button>
          </div>
        </div>
      </div>

      {/* Themes Preview */}
      <div className="mt-12 text-center">
        <h3 className="text-2xl font-bold mb-6">Thèmes disponibles</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            'toulouse',
            'nocturne',
            'clown',
            'azure',
            'forest',
            'sunset',
            'ocean',
            'medical',
            'lavande',
            'cupcake',
          ].map(theme => (
            <button
              key={theme}
              className="btn btn-outline"
              onClick={() => {
                document.documentElement.setAttribute('data-theme', theme)
              }}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center mt-12 text-base-content opacity-50">
        <p>Chiropraxie QCM V2 - Offline PWA avec IA locale</p>
        <p className="text-sm mt-2">Phase 0: Setup Complete ✓</p>
      </footer>
    </div>
  )
}
