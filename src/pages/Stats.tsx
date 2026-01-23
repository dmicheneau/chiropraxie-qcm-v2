import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '@/services/db'
import { useProgressStore } from '@/stores'
import { Card, StatCard, ProgressBar } from '@/components/ui'
import {
  Flame,
  Target,
  TrendingUp,
  Calendar,
  Award,
  BarChart3,
  RefreshCw,
  Brain,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function StatsPage() {
  const { t } = useTranslation()
  const { 
    streak, 
    totalQuestionsAnswered, 
    totalCorrect, 
    loadProgress, 
    progressByQuestion,
    reviewStats,
    loadReviewStats
  } = useProgressStore()

  // Load progress on mount
  useEffect(() => {
    loadProgress()
    loadReviewStats()
  }, [loadProgress, loadReviewStats])

  // Load questions for theme stats
  const questions = useLiveQuery(() => db.questions.toArray(), [])

  // Load sessions for history
  const sessions = useLiveQuery(
    () => db.sessions.orderBy('startedAt').reverse().limit(10).toArray(),
    []
  )

  // Calculate stats by theme
  const statsByTheme: Record<string, { total: number; correct: number }> = {}
  
  if (questions) {
    questions.forEach(q => {
      const progress = progressByQuestion.get(q.id)
      if (progress && progress.attempts > 0) {
        if (!statsByTheme[q.theme]) {
          statsByTheme[q.theme] = { total: 0, correct: 0 }
        }
        statsByTheme[q.theme].total += progress.attempts
        statsByTheme[q.theme].correct += progress.correctAttempts
      }
    })
  }

  const themes = Object.keys(statsByTheme)
  const successRate =
    totalQuestionsAnswered > 0
      ? Math.round((totalCorrect / totalQuestionsAnswered) * 100)
      : 0

  // Chart data for themes
  const themeChartData = {
    labels: themes,
    datasets: [
      {
        label: 'Taux de réussite (%)',
        data: themes.map(theme => {
          const stats = statsByTheme[theme]
          return stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
        }),
        backgroundColor: [
          'rgba(228, 0, 58, 0.7)',
          'rgba(107, 46, 140, 0.7)',
          'rgba(212, 175, 55, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(59, 130, 246, 0.7)',
        ],
        borderColor: [
          'rgb(228, 0, 58)',
          'rgb(107, 46, 140)',
          'rgb(212, 175, 55)',
          'rgb(16, 185, 129)',
          'rgb(59, 130, 246)',
        ],
        borderWidth: 1,
      },
    ],
  }

  // Doughnut chart for overall stats
  const overallChartData = {
    labels: ['Correct', 'Incorrect'],
    datasets: [
      {
        data: [totalCorrect, totalQuestionsAnswered - totalCorrect],
        backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderColor: ['rgb(16, 185, 129)', 'rgb(239, 68, 68)'],
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t('stats.title')}</h1>

      {/* Overview Stats */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={24} />
          {t('stats.overview')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Questions répondues"
            value={totalQuestionsAnswered}
            icon={<Target size={24} />}
            variant="primary"
          />
          <StatCard
            title="Réponses correctes"
            value={totalCorrect}
            icon={<Award size={24} />}
            variant="success"
          />
          <StatCard
            title="Taux de réussite"
            value={`${successRate}%`}
            icon={<TrendingUp size={24} />}
            variant="accent"
          />
          <StatCard
            title="Jours actifs"
            value={streak?.totalDaysActive || 0}
            icon={<Calendar size={24} />}
            variant="secondary"
          />
        </div>
      </section>

      {/* Streak Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Flame size={24} />
          {t('stats.streak.title')}
        </h2>
        <Card>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">
                {streak?.currentStreak || 0}
              </div>
              <p className="text-base-content/70">{t('stats.streak.current')}</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-secondary mb-2">
                {streak?.longestStreak || 0}
              </div>
              <p className="text-base-content/70">{t('stats.streak.longest')}</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-accent mb-2">
                {streak?.totalDaysActive || 0}
              </div>
              <p className="text-base-content/70">{t('stats.streak.totalDays')}</p>
            </div>
          </div>
        </Card>
      </section>

      {/* Spaced Repetition Stats */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Brain size={24} />
          Révision espacée (SM-2)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard
            title="À réviser aujourd'hui"
            value={(reviewStats?.dueToday || 0) + (reviewStats?.overdue || 0)}
            icon={<Clock size={24} />}
            variant={reviewStats?.overdue ? 'error' : 'primary'}
          />
          <StatCard
            title="En retard"
            value={reviewStats?.overdue || 0}
            icon={<RefreshCw size={24} />}
            variant="error"
          />
          <StatCard
            title="À venir"
            value={reviewStats?.upcoming || 0}
            icon={<Calendar size={24} />}
            variant="secondary"
          />
          <StatCard
            title="Maîtrisées"
            value={reviewStats?.mastered || 0}
            description="Intervalle ≥ 21 jours"
            icon={<CheckCircle2 size={24} />}
            variant="success"
          />
        </div>
        
        {/* Mastery Progress */}
        {reviewStats && reviewStats.totalReviewed > 0 && (
          <Card>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Progression vers la maîtrise</span>
                  <span className="text-sm text-base-content/70">
                    {reviewStats.mastered} / {reviewStats.totalReviewed} questions
                  </span>
                </div>
                <ProgressBar 
                  value={Math.round((reviewStats.mastered / reviewStats.totalReviewed) * 100)} 
                  variant="success"
                />
              </div>
              
              {(reviewStats.dueToday > 0 || reviewStats.overdue > 0) && (
                <div className="flex justify-center pt-2">
                  <Link to="/quiz?mode=review" className="btn btn-primary gap-2">
                    <RefreshCw size={20} />
                    Réviser maintenant ({reviewStats.dueToday + reviewStats.overdue})
                  </Link>
                </div>
              )}
            </div>
          </Card>
        )}
      </section>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Overall Progress */}
        <section>
          <Card title="Répartition globale">
            {totalQuestionsAnswered > 0 ? (
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={overallChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <p className="text-center text-base-content/70 py-8">
                Répondez à des questions pour voir vos statistiques
              </p>
            )}
          </Card>
        </section>

        {/* By Theme */}
        <section>
          <Card title={t('stats.themes')}>
            {themes.length > 0 ? (
              <div className="h-64">
                <Bar
                  data={themeChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <p className="text-center text-base-content/70 py-8">
                Répondez à des questions pour voir vos statistiques par thème
              </p>
            )}
          </Card>
        </section>
      </div>

      {/* Theme Progress Details */}
      {themes.length > 0 && (
        <section>
          <Card title="Détail par thème">
            <div className="space-y-4">
              {themes.map(theme => {
                const stats = statsByTheme[theme]
                const rate = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
                return (
                  <div key={theme}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{theme}</span>
                      <span className="text-sm text-base-content/70">
                        {stats.correct}/{stats.total} ({rate}%)
                      </span>
                    </div>
                    <ProgressBar
                      value={rate}
                      variant={rate >= 70 ? 'success' : rate >= 50 ? 'warning' : 'error'}
                    />
                  </div>
                )
              })}
            </div>
          </Card>
        </section>
      )}

      {/* Recent Sessions */}
      {sessions && sessions.length > 0 && (
        <section>
          <Card title="Sessions récentes">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Questions</th>
                    <th>Score</th>
                    <th>Résultat</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(session => {
                    const date = new Date(session.startedAt).toLocaleDateString('fr-FR')
                    const total = session.questionsIds.length
                    const score = session.score || 0
                    const percentage = Math.round((score / total) * 100)
                    return (
                      <tr key={session.id}>
                        <td>{date}</td>
                        <td>{total}</td>
                        <td>
                          {score}/{total}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              percentage >= 70
                                ? 'badge-success'
                                : percentage >= 50
                                ? 'badge-warning'
                                : 'badge-error'
                            }`}
                          >
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}
    </div>
  )
}
