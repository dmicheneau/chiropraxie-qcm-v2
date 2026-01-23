interface ProgressBarProps {
  value: number // 0-100
  max?: number
  className?: string
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const variantClasses = {
  primary: 'progress-primary',
  secondary: 'progress-secondary',
  accent: 'progress-accent',
  success: 'progress-success',
  warning: 'progress-warning',
  error: 'progress-error',
}

const sizeClasses = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
}

export default function ProgressBar({
  value,
  max = 100,
  className = '',
  variant = 'primary',
  size = 'md',
  showLabel = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      <progress
        className={`progress ${variantClasses[variant]} ${sizeClasses[size]} w-full`}
        value={value}
        max={max}
      />
    </div>
  )
}
