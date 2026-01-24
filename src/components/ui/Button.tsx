import { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'error' | 'success'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  block?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  ghost: 'btn-ghost',
  outline: 'btn-outline',
  error: 'btn-error',
  success: 'btn-success',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  className = '',
  disabled,
  'aria-label': ariaLabel,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${
        block ? 'btn-block' : ''
      } ${className}`}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span 
          className="loading loading-spinner loading-sm" 
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
