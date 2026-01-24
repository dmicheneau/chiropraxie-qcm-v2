/**
 * Onboarding Component
 * 
 * Shows welcome screens on first launch to introduce the app
 */

import { useState } from 'react'
import { 
  BookOpen, 
  Brain, 
  Flame, 
  Upload, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui'

interface OnboardingProps {
  onComplete: () => void
}

interface Step {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}

const steps: Step[] = [
  {
    icon: <BookOpen size={64} />,
    title: 'Bienvenue sur Chiropraxie QCM',
    description: 'Votre application de révision pour la chiropraxie. Révisez où vous voulez, même sans connexion internet.',
    color: 'text-primary'
  },
  {
    icon: <Upload size={64} />,
    title: 'Importez vos contenus',
    description: 'Importez facilement vos flashcards Quizlet, PDF de cours ou photos de notes manuscrites.',
    color: 'text-secondary'
  },
  {
    icon: <Sparkles size={64} />,
    title: 'IA locale pour générer des QCM',
    description: 'Utilisez Ollama (IA locale) pour générer automatiquement des questions depuis vos contenus. 100% privé, aucune donnée envoyée.',
    color: 'text-accent'
  },
  {
    icon: <Brain size={64} />,
    title: 'Révision espacée (SM-2)',
    description: 'L\'algorithme SM-2 optimise vos révisions en vous présentant les questions au moment idéal pour une mémorisation durable.',
    color: 'text-info'
  },
  {
    icon: <Flame size={64} />,
    title: 'Gardez votre streak!',
    description: 'Révisez chaque jour pour maintenir votre streak. Suivez votre progression et atteignez vos objectifs.',
    color: 'text-error'
  }
]

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const step = steps[currentStep]
  
  const goNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }
  
  const goPrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }
  
  const skip = () => {
    onComplete()
  }
  
  return (
    <div 
      className="fixed inset-0 bg-base-100 z-50 flex flex-col items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Présentation de l'application"
    >
      {/* Skip button */}
      <button 
        onClick={skip}
        className="absolute top-4 right-4 btn btn-ghost btn-sm"
        aria-label="Passer l'introduction"
      >
        Passer
      </button>
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md text-center">
        {/* Icon */}
        <div className={`mb-8 ${step.color}`}>
          {step.icon}
        </div>
        
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold mb-4">
          {step.title}
        </h1>
        
        {/* Description */}
        <p className="text-base-content/70 text-lg mb-8">
          {step.description}
        </p>
        
        {/* Progress dots */}
        <div className="flex gap-2 mb-8" role="tablist" aria-label="Étapes de l'introduction">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentStep 
                  ? 'bg-primary w-8' 
                  : 'bg-base-300 hover:bg-base-content/30'
              }`}
              role="tab"
              aria-selected={index === currentStep}
              aria-label={`Étape ${index + 1} sur ${steps.length}`}
            />
          ))}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex gap-4 w-full max-w-md">
        {!isFirstStep && (
          <Button 
            variant="ghost" 
            onClick={goPrev}
            aria-label="Étape précédente"
          >
            <ChevronLeft size={20} />
            Précédent
          </Button>
        )}
        
        <Button 
          variant="primary"
          className="flex-1"
          onClick={goNext}
          aria-label={isLastStep ? 'Commencer à utiliser l\'application' : 'Étape suivante'}
        >
          {isLastStep ? (
            <>
              <Check size={20} />
              Commencer
            </>
          ) : (
            <>
              Suivant
              <ChevronRight size={20} />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
