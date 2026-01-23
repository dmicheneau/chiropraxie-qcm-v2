import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: ReactNode
  actions?: ReactNode
  compact?: boolean
}

export default function Card({
  children,
  className = '',
  title,
  actions,
  compact = false,
}: CardProps) {
  return (
    <div className={`card bg-base-200 shadow-xl ${className}`}>
      <div className={`card-body ${compact ? 'p-4' : ''}`}>
        {title && <h2 className="card-title">{title}</h2>}
        {children}
        {actions && <div className="card-actions justify-end mt-4">{actions}</div>}
      </div>
    </div>
  )
}
