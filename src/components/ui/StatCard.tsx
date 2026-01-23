interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'success' | 'warning' | 'error'
}

const variantClasses = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  neutral: 'text-base-content',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
}

export default function StatCard({
  title,
  value,
  description,
  icon,
  variant = 'primary',
}: StatCardProps) {
  return (
    <div className="stat bg-base-200 rounded-lg">
      {icon && <div className="stat-figure text-primary">{icon}</div>}
      <div className="stat-title">{title}</div>
      <div className={`stat-value ${variantClasses[variant]}`}>{value}</div>
      {description && <div className="stat-desc">{description}</div>}
    </div>
  )
}
