import { ReactNode, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  actions?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  'aria-describedby'?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = 'md',
  'aria-describedby': ariaDescribedBy,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
      // Focus the close button when modal opens
      closeButtonRef.current?.focus()
      // Add escape key listener
      document.addEventListener('keydown', handleKeyDown)
    } else {
      dialog.close()
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose()
    }
  }

  const titleId = title ? 'modal-title' : undefined

  return (
    <dialog
      ref={dialogRef}
      className={`modal modal-bottom sm:modal-middle`}
      onClick={handleBackdropClick}
      aria-labelledby={titleId}
      aria-describedby={ariaDescribedBy}
      aria-modal="true"
    >
      <div 
        className={`modal-box ${sizeClasses[size]}`}
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 id={titleId} className="font-bold text-lg">
              {title}
            </h3>
          )}
          <button
            ref={closeButtonRef}
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            type="button"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div>{children}</div>

        {/* Actions */}
        {actions && <div className="modal-action">{actions}</div>}
      </div>
    </dialog>
  )
}
