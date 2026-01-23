/**
 * ReviewSection Component
 * 
 * Displays questions due for review on the home page
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Clock, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { getReviewStats, type ReviewStats } from '@/services/spaced-repetition'

interface ReviewSectionProps {
  className?: string
}

export function ReviewSection({ className = '' }: ReviewSectionProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    loadStats()
  }, [])
  
  const loadStats = async () => {
    setIsLoading(true)
    try {
      const reviewStats = await getReviewStats()
      setStats(reviewStats)
    } catch (error) {
      console.error('Error loading review stats:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const totalDue = (stats?.dueToday || 0) + (stats?.overdue || 0)
  
  if (isLoading) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center py-8">
          <span className="loading loading-spinner loading-md" />
        </div>
      </Card>
    )
  }
  
  if (!stats || stats.totalReviewed === 0) {
    return (
      <Card className={`${className}`} title="Révision espacée">
        <div className="text-center py-4">
          <BookOpen className="mx-auto mb-3 text-base-content/50" size={40} />
          <p className="text-base-content/70 mb-4">
            Répondez à des questions pour commencer votre programme de révision espacée!
          </p>
          <Link to="/quiz">
            <Button variant="primary">
              Commencer un quiz
            </Button>
          </Link>
        </div>
      </Card>
    )
  }
  
  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <RefreshCw size={20} className="text-primary" />
          À réviser
        </h3>
        
        {totalDue > 0 && (
          <span className="badge badge-primary badge-lg">
            {totalDue} question{totalDue !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className={`stat bg-base-200 rounded-lg p-3 ${stats.overdue > 0 ? 'bg-error/10' : ''}`}>
          <div className="stat-title text-xs">En retard</div>
          <div className={`stat-value text-lg ${stats.overdue > 0 ? 'text-error' : ''}`}>
            {stats.overdue}
          </div>
        </div>
        
        <div className={`stat bg-base-200 rounded-lg p-3 ${stats.dueToday > 0 ? 'bg-warning/10' : ''}`}>
          <div className="stat-title text-xs">Aujourd'hui</div>
          <div className={`stat-value text-lg ${stats.dueToday > 0 ? 'text-warning' : ''}`}>
            {stats.dueToday}
          </div>
        </div>
        
        <div className="stat bg-base-200 rounded-lg p-3">
          <div className="stat-title text-xs">À venir</div>
          <div className="stat-value text-lg">{stats.upcoming}</div>
        </div>
        
        <div className="stat bg-base-200 rounded-lg p-3 bg-success/10">
          <div className="stat-title text-xs">Maîtrisées</div>
          <div className="stat-value text-lg text-success">{stats.mastered}</div>
        </div>
      </div>
      
      {/* Action buttons */}
      {totalDue > 0 ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <Link to="/quiz?mode=review" className="flex-1">
            <Button variant="primary" className="w-full gap-2">
              <RefreshCw size={18} />
              Réviser maintenant
            </Button>
          </Link>
          
          {stats.overdue > 0 && (
            <Link to="/quiz?mode=review&priority=overdue" className="flex-1">
              <Button variant="secondary" className="w-full gap-2">
                <AlertCircle size={18} />
                Questions en retard ({stats.overdue})
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="text-center py-2">
          <CheckCircle2 className="mx-auto mb-2 text-success" size={32} />
          <p className="text-success font-medium">Toutes vos révisions sont à jour!</p>
          <p className="text-sm text-base-content/70 mt-1">
            Revenez demain ou répondez à de nouvelles questions.
          </p>
        </div>
      )}
    </Card>
  )
}

/**
 * ReviewProgress Component
 * 
 * Shows progress through review session
 */
interface ReviewProgressProps {
  current: number
  total: number
  correctCount: number
}

export function ReviewProgress({ current, total, correctCount }: ReviewProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  const successRate = current > 0 ? Math.round((correctCount / current) * 100) : 0
  
  return (
    <div className="bg-base-200 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">
          Question {current} / {total}
        </span>
        <span className="text-sm text-base-content/70">
          {correctCount} correct{correctCount !== 1 ? 's' : ''} ({successRate}%)
        </span>
      </div>
      
      <progress 
        className="progress progress-primary w-full" 
        value={percentage} 
        max="100"
      />
    </div>
  )
}

/**
 * NextReviewInfo Component
 * 
 * Shows when the next review is scheduled
 */
interface NextReviewInfoProps {
  nextReviewDate: string | undefined
  interval: number
}

export function NextReviewInfo({ nextReviewDate, interval }: NextReviewInfoProps) {
  if (!nextReviewDate) return null
  
  const daysUntil = Math.ceil(
    (new Date(nextReviewDate).getTime() - new Date().getTime()) / 
    (1000 * 60 * 60 * 24)
  )
  
  return (
    <div className="flex items-center gap-2 text-sm text-base-content/70">
      <Clock size={14} />
      <span>
        Prochaine révision: {' '}
        {daysUntil <= 0 
          ? 'Aujourd\'hui' 
          : daysUntil === 1 
            ? 'Demain' 
            : `Dans ${daysUntil} jours`
        }
        {interval > 0 && ` (intervalle: ${interval}j)`}
      </span>
    </div>
  )
}
