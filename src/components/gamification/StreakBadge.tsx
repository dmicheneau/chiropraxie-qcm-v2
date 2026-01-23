/**
 * StreakBadge Component
 * 
 * Displays the current streak with animated fire icon
 * Shows warning state when streak is at risk
 */

import { Flame, AlertTriangle } from 'lucide-react'
import type { Streak } from '@/types'

interface StreakBadgeProps {
  streak: Streak | null
  size?: 'sm' | 'md' | 'lg'
  showRecord?: boolean
  className?: string
}

export function StreakBadge({ 
  streak, 
  size = 'md', 
  showRecord = false,
  className = '' 
}: StreakBadgeProps) {
  const currentStreak = streak?.currentStreak || 0
  const longestStreak = streak?.longestStreak || 0
  
  // Check if streak is at risk (no activity today)
  const isAtRisk = streak ? isStreakAtRisk(streak) : false
  
  // Size configurations
  const sizeConfig = {
    sm: {
      iconSize: 16,
      textSize: 'text-sm',
      padding: 'px-2 py-1',
      gap: 'gap-1'
    },
    md: {
      iconSize: 20,
      textSize: 'text-base',
      padding: 'px-3 py-1.5',
      gap: 'gap-2'
    },
    lg: {
      iconSize: 28,
      textSize: 'text-xl',
      padding: 'px-4 py-2',
      gap: 'gap-2'
    }
  }
  
  const config = sizeConfig[size]
  
  // Color based on streak value
  const getStreakColor = () => {
    if (isAtRisk) return 'text-warning'
    if (currentStreak >= 30) return 'text-error' // "On fire!"
    if (currentStreak >= 7) return 'text-primary'
    if (currentStreak >= 3) return 'text-secondary'
    return 'text-base-content/70'
  }
  
  const getBgColor = () => {
    if (isAtRisk) return 'bg-warning/10'
    if (currentStreak >= 30) return 'bg-error/10'
    if (currentStreak >= 7) return 'bg-primary/10'
    if (currentStreak >= 3) return 'bg-secondary/10'
    return 'bg-base-200'
  }
  
  return (
    <div 
      className={`
        inline-flex items-center ${config.gap} ${config.padding} 
        rounded-full ${getBgColor()} ${className}
      `}
    >
      <div className={`${getStreakColor()} ${currentStreak > 0 ? 'animate-pulse' : ''}`}>
        {isAtRisk ? (
          <AlertTriangle size={config.iconSize} />
        ) : (
          <Flame size={config.iconSize} />
        )}
      </div>
      
      <span className={`font-bold ${config.textSize} ${getStreakColor()}`}>
        {currentStreak}
      </span>
      
      {size !== 'sm' && (
        <span className={`${config.textSize} text-base-content/70`}>
          jour{currentStreak !== 1 ? 's' : ''}
        </span>
      )}
      
      {showRecord && longestStreak > currentStreak && (
        <span className="text-xs text-base-content/50 ml-1">
          (record: {longestStreak})
        </span>
      )}
      
      {isAtRisk && size !== 'sm' && (
        <span className="text-xs text-warning ml-1">
          En danger!
        </span>
      )}
    </div>
  )
}

/**
 * Check if the streak is at risk (no activity today)
 */
function isStreakAtRisk(streak: Streak): boolean {
  if (streak.currentStreak === 0) return false
  
  const today = new Date().toISOString().split('T')[0]
  const lastActivity = streak.lastActivityDate
  
  // If last activity was not today, streak is at risk
  return lastActivity !== today
}

/**
 * StreakCelebration Component
 * 
 * Shows a celebration animation when streak increases
 */
interface StreakCelebrationProps {
  newStreak: number
  isRecord?: boolean
  onComplete?: () => void
}

export function StreakCelebration({ 
  newStreak, 
  isRecord = false,
  onComplete 
}: StreakCelebrationProps) {
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 animate-fade-in"
      onClick={onComplete}
    >
      <div className="bg-base-100 rounded-2xl p-8 shadow-2xl text-center animate-bounce-in">
        <div className="text-6xl mb-4">
          <Flame className="inline-block text-primary animate-pulse" size={64} />
        </div>
        
        <h2 className="text-3xl font-bold mb-2">
          {isRecord ? 'Nouveau record!' : 'Streak!'}
        </h2>
        
        <p className="text-5xl font-black text-primary mb-4">
          {newStreak} jour{newStreak !== 1 ? 's' : ''}
        </p>
        
        <p className="text-base-content/70">
          {isRecord 
            ? 'Bravo! Vous avez battu votre record!'
            : 'Continuez comme ça!'}
        </p>
        
        <button 
          className="btn btn-primary mt-6"
          onClick={onComplete}
        >
          Super!
        </button>
      </div>
    </div>
  )
}

/**
 * StreakWarning Component
 * 
 * Shows a warning when streak is about to be lost
 */
interface StreakWarningProps {
  currentStreak: number
  hoursLeft: number
}

export function StreakWarning({ currentStreak, hoursLeft }: StreakWarningProps) {
  if (currentStreak === 0 || hoursLeft <= 0) return null
  
  return (
    <div className="alert alert-warning shadow-lg">
      <AlertTriangle size={24} />
      <div>
        <h3 className="font-bold">Streak en danger!</h3>
        <p className="text-sm">
          Répondez à au moins une question dans les {hoursLeft} prochaines heures 
          pour garder votre streak de {currentStreak} jour{currentStreak !== 1 ? 's' : ''}!
        </p>
      </div>
    </div>
  )
}
