import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
import { createDefaultQuestionBank } from '@/data/defaultBank'
import { useProgressStore, useSettingsStore } from '@/stores'
import { Button, Card, StatCard } from '@/components/ui'
import { 
  StreakBadge, 
  StreakCelebration, 
  StreakWarning,
  ReviewSection 
} from '@/components/gamification'
import {
  Play,
  BookOpen,
  Target,
  Flame,
  TrendingUp,
  Award,
  RefreshCw,
} from 'lucide-react'

export default function HomePage() {
  const { t } = useTranslation()
  const { 
    streak, 
    totalQuestionsAnswered, 
    totalCorrect, 
    loadProgress,
    checkStreakStatus 
  } = useProgressStore()
  const { loadSettings } = useSettingsStore()
  
  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationStreak, setCelebrationStreak] = useState(0)
  const [isNewRecord, setIsNewRecord] = useState(false)
  
  // Trigger celebration when streak is a milestone
  useEffect(() => {
    if (streak && streak.currentStreak > 0) {
      const milestones = [3, 7, 14, 30, 60, 100]
      if (milestones.includes(streak.currentStreak)) {
        setCelebrationStreak(streak.currentStreak)
        setIsNewRecord(streak.currentStreak >= streak.longestStreak)
        setShowCelebration(true)
      }
    }
  }, [streak])

  // Load data on mount
  useEffect(() => {
    loadProgress()
    loadSettings()
  }, [loadProgress, loadSettings])

  // Initialize default bank if needed
  useEffect(() => {
    const initBank = async () => {
      try {
        const existingBank = await db.banks.get('default')
        if (!existingBank) {
          const defaultBank = createDefaultQuestionBank()
          await db.banks.add(defaultBank)
          
          // Add questions in a transaction for better performance
          await db.transaction('rw', db.questions, async () => {
            await db.questions.bulkAdd(defaultBank.questions)
          })
        }
      } catch (error) {
        console.error('Error initializing default bank:', error)
      }
    }
    initBank()
  }, [])

  // Load question bank (READ ONLY)
  const bank = useLiveQuery(async () => {
    return await db.banks.get('default')
  }, [])

  // Calculate success rate
  const successRate =
    totalQuestionsAnswered > 0
      ? Math.round((totalCorrect / totalQuestionsAnswered) * 100)
      : 0

  // Check streak status
  const streakStatus = checkStreakStatus()

  return (
    <div className="space-y-8">
      {/* Celebration Modal */}
      {showCelebration && (
        <StreakCelebration
          newStreak={celebrationStreak}
          isRecord={isNewRecord}
          onComplete={() => setShowCelebration(false)}
        />
      )}
      
      {/* Streak Warning */}
      {streakStatus.isAtRisk && streak && streak.currentStreak > 0 && (
        <StreakWarning 
          currentStreak={streak.currentStreak} 
          hoursLeft={streakStatus.hoursUntilMidnight} 
        />
      )}
      
      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
          {t('app.title')}
        </h1>
        <p className="text-xl text-base-content/70 mb-6">{t('app.subtitle')}</p>
        
        {/* Streak Badge */}
        {streak && (
          <div className="flex justify-center mb-6">
            <StreakBadge streak={streak} size="lg" showRecord />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/quiz">
            <Button size="lg">
              <Play size={24} />
              {t('home.startQuiz')}
            </Button>
          </Link>
          
          <Link to="/quiz?mode=review">
            <Button size="lg" variant="secondary">
              <RefreshCw size={24} />
              Mode révision
            </Button>
          </Link>
        </div>
      </section>

      {/* Review Section */}
      <ReviewSection />

      {/* Stats Grid */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title={t('home.stats.totalQuestions')}
            value={bank?.metadata.totalQuestions || 0}
            icon={<BookOpen size={24} />}
            variant="primary"
          />
          <StatCard
            title={t('home.stats.questionsAnswered')}
            value={totalQuestionsAnswered}
            icon={<Target size={24} />}
            variant="secondary"
          />
          <StatCard
            title={t('home.stats.successRate')}
            value={`${successRate}%`}
            icon={<TrendingUp size={24} />}
            variant="accent"
          />
          <StatCard
            title={t('home.stats.currentStreak')}
            value={streak?.currentStreak || 0}
            description={
              streak?.longestStreak
                ? `Record: ${streak.longestStreak} jours`
                : undefined
            }
            icon={<Flame size={24} />}
            variant="primary"
          />
        </div>
      </section>

      {/* Streak Motivation */}
      {streak && streak.currentStreak > 0 && (
        <section>
          <Card className="bg-gradient-to-r from-primary/20 to-secondary/20">
            <div className="flex items-center gap-4">
              <div className="text-6xl">
                <Flame className="text-primary" size={48} />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {streak.currentStreak} jour{streak.currentStreak > 1 ? 's' : ''} consécutif
                  {streak.currentStreak > 1 ? 's' : ''}!
                </h3>
                <p className="text-base-content/70">
                  {streak.currentStreak >= streak.longestStreak 
                    ? "C'est votre meilleur score! Continuez!"
                    : `Continuez comme ça pour battre votre record de ${streak.longestStreak} jours!`
                  }
                </p>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Actions rapides</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/quiz">
            <Card className="hover:shadow-2xl transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Play size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Quiz rapide</h3>
                  <p className="text-sm text-base-content/70">20 questions</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/stats">
            <Card className="hover:shadow-2xl transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <TrendingUp size={24} className="text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">Statistiques</h3>
                  <p className="text-sm text-base-content/70">Voir ma progression</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/settings">
            <Card className="hover:shadow-2xl transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/20 rounded-lg">
                  <Award size={24} className="text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">Personnaliser</h3>
                  <p className="text-sm text-base-content/70">Thèmes et options</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* Themes Info */}
      {bank && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Thèmes disponibles</h2>
          <div className="flex flex-wrap gap-2">
            {bank.metadata.themes.map(theme => (
              <span key={theme} className="badge badge-primary badge-lg">
                {theme}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
