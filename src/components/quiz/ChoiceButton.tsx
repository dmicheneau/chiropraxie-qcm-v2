interface ChoiceButtonProps {
  id: string
  text: string
  selected: boolean
  disabled: boolean
  showResult: boolean
  isCorrect: boolean
  isUserAnswer: boolean
  onClick: () => void
}

export default function ChoiceButton({
  id,
  text,
  selected,
  disabled,
  showResult,
  isCorrect,
  isUserAnswer,
  onClick,
}: ChoiceButtonProps) {
  const getButtonClass = () => {
    const baseClass = 'btn btn-lg justify-start text-left h-auto py-4 px-6 w-full'

    if (!showResult) {
      // Mode sélection
      if (selected) {
        return `${baseClass} btn-primary`
      }
      return `${baseClass} btn-outline`
    }

    // Mode résultat
    if (isCorrect) {
      return `${baseClass} btn-success`
    }
    if (isUserAnswer && !isCorrect) {
      return `${baseClass} btn-error`
    }
    return `${baseClass} btn-ghost opacity-50`
  }

  const getPrefix = () => {
    if (showResult) {
      if (isCorrect) return '✓'
      if (isUserAnswer && !isCorrect) return '✗'
    }
    return id
  }

  return (
    <button
      className={getButtonClass()}
      onClick={onClick}
      disabled={disabled || showResult}
    >
      <span className="flex items-center gap-4 w-full">
        <span
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            showResult
              ? isCorrect
                ? 'bg-success-content text-success'
                : isUserAnswer
                ? 'bg-error-content text-error'
                : 'bg-base-300'
              : selected
              ? 'bg-primary-content text-primary'
              : 'bg-base-300'
          }`}
        >
          {getPrefix()}
        </span>
        <span className="flex-1 text-base">{text}</span>
      </span>
    </button>
  )
}
